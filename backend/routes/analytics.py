from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
import models

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/dashboard")
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_leads = db.query(models.Lead).count()
    hot_leads = db.query(models.Lead).filter(models.Lead.temperature == "Hot").count()
    warm_leads = db.query(models.Lead).filter(models.Lead.temperature == "Warm").count()
    
    total_messages = db.query(models.Message).count()
    approved_messages = db.query(models.Message).filter(models.Message.status == "Approved").count()
    sent_messages = db.query(models.Message).filter(models.Message.status == "Sent").count()
    
    total_niches = db.query(models.Niche).count()
    
    return {
        "total_leads": total_leads,
        "hot_leads": hot_leads,
        "warm_leads": warm_leads,
        "total_messages": total_messages,
        "approved_messages": approved_messages,
        "sent_messages": sent_messages,
        "total_niches": total_niches
    }
