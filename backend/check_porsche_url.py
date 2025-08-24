#!/usr/bin/env python3
"""
Script to check and fix the Porsche model URL
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def check_porsche_url():
    with Session(engine) as session:
        # Find Porsche models
        porsche_models = session.exec(
            select(CarModel).where(CarModel.name.like("%Porsche%"))
        ).all()
        
        print(f"Found {len(porsche_models)} Porsche models:")
        
        for car in porsche_models:
            print(f"\n  - {car.name} (ID: {car.id})")
            print(f"    Current URL: {car.glb_url}")
            
            # Fix the URL to point to the correct GLTF file
            if car.glb_url and "porsche" in car.glb_url.lower():
                if car.glb_url.endswith(".glb"):
                    # Change from .glb to .gltf
                    new_url = car.glb_url.replace(".glb", ".gltf")
                    print(f"    Updating to: {new_url}")
                    car.glb_url = new_url
                    session.add(car)
                elif car.glb_url.endswith(".gltf"):
                    print(f"    URL is already correct")
                else:
                    print(f"    Unknown file extension")
        
        session.commit()
        print("\nPorsche URLs updated!")

if __name__ == "__main__":
    check_porsche_url() 