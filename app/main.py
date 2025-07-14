from fastapi import FastAPI, Depends
from sqlmodel import Session
from app.db import init_db, get_session
from app.models import Item
from app.routers import items

app = FastAPI(title="Simple Backend API", version = "0.1.0")

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(items.router, prefix="/items", tags=["items"])

@app.get("/", summary="Root check")
async def root():
    return {"message": "FastAPI is running"}

app.include_router(items.router, prefix="/items", tags=["items"])
