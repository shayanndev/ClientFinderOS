import os
import json
from google import genai
from google.genai import types


def generate_messages(niche, lead, audit):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")

    client = genai.Client(api_key=api_key)

    problems = audit.problems_found or "No specific issues detected"
    recommendations = audit.recommendations or ""
    platform = audit.platform_detected or "unknown"

    prompt = f"""You are an expert B2B sales copywriter specializing in personalized cold outreach.
Write outreach messages for a freelancer reaching out to a potential client.

FREELANCER INFO:
- Service: {niche.service_offer}
- Target Client Type: {niche.target_client}
- Tone: {niche.tone or 'professional and helpful'}
- Call to Action: {niche.call_to_action}

LEAD INFO:
- Business: {lead.business_name}
- Website Platform: {platform}
- Issues Found on Website: {problems}
- Recommendations: {recommendations}

STRICT RULES:
- Messages must be SHORT (under 100 words each)
- Mention exactly ONE specific real issue found on their website
- NO fake claims, NO pressure tactics, NO spam language
- Sound human and genuine, not robotic
- Soft CTA at the end

Return ONLY valid JSON with these exact keys:
{{
  "first_message": "...",
  "followup_1": "...",
  "followup_2": "...",
  "proposal_summary": "...",
  "lead_reason": "..."
}}"""

    try:
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.7,
                max_output_tokens=1024,
            )
        )
        result = json.loads(response.text)
        return result
    except json.JSONDecodeError:
        # Try to extract JSON from the response text
        text = response.text
        start = text.find('{')
        end = text.rfind('}') + 1
        if start != -1 and end > start:
            return json.loads(text[start:end])
        raise ValueError("Could not parse JSON from Gemini response")
    except Exception as e:
        print(f"Error generating AI messages: {e}")
        return None
