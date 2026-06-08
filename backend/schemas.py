from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class NicheBase(BaseModel):
    name: str
    target_client: Optional[str] = None
    service_offer: Optional[str] = None
    tech_stack: Optional[str] = None
    ideal_client_problem: Optional[str] = None
    target_industries: Optional[str] = None
    target_countries: Optional[str] = None
    min_budget: Optional[int] = 0
    positive_keywords: Optional[str] = None
    negative_keywords: Optional[str] = None
    tone: Optional[str] = None
    offer_type: Optional[str] = None
    call_to_action: Optional[str] = None
    daily_lead_goal: Optional[int] = 10
    daily_message_limit: Optional[int] = 50
    is_active: Optional[bool] = True

class NicheCreate(NicheBase):
    pass

class Niche(NicheBase):
    id: int
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True

class LeadBase(BaseModel):
    niche_id: int
    source_id: Optional[int] = None
    business_name: str
    website: str
    domain: str
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    platform: Optional[str] = None
    profile_url: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class Lead(LeadBase):
    id: int
    score: int
    temperature: Optional[str] = None
    score_reason: Optional[str] = None
    estimated_value: Optional[float] = None
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class MessageBase(BaseModel):
    lead_id: int
    platform: str
    message_type: str
    message_text: str
    status: str = "Pending Review"

class MessageCreate(MessageBase):
    pass

class Message(MessageBase):
    id: int
    approved_at: Optional[datetime] = None
    sent_at: Optional[datetime] = None
    failed_reason: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
