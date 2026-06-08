from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
import models

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_leads = db.query(models.Lead).count()
    hot_leads = db.query(models.Lead).filter(models.Lead.temperature == "Hot").count()
    warm_leads = db.query(models.Lead).filter(models.Lead.temperature == "Warm").count()
    cold_leads = db.query(models.Lead).filter(models.Lead.temperature == "Cold").count()

    total_messages = db.query(models.Message).count()
    approved_messages = db.query(models.Message).filter(models.Message.status == "Approved").count()
    sent_messages = db.query(models.Message).filter(models.Message.status == "Sent").count()
    pending_messages = db.query(models.Message).filter(models.Message.status == "Pending Review").count()

    total_niches = db.query(models.Niche).count()
    active_niches = db.query(models.Niche).filter(models.Niche.is_active == True).count()
    total_sources = db.query(models.LeadSource).count()

    # Status breakdown
    status_counts = db.query(models.Lead.status, func.count(models.Lead.id)).group_by(models.Lead.status).all()
    status_breakdown = {s: c for s, c in status_counts}

    return {
        "total_leads": total_leads,
        "hot_leads": hot_leads,
        "warm_leads": warm_leads,
        "cold_leads": cold_leads,
        "total_messages": total_messages,
        "approved_messages": approved_messages,
        "sent_messages": sent_messages,
        "pending_messages": pending_messages,
        "total_niches": total_niches,
        "active_niches": active_niches,
        "total_sources": total_sources,
        "status_breakdown": status_breakdown,
    }

@router.get("/funnel")
def get_funnel(db: Session = Depends(get_db)):
    funnel_statuses = ["New Lead", "Researched", "Scored", "Message Ready", "Approved", "Contacted", "Replied", "Interested", "Won"]
    funnel = []
    for status in funnel_statuses:
        count = db.query(models.Lead).filter(models.Lead.status == status).count()
        funnel.append({"status": status, "count": count})
    return funnel

@router.get("/sources")
def get_sources_stats(db: Session = Depends(get_db)):
    sources = db.query(models.LeadSource).all()
    result = []
    for s in sources:
        count = db.query(models.Lead).filter(models.Lead.source_id == s.id).count()
        result.append({"source_name": s.source_name, "source_type": s.source_type, "leads_found": count, "last_run_at": s.last_run_at})
    return result
