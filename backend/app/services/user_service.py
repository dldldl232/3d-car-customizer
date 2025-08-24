from sqlmodel import Session, select
from app.models import User
from app.auth import get_password_hash
from fastapi import HTTPException, status
from typing import Optional

class UserService:
    def __init__(self, session: Session):
        self.session = session
    
    def create_user(self, email: str, password: str, first_name: str, last_name: str) -> User:
        """Create a new user with hashed password"""
        # Check if user already exists
        existing_user = self.session.exec(select(User).where(User.email == email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # Create new user
        user = User(
            email=email,
            password=get_password_hash(password),
            first_name=first_name,
            last_name=last_name
        )
        self.session.add(user)
        self.session.commit()
        self.session.refresh(user)
        return user
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get user by email"""
        return self.session.exec(select(User).where(User.email == email)).first()
    
    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """Get user by ID"""
        return self.session.get(User, user_id) 