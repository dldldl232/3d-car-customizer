from fastapi import FastAPI, Depends, status
from sqlmodel import Session
from app.db import init_db, get_session, get_user
from app.models import Item
from app.routers import items, protected, users
from fastapi.security import  OAuth2PasswordRequestForm
from app.auth import verify_password, create_access_token, oauth2_scheme
from app.config import get_settings
from datetime import timedelta

app = FastAPI(title="Simple Backend API", version = "0.1.0")

app.include_router(protected.router)
app.include_router(users.router)

@app.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    session: Session = Depends(get_session)
    ):
    user = get_user(form_data.username, session) # I guess we have to implement the get_user func
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=30)
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.on_event("startup")
def on_startup():
    init_db()

app.include_router(items.router, prefix="/items", tags=["items"])

@app.get("/", summary="Root check")
async def root():
    return {"message": "FastAPI is running"}

@app.get("/")
def endpoints(settings = Depends(get_settings)):
    return {"db": settings.database_url}

app.include_router(items.router, prefix="/items", tags=["items"])
