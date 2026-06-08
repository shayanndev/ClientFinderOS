from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from database import SessionLocal
import models

scheduler = BackgroundScheduler()

def run_all_due_sources():
    """Called by scheduler to run all active, auto-enabled sources that are due."""
    from services.research_engine import run_research_for_source
    from datetime import datetime, timedelta

    db = SessionLocal()
    try:
        sources = db.query(models.LeadSource).filter(
            models.LeadSource.is_active == True,
            models.LeadSource.auto_research_enabled == True
        ).all()

        for source in sources:
            should_run = False

            if source.run_frequency == "hourly":
                if not source.last_run_at or (datetime.utcnow() - source.last_run_at) >= timedelta(hours=1):
                    should_run = True
            elif source.run_frequency == "daily":
                if not source.last_run_at or (datetime.utcnow() - source.last_run_at) >= timedelta(days=1):
                    should_run = True
            elif source.run_frequency == "weekly":
                if not source.last_run_at or (datetime.utcnow() - source.last_run_at) >= timedelta(weeks=1):
                    should_run = True

            if should_run:
                niche = db.query(models.Niche).filter(
                    models.Niche.id == source.niche_id,
                    models.Niche.is_active == True
                ).first()

                if niche:
                    print(f"[Scheduler] Running research for source: {source.source_name}")
                    count = run_research_for_source(source, niche, db)
                    print(f"[Scheduler] Saved {count} leads for '{source.source_name}'")

    except Exception as e:
        print(f"[Scheduler] Error: {e}")
    finally:
        db.close()


def start_scheduler():
    """Start the background scheduler."""
    scheduler.add_job(
        run_all_due_sources,
        trigger=CronTrigger(minute="*/30"),  # every 30 minutes
        id="auto_research",
        replace_existing=True
    )
    scheduler.start()
    print("[Scheduler] APScheduler started — checking sources every 30 minutes.")


def stop_scheduler():
    """Stop the scheduler gracefully."""
    if scheduler.running:
        scheduler.shutdown()
        print("[Scheduler] APScheduler stopped.")
