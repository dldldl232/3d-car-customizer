#!/usr/bin/env python3
"""
Script to fix all URLs in the database
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel, Part
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def fix_all_urls():
    with Session(engine) as session:
        # Get all car models
        car_models = session.exec(select(CarModel)).all()
        
        print(f"Fixing URLs for {len(car_models)} car models...")
        
        for car in car_models:
            print(f"\n  - {car.name} (ID: {car.id})")
            print(f"    Current URL: {car.glb_url}")
            
            # Fix Porsche model URLs
            if "porsche" in car.name.lower():
                if car.glb_url.endswith(".glb"):
                    new_url = car.glb_url.replace(".glb", ".gltf")
                    print(f"    Fixing Porsche URL: {car.glb_url} -> {new_url}")
                    car.glb_url = new_url
                    session.add(car)
                else:
                    print(f"    Porsche URL is correct")
            
            # Fix Sketchfab model URLs to point to backend
            elif car.glb_url and car.glb_url.startswith("downloads/"):
                new_url = f"http://localhost:8000/models/{car.glb_url.replace('downloads/', '')}"
                print(f"    Fixing Sketchfab URL: {car.glb_url} -> {new_url}")
                car.glb_url = new_url
                session.add(car)
            
            # Keep URLs that are already correct
            elif car.glb_url and (car.glb_url.startswith("http://localhost:8000/models/") or 
                                 car.glb_url.startswith("/free_1975_porsche_911_930_turbo/")):
                print(f"    URL is already correct")
            
            else:
                print(f"    Unknown URL format: {car.glb_url}")
        
        # Get all parts
        parts = session.exec(select(Part)).all()
        
        print(f"\nFixing URLs for {len(parts)} parts...")
        
        for part in parts:
            print(f"\n  - {part.name} (ID: {part.id})")
            print(f"    Current URL: {part.glb_url}")
            
            # Fix Sketchfab part URLs to point to backend
            if part.glb_url and part.glb_url.startswith("downloads/"):
                new_url = f"http://localhost:8000/models/{part.glb_url.replace('downloads/', '')}"
                print(f"    Fixing Sketchfab URL: {part.glb_url} -> {new_url}")
                part.glb_url = new_url
                session.add(part)
            
            # Keep URLs that are already correct
            elif part.glb_url and part.glb_url.startswith("http://localhost:8000/models/"):
                print(f"    URL is already correct")
            
            else:
                print(f"    Unknown URL format: {part.glb_url}")
        
        session.commit()
        print("\nAll URLs fixed!")

if __name__ == "__main__":
    fix_all_urls() 