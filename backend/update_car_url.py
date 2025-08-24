#!/usr/bin/env python3
"""
Script to update car model URL to use GLTF file
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def update_car_url():
    with Session(engine) as session:
        # Get the car model
        car = session.exec(select(CarModel).where(CarModel.id == 1)).first()
        if car:
            print(f"Current glb_url: {car.glb_url}")
            car.glb_url = "/free_1975_porsche_911_930_turbo/scene.gltf"
            session.add(car)
            session.commit()
            print(f"Updated glb_url: {car.glb_url}")
        else:
            print("Car model not found")

if __name__ == "__main__":
    update_car_url() 