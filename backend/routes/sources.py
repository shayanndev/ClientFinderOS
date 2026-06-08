from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
import models
from datetime import datetime

router = APIRouter(prefix="/api/sources", tags=["sources"])

class LeadSourceCreate(BaseModel):
    niche_id: int
    source_name: str
    source_type: str = "Web Research"
    keyword: str = ""
    location: Optional[str] = None
    country: Optional[str] = None
    max_results_per_run: int = 30
    run_frequency: str = "daily"
    auto_research_enabled: bool = False
    is_active: bool = True

class LeadSourceResponse(LeadSourceCreate):
    id: int
    last_run_at: Optional[datetime] = None
    created_at: datetime
    model_config = {"from_attributes": True}

@router.get("", response_model=List[LeadSourceResponse])
def read_sources(db: Session = Depends(get_db)):
    return db.query(models.LeadSource).all()

@router.post("", response_model=LeadSourceResponse)
def create_source(source: LeadSourceCreate, db: Session = Depends(get_db)):
    db_source = models.LeadSource(**source.model_dump())
    db.add(db_source)
    db.commit()
    db.refresh(db_source)
    return db_source

@router.put("/{source_id}", response_model=LeadSourceResponse)
def update_source(source_id: int, source: LeadSourceCreate, db: Session = Depends(get_db)):
    db_source = db.query(models.LeadSource).filter(models.LeadSource.id == source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    for k, v in source.model_dump().items():
        setattr(db_source, k, v)
    db.commit()
    db.refresh(db_source)
    return db_source

@router.delete("/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):
    db_source = db.query(models.LeadSource).filter(models.LeadSource.id == source_id).first()
    if not db_source:
        raise HTTPException(status_code=404, detail="Source not found")
    db.delete(db_source)
    db.commit()
    return {"message": "Source deleted"}

def _run_research_task(source_id: int):
    """Background task to run research for a source."""
    from database import SessionLocal
    from services.research_engine import run_research_for_source
    db = SessionLocal()
    try:
        source = db.query(models.LeadSource).filter(models.LeadSource.id == source_id).first()
        niche = db.query(models.Niche).filter(models.Niche.id == source.niche_id).first()
        if source and niche:
            count = run_research_for_source(source, niche, db)
            print(f"Research complete: {count} leads saved for source '{source.source_name}'")
    except Exception as e:
        print(f"Research task error: {e}")
    finally:
        db.close()

@router.post("/{source_id}/run")
def run_source_now(source_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    source = db.query(models.LeadSource).filter(models.LeadSource.id == source_id).first()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    if not source.is_active:
        raise HTTPException(status_code=400, detail="Source is not active")

    background_tasks.add_task(_run_research_task, source_id)
    return {"message": f"Research started for '{source.source_name}'. Leads will appear in the pipeline shortly."}
