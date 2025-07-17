from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db import get_session
from app.models import CarModelPartLink, CarModel, Part, PartCompatibility
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter(prefix="/parts", tags=["parts"])

@router.post("/", response_model=Part, status_code=201)
def create_parts(part: Part, session: Session=Depends(get_session)):
    session.add(part)
    session.commit()
    session.refresh(part)
    return part

@router.get("/", response_model=list[Part])
def list_parts(session: Session=Depends(get_session)):
    return session.exec(select(Part)).all()

@router.get("/{part_id}", response_model=Part)
def get_parts(part_id: int, session: Session=Depends(get_session)):
    part = session.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    return part

@router.put("/{part_id}", response_model=Part)
def update_part(part_id: int, part: Part, session: Session = Depends(get_session)):
    db_part = session.get(Part, part_id)
    if not db_part:
        raise HTTPException(status_code=404, detail="Part not found")
    db_part.name = part.name
    db_part.type = part.type
    db_part.price = part.price
    db_part.gltf_url = part.gltf_url
    session.add(db_part)
    session.commit()
    session.refresh(db_part)
    return db_part

@router.delete("/{part_id}", status_code=204)
def delete_part(part_id: int, session: Session = Depends(get_session)):
    part = session.get(Part, part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    session.delete(part)
    session.commit()
    return

class CostEstimateRequest(BaseModel):
    part_ids: List[int]

class CostEstimateResponse(BaseModel):
    total_cost: float

@router.post("/estimate_cost/", response_model=CostEstimateResponse)
def estimate_cost(data: CostEstimateRequest, session: Session=Depends(get_session)):
    statement = select(Part).where(Part.id.in_(data.part_ids))
    parts = session.exec(statement).all()
    total = sum(part.price for part in parts)
    return CostEstimateResponse(total_cost=total)