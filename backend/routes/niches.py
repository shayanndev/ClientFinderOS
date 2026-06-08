from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
import models, schemas

router = APIRouter(prefix="/api/niches", tags=["niches"])

@router.get("", response_model=List[schemas.Niche])
def read_niches(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    niches = db.query(models.Niche).offset(skip).limit(limit).all()
    return niches

@router.post("", response_model=schemas.Niche)
def create_niche(niche: schemas.NicheCreate, db: Session = Depends(get_db)):
    db_niche = models.Niche(**niche.model_dump())
    # Setting user_id to 1 for MVP since we don't have auth yet
    db_niche.user_id = 1
    db.add(db_niche)
    db.commit()
    db.refresh(db_niche)
    return db_niche

@router.get("/{niche_id}", response_model=schemas.Niche)
def read_niche(niche_id: int, db: Session = Depends(get_db)):
    db_niche = db.query(models.Niche).filter(models.Niche.id == niche_id).first()
    if db_niche is None:
        raise HTTPException(status_code=404, detail="Niche not found")
    return db_niche

@router.put("/{niche_id}", response_model=schemas.Niche)
def update_niche(niche_id: int, niche: schemas.NicheCreate, db: Session = Depends(get_db)):
    db_niche = db.query(models.Niche).filter(models.Niche.id == niche_id).first()
    if db_niche is None:
        raise HTTPException(status_code=404, detail="Niche not found")
    
    for key, value in niche.model_dump().items():
        setattr(db_niche, key, value)
        
    db.commit()
    db.refresh(db_niche)
    return db_niche

@router.delete("/{niche_id}")
def delete_niche(niche_id: int, db: Session = Depends(get_db)):
    db_niche = db.query(models.Niche).filter(models.Niche.id == niche_id).first()
    if db_niche is None:
        raise HTTPException(status_code=404, detail="Niche not found")
    
    db.delete(db_niche)
    db.commit()
    return {"message": "Niche deleted successfully"}

@router.post("/{niche_id}/activate", response_model=schemas.Niche)
def activate_niche(niche_id: int, db: Session = Depends(get_db)):
    db_niche = db.query(models.Niche).filter(models.Niche.id == niche_id).first()
    if db_niche is None:
        raise HTTPException(status_code=404, detail="Niche not found")
    
    db_niche.is_active = not db_niche.is_active
    db.commit()
    db.refresh(db_niche)
    return db_niche
