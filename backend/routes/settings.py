from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
from database import get_db
import models

router = APIRouter(prefix="/api/settings", tags=["settings"])

class SettingsUpdate(BaseModel):
    auto_outreach_enabled: bool = False
    require_manual_approval: bool = True
    max_total_messages_per_day: int = 50
    quiet_hours_start: str = "22:00"
    quiet_hours_end: str = "08:00"
    random_delay_min_minutes: int = 5
    random_delay_max_minutes: int = 15
    stop_on_reply: bool = True
    stop_on_error: bool = True

class SettingsResponse(SettingsUpdate):
    id: int
    user_id: Optional[int] = None
    model_config = {"from_attributes": True}

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    settings = db.query(models.Settings).filter(models.Settings.user_id == 1).first()
    if not settings:
        # Return defaults if not created yet
        return SettingsUpdate().model_dump()
    return settings

@router.put("")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    settings = db.query(models.Settings).filter(models.Settings.user_id == 1).first()
    if not settings:
        settings = models.Settings(user_id=1, **data.model_dump())
        db.add(settings)
    else:
        for k, v in data.model_dump().items():
            setattr(settings, k, v)
    db.commit()
    db.refresh(settings)
    return settings
