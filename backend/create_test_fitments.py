#!/usr/bin/env python3
"""
Create test fitments for Phase 2 testing
"""

import json
from sqlmodel import Session, create_engine, select
from app.models import Fitment, CarModel, Part, Anchor
from app.db import DATABASE_URL

def create_test_fitments():
    """Create test fitments for Phase 2 testing"""
    
    engine = create_engine(DATABASE_URL, echo=True)
    
    with Session(engine) as session:
        # Get first car model
        car_model = session.exec(select(CarModel).limit(1)).first()
        if not car_model:
            print("❌ No car models found in database")
            return
        
        print(f"✅ Using car model: {car_model.name} (ID: {car_model.id})")
        
        # Get first part
        part = session.exec(select(Part).limit(1)).first()
        if not part:
            print("❌ No parts found in database")
            return
        
        print(f"✅ Using part: {part.name} (ID: {part.id})")
        
        # Get first anchor
        anchor = session.exec(select(Anchor).where(Anchor.car_model_id == car_model.id).limit(1)).first()
        if not anchor:
            print("❌ No anchors found for car model")
            return
        
        print(f"✅ Using anchor: {anchor.name} (ID: {anchor.id})")
        
        # Create test fitments
        test_fitments = [
            {
                "car_model_id": car_model.id,
                "part_id": part.id,
                "anchor_id": anchor.id,
                "transform_override": json.dumps({
                    "position": [0.1, 0.2, 0.3],
                    "rotation_euler": [0.0, 0.1, 0.0],
                    "scale": [1.1, 1.0, 1.1]
                }),
                "scope": "global",
                "quality_score": 0.8,
                "version": 1
            },
            {
                "car_model_id": car_model.id,
                "part_id": part.id,
                "anchor_id": anchor.id,
                "transform_override": json.dumps({
                    "position": [0.05, 0.15, 0.25],
                    "rotation_euler": [0.0, 0.05, 0.0],
                    "scale": [1.05, 1.0, 1.05]
                }),
                "scope": "global",
                "quality_score": 0.9,
                "version": 1
            }
        ]
        
        # Check if fitments already exist
        existing_fitments = session.exec(
            select(Fitment).where(
                Fitment.car_model_id == car_model.id,
                Fitment.part_id == part.id,
                Fitment.anchor_id == anchor.id
            )
        ).all()
        
        if existing_fitments:
            print(f"✅ Found {len(existing_fitments)} existing fitments")
            for fitment in existing_fitments:
                print(f"   - Fitment {fitment.id}: scope={fitment.scope}, quality={fitment.quality_score}")
        else:
            print("📝 Creating new test fitments...")
            
            for fitment_data in test_fitments:
                fitment = Fitment(**fitment_data)
                session.add(fitment)
            
            session.commit()
            print("✅ Created test fitments successfully")
        
        # Show all fitments
        all_fitments = session.exec(select(Fitment)).all()
        print(f"\n📊 Total fitments in database: {len(all_fitments)}")
        
        for fitment in all_fitments:
            print(f"   - Fitment {fitment.id}: car={fitment.car_model_id}, part={fitment.part_id}, scope={fitment.scope}, quality={fitment.quality_score}")

if __name__ == "__main__":
    create_test_fitments()
