from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from app.db import get_session
from app.models import CarModel, Anchor

router = APIRouter(prefix="/car_models", tags=["car_models"])

@router.post("/", response_model=CarModel, status_code=201)
def create_car_model(car_model:CarModel, session: Session=Depends(get_session)):
    session.add(car_model)
    session.commit()
    session.refresh(car_model)
    return car_model

@router.get("/", response_model=list[CarModel])
def list_car_models(session: Session=Depends(get_session)):
    return session.exec(select(CarModel)).all()

@router.get("/{car_model_id}", response_model=CarModel)
def get_car_model(car_model_id: int, session: Session = Depends(get_session)):
    car_model = session.get(CarModel, car_model_id)
    if not car_model:
        raise HTTPException(status_code=404, detail="Car model not found")
    return car_model

@router.get("/{car_model_id}/anchors", response_model=list[Anchor])
def get_car_anchors(car_model_id: int, session: Session = Depends(get_session)):
    """Get anchor nodes for a specific car model"""
    anchors = session.exec(select(Anchor).where(Anchor.car_model_id == car_model_id)).all()
    return anchors

@router.put("/{car_model_id}", response_model=CarModel)
def update_car_model(car_model_id: int, car_model: CarModel, session: Session = Depends(get_session)):
    db_car_model = session.get(CarModel, car_model_id)
    if not db_car_model:
        raise HTTPException(status_code=404, detail="Car model not found")
    db_car_model.name = car_model.name
    db_car_model.manufacturer = car_model.manufacturer
    db_car_model.year = car_model.year
    db_car_model.gltf_url = car_model.gltf_url
    session.add(db_car_model)
    session.commit()
    session.refresh(db_car_model)
    return db_car_model

@router.delete("/{car_model_id}", status_code=204)
def delete_car_model(car_model_id: int, session: Session = Depends(get_session)):
    car_model = session.get(CarModel, car_model_id)
    if not car_model:
        raise HTTPException(status_code=404, detail="Car model not found")
    session.delete(car_model)
    session.commit()
    return
