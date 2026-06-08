import requests
from bs4 import BeautifulSoup
import re
from urllib.parse import urlparse, quote_plus

def generate_search_queries(niche, source):
    """Generate search queries based on niche positive keywords and source keyword."""
    queries = []
    base_keyword = source.keyword or ""
    location = source.location or ""
    country = source.country or ""

    if base_keyword:
        queries.append(f"{base_keyword} {location}".strip())
        queries.append(f"{base_keyword} {country} contact email".strip())

    if niche.positive_keywords:
        for kw in niche.positive_keywords.split(",")[:3]:
            kw = kw.strip()
            if kw:
                queries.append(f"{kw} {location} contact".strip())

    return list(set(queries))[:5]  # dedupe, max 5 queries


def google_search_results(query: str, max_results: int = 10):
    """Scrape DuckDuckGo HTML search results (no API key needed, respectful)."""
    url = f"https://duckduckgo.com/html/?q={quote_plus(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    results = []
    try:
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")

        for result in soup.select(".result__body")[:max_results]:
            title_tag = result.select_one(".result__a")
            snippet_tag = result.select_one(".result__snippet")
            link_tag = result.select_one(".result__url")

            title = title_tag.get_text() if title_tag else ""
            snippet = snippet_tag.get_text() if snippet_tag else ""
            raw_link = link_tag.get_text().strip() if link_tag else ""

            if raw_link and not raw_link.startswith("http"):
                raw_link = "https://" + raw_link

            if raw_link:
                domain = urlparse(raw_link).netloc
                results.append({
                    "title": title,
                    "snippet": snippet,
                    "url": raw_link,
                    "domain": domain,
                })

    except Exception as e:
        print(f"Search error for query '{query}': {e}")

    return results


def extract_lead_data(url: str):
    """Visit a URL and extract basic business contact info."""
    if not url.startswith("http"):
        url = "https://" + url

    data = {
        "business_name": "",
        "website": url,
        "domain": urlparse(url).netloc,
        "email": None,
        "phone": None,
    }

    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        resp = requests.get(url, headers=headers, timeout=8)
        soup = BeautifulSoup(resp.text, "html.parser")

        if soup.title:
            data["business_name"] = soup.title.string.split("|")[0].split("-")[0].strip()

        page_text = soup.get_text()
        emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", page_text)
        # Filter out common no-reply and example addresses
        valid_emails = [e for e in emails if not any(x in e.lower() for x in ["example", "noreply", "no-reply", "support@sentry", "schema"])]
        if valid_emails:
            data["email"] = valid_emails[0]

        phones = re.findall(r"(?:\+1\s?)?(?:\(\d{3}\)|\d{3})[\s.\-]?\d{3}[\s.\-]?\d{4}", page_text)
        if phones:
            data["phone"] = phones[0].strip()

    except Exception as e:
        print(f"Error extracting lead data from {url}: {e}")

    return data


def check_negative_keywords(text: str, niche):
    """Return True if negative keywords are found in the text."""
    if not niche.negative_keywords:
        return False
    text_lower = text.lower()
    for kw in niche.negative_keywords.split(","):
        kw = kw.strip().lower()
        if kw and kw in text_lower:
            return True
    return False


def run_research_for_source(source, niche, db):
    """Main research function. Finds leads from search results for a given source."""
    from models import Lead, LeadSource
    from services.website_analyzer import analyze_website
    from services.lead_scorer import score_lead
    import models
    from datetime import datetime

    queries = generate_search_queries(niche, source)
    raw_results = []

    for q in queries:
        results = google_search_results(q, max_results=source.max_results_per_run // len(queries) + 1)
        raw_results.extend(results)

    leads_saved = 0
    seen_domains = set()

    # Pre-load existing domains to avoid duplicates
    existing = db.query(models.Lead.domain).all()
    existing_domains = {row[0] for row in existing}

    for result in raw_results:
        domain = result.get("domain", "")

        # Skip empties, duplicates, and self-referential
        if not domain or domain in seen_domains or domain in existing_domains:
            continue

        # Skip if negative keyword in title+snippet
        combined_text = f"{result.get('title','')} {result.get('snippet','')}"
        if check_negative_keywords(combined_text, niche):
            continue

        seen_domains.add(domain)

        # Extract contact data from the website
        lead_data = extract_lead_data(result["url"])

        # Only save if we found a business name
        if not lead_data["business_name"]:
            lead_data["business_name"] = result.get("title", domain)

        # Build the lead
        db_lead = models.Lead(
            niche_id=niche.id,
            source_id=source.id,
            business_name=lead_data["business_name"],
            website=lead_data["website"],
            domain=lead_data["domain"],
            email=lead_data["email"],
            phone=lead_data["phone"],
            country=source.country or None,
            status="Researched",
        )

        try:
            db.add(db_lead)
            db.flush()  # get the ID without committing

            # Analyze the website
            audit_data = analyze_website(lead_data["website"])
            db_audit = models.WebsiteAudit(lead_id=db_lead.id, **audit_data)
            db.add(db_audit)
            db.flush()

            # Score the lead
            score, temp, reason = score_lead(db_lead, niche, db_audit)
            db_lead.score = score
            db_lead.temperature = temp
            db_lead.score_reason = reason
            db_lead.status = "Scored"

            db.commit()
            leads_saved += 1

        except Exception as e:
            db.rollback()
            print(f"Error saving lead {domain}: {e}")

    # Update last_run_at
    source.last_run_at = datetime.utcnow()
    db.commit()

    return leads_saved
