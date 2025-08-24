from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db import get_session
from app.models import User, SavedCar, SavedCarPartLink, Part
from app.auth import get_current_user
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/saved_cars", tags=["saved_cars"])

class SavedCarCreate(BaseModel):
    car_model_id: int
    name: str = ""
    part_ids: List[int]

class SavedCarResponse(BaseModel):
    id: int
    user_id: int
    car_model_id: int
    name: str
    created_at: str
    part_ids: List[int]

@router.post("/", status_code=201, response_model=SavedCarResponse)
def save_car(
    data: SavedCarCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    saved_car = SavedCar(
        user_id=current_user.id,
        car_model_id=data.car_model_id,
        name=data.name
    )
    session.add(saved_car)
    session.commit()
    session.refresh(saved_car)

    # Link parts - remove duplicates first
    unique_part_ids = list(set(data.part_ids))  # Remove duplicates
    for part_id in unique_part_ids:
        link = SavedCarPartLink(saved_car_id=saved_car.id, part_id=part_id)
        session.add(link)
    session.commit()
    session.refresh(saved_car)
    
    # Get the part IDs for the response
    part_links = session.exec(select(SavedCarPartLink).where(SavedCarPartLink.saved_car_id == saved_car.id)).all()
    part_ids = [link.part_id for link in part_links]
    
    return SavedCarResponse(
        id=saved_car.id,
        user_id=saved_car.user_id,
        car_model_id=saved_car.car_model_id,
        name=saved_car.name,
        created_at=saved_car.created_at.isoformat(),
        part_ids=part_ids
    )

@router.get("/", response_model=List[SavedCarResponse])
def list_saved_cars(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    cars = session.exec(select(SavedCar).where(SavedCar.user_id == current_user.id)).all()
    
    # Get part IDs for each car
    result = []
    for car in cars:
        part_links = session.exec(select(SavedCarPartLink).where(SavedCarPartLink.saved_car_id == car.id)).all()
        part_ids = [link.part_id for link in part_links]
        
        result.append(SavedCarResponse(
            id=car.id,
            user_id=car.user_id,
            car_model_id=car.car_model_id,
            name=car.name,
            created_at=car.created_at.isoformat(),
            part_ids=part_ids
        ))
    
    return result

@router.get("/{id}", response_model=SavedCarResponse)
def get_saved_car(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    car = session.get(SavedCar, id)
    if not car or car.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Saved car not found")
    
    # Get part IDs for this car
    part_links = session.exec(select(SavedCarPartLink).where(SavedCarPartLink.saved_car_id == car.id)).all()
    part_ids = [link.part_id for link in part_links]
    
    return SavedCarResponse(
        id=car.id,
        user_id=car.user_id,
        car_model_id=car.car_model_id,
        name=car.name,
        created_at=car.created_at.isoformat(),
        part_ids=part_ids
    )

@router.delete("/{id}", status_code=204)
def delete_saved_car(
    id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    car = session.get(SavedCar, id)
    if not car or car.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Saved car not found")
    session.delete(car)
    session.commit()
    return
    