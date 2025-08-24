#!/usr/bin/env python3
"""
Script to link parts to car models
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel, Part, CarModelPartLink
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def link_parts_to_cars():
    with Session(engine) as session:
        # Get all car models
        car_models = session.exec(select(CarModel)).all()
        
        # Get all parts
        parts = session.exec(select(Part)).all()
        
        print(f"Linking {len(parts)} parts to {len(car_models)} car models...")
        
        for car_model in car_models:
            print(f"\n--- Linking parts to {car_model.name} (ID: {car_model.id}) ---")
            
            for part in parts:
                # Check if link already exists
                existing_link = session.exec(
                    select(CarModelPartLink).where(
                        CarModelPartLink.car_model_id == car_model.id,
                        CarModelPartLink.part_id == part.id
                    )
                ).first()
                
                if not existing_link:
                    # Create link
                    link = CarModelPartLink(car_model_id=car_model.id, part_id=part.id)
                    session.add(link)
                    print(f"  ✅ Linked: {part.name} ({part.type}) - ${part.price}")
                else:
                    print(f"  ⏭️  Already linked: {part.name}")
            
            session.commit()
        
        print(f"\n✅ Successfully linked all parts to all car models!")

if __name__ == "__main__":
    link_parts_to_cars() 