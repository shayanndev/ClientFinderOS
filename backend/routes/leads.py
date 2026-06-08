from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas
import csv
import io

router = APIRouter(prefix="/api/leads", tags=["leads"])

@router.get("", response_model=List[schemas.Lead])
def read_leads(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    leads = db.query(models.Lead).offset(skip).limit(limit).all()
    return leads

@router.post("", response_model=schemas.Lead)
def create_lead(lead: schemas.LeadCreate, db: Session = Depends(get_db)):
    db_lead = models.Lead(**lead.model_dump())
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

@router.post("/import-csv")
async def import_csv(niche_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a CSV.")
    
    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    leads_created = 0
    for row in reader:
        # Assuming CSV has 'business_name', 'website', 'email', 'phone'
        business_name = row.get('business_name') or row.get('name') or "Unknown Business"
        website = row.get('website', '')
        
        domain = website.replace('https://', '').replace('http://', '').split('/')[0]
        
        db_lead = models.Lead(
            niche_id=niche_id,
            business_name=business_name,
            website=website,
            domain=domain,
            email=row.get('email'),
            phone=row.get('phone'),
            country=row.get('country')
        )
        db.add(db_lead)
        leads_created += 1
        
    db.commit()
    return {"message": f"Successfully imported {leads_created} leads"}

@router.get("/{lead_id}", response_model=schemas.Lead)
def read_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return db_lead

from services.website_analyzer import analyze_website
from services.lead_scorer import score_lead

@router.post("/{lead_id}/analyze")
def analyze_lead_website(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    
    if not lead.website:
        raise HTTPException(status_code=400, detail="Lead has no website")

    niche = db.query(models.Niche).filter(models.Niche.id == lead.niche_id).first()
    
    # Run analyzer
    audit_data = analyze_website(lead.website)
    
    # Save audit
    audit = models.WebsiteAudit(lead_id=lead.id, **audit_data)
    db.add(audit)
    db.commit()
    db.refresh(audit)

    # Score lead
    score, temp, reason = score_lead(lead, niche, audit)
    lead.score = score
    lead.temperature = temp
    lead.score_reason = reason
    lead.status = "Scored"
    db.commit()
    
    return {"message": "Analysis and scoring complete", "score": score, "temperature": temp}

@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(db_lead)
    db.commit()
    return {"message": "Lead deleted successfully"}

