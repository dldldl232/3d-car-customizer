from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db import get_session, get_user
from app.models import User
from app.auth import get_password_hash, get_current_user
from pydantic import BaseModel

router = APIRouter()

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str

@router.post("/register", status_code=201)
def register(user: UserCreate, session: Session = Depends(get_session)):
    if session.exec(select(User).where(User.email == user.email)).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user_obj = User(
        email=user.email,
        password=get_password_hash(user.password),
        first_name=user.first_name,
        last_name=user.last_name
    )
    session.add(user_obj)
    session.commit()
    session.refresh(user_obj)
    return {
        "id": user_obj.id,
        "email": user_obj.email,
        "first_name": user_obj.first_name,
        "last_name": user_obj.last_name
    }

@router.get("/user_profile", response_model=dict)
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "first_name": current_user.first_name,
        "last_name": current_user.last_name,
    }
