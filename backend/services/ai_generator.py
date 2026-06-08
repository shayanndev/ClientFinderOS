import os
import json
import google.generativeai as genai
from models import Niche, Lead, WebsiteAudit

def generate_messages(niche: Niche, lead: Lead, audit: WebsiteAudit):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set")
    
    genai.configure(api_key=api_key)
    
    model = genai.GenerativeModel('gemini-1.5-flash', generation_config={"response_mime_type": "application/json"})
    
    prompt = f"""
    You are an expert sales copywriter. Your goal is to write personalized outreach messages to a potential client.
    
    Niche Details:
    - Target Client: {niche.target_client}
    - Service Offer: {niche.service_offer}
    - Tone: {niche.tone}
    - CTA: {niche.call_to_action}
    
    Lead Details:
    - Name/Business: {lead.business_name}
    - Platform Detected: {audit.platform_detected}
    - Problems Found on Website: {audit.problems_found}
    - Recommendations: {audit.recommendations}
    
    Write the following in JSON format:
    1. first_message: A short, highly personalized initial outreach message mentioning a specific problem found and asking if they want the CTA. NO fake claims. NO aggressive sales tone.
    2. followup_1: A short follow-up message if they don't reply to the first message.
    3. followup_2: A final break-up message.
    4. proposal_summary: A brief 2-sentence summary of what we can offer them based on the audit.
    5. lead_reason: Why this lead is a good fit based on the problems found.
    
    Format the response as a JSON object with keys: "first_message", "followup_1", "followup_2", "proposal_summary", "lead_reason".
    """
    
    try:
        response = model.generate_content(prompt)
        result = json.loads(response.text)
        return result
    except Exception as e:
        print(f"Error generating AI messages: {e}")
        return None
