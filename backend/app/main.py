from fastapi import FastAPI, Depends, status, HTTPException
from sqlmodel import Session
from app.db import init_db, get_session, get_user
from app.models import Item
from app.routers import items, protected, users, carmodels, parts, saved_cars, fitments
from fastapi.security import  OAuth2PasswordRequestForm
from app.auth import verify_password, create_access_token, oauth2_scheme
from app.config import get_settings
from datetime import timedelta
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="Simple Backend API", version = "0.1.0")

# Get settings
settings = get_settings()

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files for GLB models
downloads_dir = "downloads"
if os.path.exists(downloads_dir):
    app.mount("/models", StaticFiles(directory=downloads_dir), name="models")

app.include_router(protected.router)
app.include_router(users.router, prefix="/users", tags=["users"])
app.include_router(carmodels.router)
app.include_router(parts.router)
app.include_router(saved_cars.router)
app.include_router(fitments.router)
app.include_router(items.router, prefix="/items", tags=["items"])

@app.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
):
    user = get_user(form_data.username, session)  # username is actually the email
    if not user or not verify_password(form_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.email},  # use email as the subject
        expires_delta=timedelta(minutes=settings.access_token_expire_minutes)
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "first_name": user.first_name,
            "last_name": user.last_name
        }
    }

@app.on_event("startup")
def on_startup():
    init_db()

@app.get("/", summary="Root check")
async def root():
    return {"message": "FastAPI is running"}

@app.get("/config")
def get_config(settings = Depends(get_settings)):
    return {"db": settings.database_url}
