from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import engine, Base
import models

# Create database tables
Base.metadata.create_all(bind=engine)

from scheduler import start_scheduler, stop_scheduler

@asynccontextmanager
async def lifespan(app: FastAPI):
    start_scheduler()
    yield
    stop_scheduler()

app = FastAPI(title="ClientFinder OS API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import niches, leads, messages, analytics, sources, settings

@app.get("/")
def read_root():
    return {"message": "ClientFinder OS API is running"}

app.include_router(niches.router)
app.include_router(leads.router)
app.include_router(messages.router)
app.include_router(analytics.router)
app.include_router(sources.router)
app.include_router(settings.router)
