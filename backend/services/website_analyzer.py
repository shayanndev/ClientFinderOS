import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
import re

def analyze_website(url: str):
    if not url.startswith("http"):
        url = "https://" + url

    result = {
        "domain": "",
        "page_title": "",
        "meta_description": "",
        "ssl_status": url.startswith("https"),
        "mobile_viewport": False,
        "contact_page_found": False,
        "email_found": False,
        "phone_found": False,
        "platform_detected": "unknown",
        "ecommerce_detected": False,
        "checkout_detected": False,
        "quote_form_detected": False,
        "problems_found": [],
        "recommendations": []
    }

    try:
        parsed_url = urlparse(url)
        result["domain"] = parsed_url.netloc

        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            result["problems_found"].append(f"Website returned status code {response.status_code}")
            return result

        soup = BeautifulSoup(response.text, "html.parser")

        # Basic metadata
        if soup.title:
            result["page_title"] = soup.title.string

        meta_desc = soup.find("meta", attrs={"name": "description"})
        if meta_desc:
            result["meta_description"] = meta_desc.get("content", "")
        else:
            result["problems_found"].append("Missing meta description")

        # Mobile Viewport
        viewport = soup.find("meta", attrs={"name": "viewport"})
        if viewport:
            result["mobile_viewport"] = True
        else:
            result["problems_found"].append("Missing mobile viewport tag")

        # Contact & Email & Phone
        page_text = soup.get_text()
        emails = re.findall(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", page_text)
        if emails:
            result["email_found"] = True

        phones = re.findall(r"\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}", page_text)
        if phones:
            result["phone_found"] = True

        for link in soup.find_all("a", href=True):
            href = link["href"].lower()
            if "contact" in href:
                result["contact_page_found"] = True
            if "quote" in href:
                result["quote_form_detected"] = True

        # Platform detection
        html_str = str(soup).lower()
        if "/wp-content/" in html_str:
            result["platform_detected"] = "WordPress"
            if "woocommerce" in html_str or "wc-cart" in html_str:
                result["platform_detected"] = "WooCommerce"
                result["ecommerce_detected"] = True
        elif "cdn.shopify.com" in html_str:
            result["platform_detected"] = "Shopify"
            result["ecommerce_detected"] = True
        elif "_next/static" in html_str:
            result["platform_detected"] = "Next.js"
        elif "laravel" in html_str:
            result["platform_detected"] = "Laravel"

        if "cart" in html_str or "checkout" in html_str:
            result["checkout_detected"] = True
            result["ecommerce_detected"] = True

        # Generate recommendations based on problems
        for problem in result["problems_found"]:
            if "mobile viewport" in problem:
                result["recommendations"].append("Add a responsive viewport tag to make the site mobile-friendly.")
            if "meta description" in problem:
                result["recommendations"].append("Add a meta description to improve SEO.")

        # Convert lists to strings for the database
        result["problems_found"] = "; ".join(result["problems_found"])
        result["recommendations"] = "; ".join(result["recommendations"])

    except Exception as e:
        result["problems_found"] = f"Error fetching website: {str(e)}"
        result["recommendations"] = ""

    return result
