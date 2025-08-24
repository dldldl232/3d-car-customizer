from fastapi import APIRouter, Depends, HTTPException, status, Query
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
def list_parts(car_model_id: Optional[int]=Query(None), session: Session=Depends(get_session)):
    if car_model_id is not None:
        # Join CarModelPartLink to filter parts by car_model_id
        statement = (
            select(Part)
            .join(CarModelPartLink, Part.id == CarModelPartLink.part_id)
            .where(CarModelPartLink.car_model_id == car_model_id)
        )
        parts = session.exec(statement).all()
        # Fallback: if no parts are linked (e.g., local-only car ID), return all parts
        if not parts:
            return session.exec(select(Part)).all()
        return parts
    else:
        statement = select(Part)
        return session.exec(statement).all()

@router.get("/car_model/{car_model_id}", response_model=list[Part])
def get_parts_by_car_model(car_model_id: int, session: Session=Depends(get_session)):
    """Get all parts compatible with a specific car model"""
    statement = (
        select(Part)
        .join(CarModelPartLink, Part.id == CarModelPartLink.part_id)
        .where(CarModelPartLink.car_model_id == car_model_id)
    )
    return session.exec(statement).all()

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

@router.get("/{part_id}/compatible", response_model=List[Part])
def get_compatible_parts(part_id: int, session: Session = Depends(get_session)):
    # Find all compatible_with_part_id for the given part_id
    statement = select(Part).join(PartCompatibility, Part.id == PartCompatibility.compatible_with_part_id).where(PartCompatibility.part_id == part_id)
    compatible_parts = session.exec(statement).all()
    return compatible_parts