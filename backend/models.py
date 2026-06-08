from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Float, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    niches = relationship("Niche", back_populates="user")
    platform_accounts = relationship("PlatformAccount", back_populates="user")
    settings = relationship("Settings", back_populates="user", uselist=False)

class Niche(Base):
    __tablename__ = "niches"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    name = Column(String, index=True)
    target_client = Column(String)
    service_offer = Column(Text)
    tech_stack = Column(String)
    ideal_client_problem = Column(Text)
    target_industries = Column(String)
    target_countries = Column(String)
    min_budget = Column(Integer, default=0)
    positive_keywords = Column(Text)
    negative_keywords = Column(Text)
    tone = Column(String)
    offer_type = Column(String)
    call_to_action = Column(Text)
    daily_lead_goal = Column(Integer, default=10)
    daily_message_limit = Column(Integer, default=50)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="niches")
    lead_sources = relationship("LeadSource", back_populates="niche")
    leads = relationship("Lead", back_populates="niche")

class LeadSource(Base):
    __tablename__ = "lead_sources"
    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(Integer, ForeignKey("niches.id"))
    source_name = Column(String)
    source_type = Column(String)
    keyword = Column(String)
    location = Column(String)
    country = Column(String)
    max_results_per_run = Column(Integer, default=30)
    run_frequency = Column(String)
    auto_research_enabled = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    last_run_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    niche = relationship("Niche", back_populates="lead_sources")
    leads = relationship("Lead", back_populates="source")

class Lead(Base):
    __tablename__ = "leads"
    id = Column(Integer, primary_key=True, index=True)
    niche_id = Column(Integer, ForeignKey("niches.id"))
    source_id = Column(Integer, ForeignKey("lead_sources.id"), nullable=True)
    business_name = Column(String, index=True)
    website = Column(String)
    domain = Column(String, index=True)
    email = Column(String, index=True, nullable=True)
    phone = Column(String, nullable=True)
    country = Column(String, nullable=True)
    platform = Column(String, nullable=True)
    profile_url = Column(String, nullable=True)
    score = Column(Integer, default=0)
    temperature = Column(String) # Hot, Warm, Cold, Ignore
    score_reason = Column(Text, nullable=True)
    estimated_value = Column(Float, nullable=True)
    status = Column(String, default="New Lead")
    duplicate_key = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    niche = relationship("Niche", back_populates="leads")
    source = relationship("LeadSource", back_populates="leads")
    website_audit = relationship("WebsiteAudit", back_populates="lead", uselist=False)
    messages = relationship("Message", back_populates="lead")

class WebsiteAudit(Base):
    __tablename__ = "website_audits"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    page_title = Column(String, nullable=True)
    meta_description = Column(Text, nullable=True)
    ssl_status = Column(Boolean, default=False)
    mobile_viewport = Column(Boolean, default=False)
    contact_page_found = Column(Boolean, default=False)
    email_found = Column(Boolean, default=False)
    phone_found = Column(Boolean, default=False)
    platform_detected = Column(String, nullable=True)
    ecommerce_detected = Column(Boolean, default=False)
    checkout_detected = Column(Boolean, default=False)
    quote_form_detected = Column(Boolean, default=False)
    problems_found = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="website_audit")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    platform = Column(String)
    message_type = Column(String) # first_message, followup_1, etc.
    message_text = Column(Text)
    status = Column(String, default="Pending Review")
    approved_at = Column(DateTime, nullable=True)
    sent_at = Column(DateTime, nullable=True)
    failed_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    lead = relationship("Lead", back_populates="messages")

class PlatformAccount(Base):
    __tablename__ = "platform_accounts"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    platform_name = Column(String)
    account_label = Column(String)
    username = Column(String)
    credentials_encrypted = Column(String, nullable=True)
    enabled = Column(Boolean, default=False)
    auto_dm_enabled = Column(Boolean, default=False)
    daily_limit = Column(Integer, default=10)
    hourly_limit = Column(Integer, default=2)
    risk_level = Column(String, default="Low")
    requires_manual_send = Column(Boolean, default=True)
    sending_method = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="platform_accounts")

class OutreachLog(Base):
    __tablename__ = "outreach_logs"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    message_id = Column(Integer, ForeignKey("messages.id"), nullable=True)
    platform_account_id = Column(Integer, ForeignKey("platform_accounts.id"), nullable=True)
    action = Column(String)
    status = Column(String)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Followup(Base):
    __tablename__ = "followups"
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"))
    message_id = Column(Integer, ForeignKey("messages.id"))
    followup_number = Column(Integer)
    scheduled_for = Column(DateTime)
    status = Column(String, default="Pending")
    created_at = Column(DateTime, default=datetime.utcnow)

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    auto_outreach_enabled = Column(Boolean, default=False)
    require_manual_approval = Column(Boolean, default=True)
    max_total_messages_per_day = Column(Integer, default=50)
    quiet_hours_start = Column(String, default="22:00")
    quiet_hours_end = Column(String, default="08:00")
    random_delay_min_minutes = Column(Integer, default=5)
    random_delay_max_minutes = Column(Integer, default=15)
    stop_on_reply = Column(Boolean, default=True)
    stop_on_error = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="settings")
