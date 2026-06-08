from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ClientFinder OS API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from routes import niches, leads, messages, analytics

@app.get("/")
def read_root():
    return {"message": "ClientFinder OS API is running"}

app.include_router(niches.router)
app.include_router(leads.router)
app.include_router(messages.router)
app.include_router(analytics.router)
