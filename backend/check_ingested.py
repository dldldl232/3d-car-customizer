#!/usr/bin/env python3
"""
Check what models were ingested into the database
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel, Anchor
from app.db import DATABASE_URL

def check_ingested():
    engine = create_engine(DATABASE_URL, echo=False)
    
    with Session(engine) as session:
        # Get all car models
        car_models = session.exec(select(CarModel)).all()
        
        print(f"=== Database Contents ===")
        print(f"Found {len(car_models)} car models:")
        
        for car in car_models:
            print(f"\n  - {car.name} (ID: {car.id})")
            print(f"    Source UID: {car.source_uid}")
            print(f"    License: {car.license_slug}")
            print(f"    GLB URL: {car.glb_url}")
            print(f"    Uploader: {car.uploader}")
            
            # Get anchors for this car
            anchors = session.exec(select(Anchor).where(Anchor.car_model_id == car.id)).all()
            print(f"    Anchors: {len(anchors)}")
            for anchor in anchors:
                print(f"      - {anchor.name} ({anchor.type})")

if __name__ == "__main__":
    check_ingested() 