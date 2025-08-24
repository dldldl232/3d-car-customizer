#!/usr/bin/env python3
"""
Script to check anchors in the database
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel, Anchor
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def check_anchors():
    with Session(engine) as session:
        # Get all car models
        car_models = session.exec(select(CarModel)).all()
        
        print(f"Found {len(car_models)} car models in database:")
        
        for car_model in car_models:
            print(f"\n--- {car_model.name} (ID: {car_model.id}) ---")
            
            # Get anchors for this car model
            anchors = session.exec(
                select(Anchor).where(Anchor.car_model_id == car_model.id)
            ).all()
            
            if anchors:
                print(f"  ✅ Has {len(anchors)} anchors:")
                for anchor in anchors:
                    print(f"    - {anchor.name} ({anchor.type})")
                    print(f"      Position: ({anchor.pos_x}, {anchor.pos_y}, {anchor.pos_z})")
                    print(f"      Scale: ({anchor.scale_x}, {anchor.scale_y}, {anchor.scale_z})")
            else:
                print(f"  ❌ No anchors found!")
                print(f"  This car model needs anchors for proper part attachment.")

if __name__ == "__main__":
    check_anchors() 