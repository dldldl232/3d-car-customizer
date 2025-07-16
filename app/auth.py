from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.config import get_settings
from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException, status
from sqlmodel import Session
from app.db import get_user, get_session

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta(minutes=30)):
    # data is user info
    # expires_delta is how long the token should be valid
#    Loads app settings (to get the secret key).
#    Copies the input data to avoid mutating the original.
#   Calculates the expiration time.
#   Adds the expiration ("exp") to the data.
#   Encodes the data as a JWT using the secret key and the HS256 algorithm.
#   Returns the encoded JWT string.
    settings = get_settings()
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm="HS256")
    return encoded_jwt

def decode_access_token(token: str):
    # Purpose: Decodes and verifies a JWT.
    # Parameters:
    # token: The JWT string to decode.
    # Process:
    # Loads app settings (to get the secret key).
    # Tries to decode the token using the secret key and HS256 algorithm.
    # If successful, returns the decoded payload (the original data + "exp").
    # If decoding fails (e.g., invalid or expired token), returns None.
    settings = get_settings()
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=["HS256"])
        return payload
    except JWTError:
        return None

# for user updating their info
def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
):
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED
            detail="Invalid authentication credentials",
        )
    username = payload["sub"] # question what sub is
    user = get_user(username, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND
            detail="User not found",
        )
    return user
