from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from database import get_db
import models, schemas
import csv
import io
from pydantic import BaseModel

router = APIRouter(prefix="/api/leads", tags=["leads"])


class LeadUpdate(BaseModel):
    business_name: Optional[str] = None
    website: Optional[str] = None
    domain: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    country: Optional[str] = None
    platform: Optional[str] = None
    profile_url: Optional[str] = None
    status: Optional[str] = None
    estimated_value: Optional[float] = None


@router.get("", response_model=List[schemas.Lead])
def read_leads(skip: int = 0, limit: int = 500, db: Session = Depends(get_db)):
    leads = db.query(models.Lead).order_by(models.Lead.score.desc()).offset(skip).limit(limit).all()
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
    decoded = contents.decode('utf-8-sig')  # handles BOM too
    reader = csv.DictReader(io.StringIO(decoded))

    leads_created = 0
    skipped = 0
    for row in reader:
        business_name = row.get('business_name') or row.get('name') or row.get('Business Name') or "Unknown Business"
        website = row.get('website') or row.get('Website') or ''
        domain = website.replace('https://', '').replace('http://', '').split('/')[0].strip()

        # Skip if domain already exists
        if domain and db.query(models.Lead).filter(models.Lead.domain == domain).first():
            skipped += 1
            continue

        db_lead = models.Lead(
            niche_id=niche_id,
            business_name=business_name,
            website=website,
            domain=domain,
            email=row.get('email') or row.get('Email'),
            phone=row.get('phone') or row.get('Phone'),
            country=row.get('country') or row.get('Country'),
            status="New Lead"
        )
        db.add(db_lead)
        leads_created += 1

    db.commit()
    return {"message": f"Imported {leads_created} leads. Skipped {skipped} duplicates."}


@router.get("/{lead_id}", response_model=schemas.Lead)
def read_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    return db_lead


@router.put("/{lead_id}", response_model=schemas.Lead)
def update_lead(lead_id: int, lead_update: LeadUpdate, db: Session = Depends(get_db)):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not db_lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    for key, value in lead_update.model_dump(exclude_none=True).items():
        setattr(db_lead, key, value)
    db_lead.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_lead)
    return db_lead


from services.website_analyzer import analyze_website
from services.lead_scorer import score_lead


def _do_analyze(lead_id: int):
    """Run analysis and scoring in a background task."""
    from database import SessionLocal
    db = SessionLocal()
    try:
        lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
        if not lead or not lead.website:
            return
        niche = db.query(models.Niche).filter(models.Niche.id == lead.niche_id).first()

        # Remove existing audit if re-running
        existing_audit = db.query(models.WebsiteAudit).filter(models.WebsiteAudit.lead_id == lead_id).first()
        if existing_audit:
            db.delete(existing_audit)
            db.flush()

        audit_data = analyze_website(lead.website)
        audit = models.WebsiteAudit(lead_id=lead.id, **audit_data)
        db.add(audit)
        db.flush()

        score, temp, reason = score_lead(lead, niche, audit)
        lead.score = score
        lead.temperature = temp
        lead.score_reason = reason
        lead.status = "Scored"
        lead.updated_at = datetime.utcnow()
        db.commit()
    except Exception as e:
        print(f"Analysis error for lead {lead_id}: {e}")
        db.rollback()
    finally:
        db.close()


@router.post("/{lead_id}/analyze")
def analyze_lead_website(lead_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    if not lead.website:
        raise HTTPException(status_code=400, detail="Lead has no website URL")

    background_tasks.add_task(_do_analyze, lead_id)
    return {"message": "Analysis started in the background. Refresh in a few seconds."}


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    db_lead = db.query(models.Lead).filter(models.Lead.id == lead_id).first()
    if db_lead is None:
        raise HTTPException(status_code=404, detail="Lead not found")
    db.delete(db_lead)
    db.commit()
    return {"message": "Lead deleted successfully"}
