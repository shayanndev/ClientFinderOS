from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
from services.ai_generator import generate_messages

router = APIRouter(prefix="/api/messages", tags=["messages"])

@router.get("", response_model=List[schemas.Message])
def read_messages(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Message).offset(skip).limit(limit).all()

@router.post("/generate/{lead_id}")
def generate_lead_messages(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    niche = db.query(models.Niche).filter(models.Niche.id == lead.niche_id).first()
    audit = db.query(models.WebsiteAudit).filter(models.WebsiteAudit.lead_id == lead_id).first()
    
    if not audit:
        raise HTTPException(status_code=400, detail="Website not analyzed yet. Run analysis first.")

    ai_result = generate_messages(niche, lead, audit)
    if not ai_result:
        raise HTTPException(status_code=500, detail="Failed to generate messages via AI")

    # Save generated messages to db
    messages_created = []
    
    msg_types = {
        "first_message": ai_result.get("first_message"),
        "followup_1": ai_result.get("followup_1"),
        "followup_2": ai_result.get("followup_2")
    }
    
    for m_type, m_text in msg_types.items():
        if m_text:
            db_msg = models.Message(
                lead_id=lead.id,
                platform=lead.platform or "Email",
                message_type=m_type,
                message_text=m_text,
                status="Pending Review"
            )
            db.add(db_msg)
            messages_created.append(db_msg)
            
    lead.status = "Message Ready"
    db.commit()
    
    return {"message": "Messages generated successfully", "count": len(messages_created)}

@router.post("/{message_id}/approve")
def approve_message(message_id: int, db: Session = Depends(get_db)):
    db_msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not db_msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    db_msg.status = "Approved"
    
    lead = db.query(models.Lead).filter(models.Lead.id == db_msg.lead_id).first()
    if lead and lead.status == "Message Ready":
        lead.status = "Approved"
        
    db.commit()
    return {"message": "Message approved"}

@router.post("/{message_id}/reject")
def reject_message(message_id: int, db: Session = Depends(get_db)):
    db_msg = db.query(models.Message).filter(models.Message.id == message_id).first()
    if not db_msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    db_msg.status = "Rejected"
    db.commit()
    return {"message": "Message rejected"}
