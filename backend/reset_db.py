#!/usr/bin/env python3
"""
Script to reset database and add correct car model and parts
"""

from sqlmodel import Session, create_engine
from app.models import Part, CarModel, CarModelPartLink
from app.db import DATABASE_URL
import os

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def reset_database():
    # Delete the database file
    if os.path.exists("test.db"):
        os.remove("test.db")
        print("Deleted old database")
    
    # Recreate database
    from app.db import init_db
    init_db()
    print("Created new database")
    
    with Session(engine) as session:
        # Add Porsche 911 car model
        porsche = CarModel(
            id=1,
            name="1975 Porsche 911 (930) Turbo",
            manufacturer="Porsche",
            year=1975,
            gltf_url="/free_1975_porsche_911_930_turbo/scene.gltf",
            image_url="/placeholder.svg?height=200&width=300"
        )
        session.add(porsche)
        session.commit()
        print("Added Porsche 911 car model")
        
        # Add correct parts
        sample_parts = [
            {
                "name": "Sport Spoiler",
                "type": "exterior",
                "price": 350.0,
                "gltf_url": "",
                "attach_to": "spoiler",
                "pos_x": 0.0, "pos_y": 1.2, "pos_z": -2.5,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "Carbon Fiber Hood",
                "type": "exterior", 
                "price": 2500.0,
                "gltf_url": "",
                "attach_to": "hood",
                "pos_x": 0.0, "pos_y": 1.0, "pos_z": 0.0,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "Sport Exhaust System",
                "type": "performance",
                "price": 1800.0,
                "gltf_url": "",
                "attach_to": "exhaust",
                "pos_x": 0.0, "pos_y": 0.3, "pos_z": -2.8,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "LED Headlights",
                "type": "exterior",
                "price": 1200.0,
                "gltf_url": "",
                "attach_to": "headlights", 
                "pos_x": 0.0, "pos_y": 0.8, "pos_z": 2.6,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "Sport Wheels",
                "type": "wheels",
                "price": 800.0,
                "gltf_url": "",
                "attach_to": "wheels",
                "pos_x": 0.0, "pos_y": 0.4, "pos_z": 0.0,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            }
        ]
        
        # Add parts
        for part_data in sample_parts:
            part = Part(**part_data)
            session.add(part)
        
        session.commit()
        print(f"Added {len(sample_parts)} parts")
        
        # Link parts to Porsche 911
        for part in session.query(Part).all():
            link = CarModelPartLink(car_model_id=1, part_id=part.id)
            session.add(link)
        
        session.commit()
        print("Linked all parts to Porsche 911")

if __name__ == "__main__":
    reset_database() 