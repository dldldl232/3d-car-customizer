from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session
from app.db import get_session, get_user
from app.models import User
from app.auth import get_password_hash, get_current_user
from pydantic import BaseModel

router = APIRouter()

class UserCreate(BaseModel):
    username: str
    password: str

@router.post("/register", status_code=201)
def register(user: UserCreate, session:Session=Depends(get_session)):
    if get_user(user.username, session):
        raise HTTPException(status_code=400, detail="Username already registered")
    user_obj = User(username=user.username, hashed_password=get_password_hash(user.password))
    session.add(user_obj)
    session.commit()
    session.refresh(user_obj)
    return {"username": user_obj.username, "id": user_obj.id}
    # why do we return this?
    # also why do we need to refresh?

@router.get("/user_profile", response_model=dict)
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "username": current_user.username,
    }
