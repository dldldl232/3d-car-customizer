#!/usr/bin/env python3
"""
Script to check what the database has for Porsche models
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def check_porsche_database():
    with Session(engine) as session:
        # Find Porsche models
        porsche_models = session.exec(
            select(CarModel).where(CarModel.name.like("%Porsche%"))
        ).all()
        
        print(f"Found {len(porsche_models)} Porsche models in database:")
        
        for car in porsche_models:
            print(f"\n  - {car.name} (ID: {car.id})")
            print(f"    URL: {car.glb_url}")
            print(f"    Source UID: {car.source_uid}")
            print(f"    License: {car.license_slug}")

if __name__ == "__main__":
    check_porsche_database() 