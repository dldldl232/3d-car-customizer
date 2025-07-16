from fastapi import APIRouter, Depends, HTTPException
from app.auth import decode_access_token
from app.auth import oauth2_scheme # or import from where we defined it

router = APIRouter()

@router.get("/protected")
async def protected_route(token: str = Depends(oauth2_scheme)):
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    return {"user": payload["sub"]}

