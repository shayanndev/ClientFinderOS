from models import Lead, Niche, WebsiteAudit

def score_lead(lead: Lead, niche: Niche, audit: WebsiteAudit, is_duplicate: bool = False):
    score = 0
    reasons = []

    if is_duplicate:
        return 0, "Duplicate lead (-100)"

    # Check industry match (simplification: checking niche positive keywords in audit page title/desc)
    positive_kw = [kw.strip().lower() for kw in niche.positive_keywords.split(",")] if niche.positive_keywords else []
    negative_kw = [kw.strip().lower() for kw in niche.negative_keywords.split(",")] if niche.negative_keywords else []
    
    audit_text = f"{audit.page_title} {audit.meta_description}".lower()

    niche_match_found = False
    for kw in positive_kw:
        if kw and kw in audit_text:
            score += 25
            reasons.append(f"Website matches niche keyword '{kw}' (+25)")
            niche_match_found = True
            break
            
    if not niche_match_found and positive_kw:
        score -= 30
        reasons.append("Poor niche match (-30)")

    # Negative keywords
    for kw in negative_kw:
        if kw and kw in audit_text:
            score -= 50
            reasons.append(f"Negative keyword found '{kw}' (-50)")
            break

    # Visible website issues
    if audit.problems_found:
        score += 20
        reasons.append("Visible website issue found (+20)")

    # Contact method
    if audit.email_found or audit.contact_page_found or lead.email:
        score += 15
        reasons.append("Contact method found (+15)")
    else:
        score -= 20
        reasons.append("No contact method (-20)")

    # Commercial intent
    if audit.ecommerce_detected or audit.quote_form_detected or audit.checkout_detected:
        score += 15
        reasons.append("Business appears commercial (+15)")

    # Country match
    if lead.country and niche.target_countries:
        target_countries = [c.strip().lower() for c in niche.target_countries.split(",")]
        if lead.country.lower() in target_countries:
            score += 10
            reasons.append("Target country matches (+10)")

    # Tech stack match
    if audit.platform_detected != "unknown" and niche.tech_stack:
        tech_stack = [t.strip().lower() for t in niche.tech_stack.split(",")]
        if audit.platform_detected.lower() in tech_stack:
            score += 10
            reasons.append(f"Stack matches user skill '{audit.platform_detected}' (+10)")

    # Urgency keywords
    urgency_kw = ["broken", "error", "down", "help", "slow", "urgent", "fix"]
    for kw in urgency_kw:
        if kw in audit_text:
            score += 10
            reasons.append(f"Urgency keyword found '{kw}' (+10)")
            break

    # Clamp score
    score = max(0, min(100, score))

    # Temperature
    if score >= 80:
        temp = "Hot"
    elif score >= 50:
        temp = "Warm"
    elif score >= 20:
        temp = "Cold"
    else:
        temp = "Ignore"

    return score, temp, "; ".join(reasons)
