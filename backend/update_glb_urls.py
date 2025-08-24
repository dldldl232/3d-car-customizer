#!/usr/bin/env python3
"""
Script to update GLB URLs in the database to point to the backend server
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def update_glb_urls():
    with Session(engine) as session:
        # Get all car models
        car_models = session.exec(select(CarModel)).all()
        
        print(f"Updating {len(car_models)} car models...")
        
        for car in car_models:
            if car.glb_url and car.glb_url.startswith("downloads/"):
                # Update to point to backend server
                new_url = f"http://localhost:8000/models/{car.glb_url.replace('downloads/', '')}"
                print(f"Updating {car.name}: {car.glb_url} -> {new_url}")
                car.glb_url = new_url
                session.add(car)
            elif car.glb_url and car.glb_url.startswith("/free_1975_porsche_911_930_turbo/"):
                # Keep the Porsche model as is (it's in the frontend public directory)
                print(f"Keeping {car.name} as is: {car.glb_url}")
        
        session.commit()
        print("GLB URLs updated successfully!")

if __name__ == "__main__":
    update_glb_urls() 