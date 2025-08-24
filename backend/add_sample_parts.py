#!/usr/bin/env python3
"""
Script to add sample parts to the database for testing
"""

from sqlmodel import Session, create_engine
from app.models import Part, CarModelPartLink
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def add_sample_parts():
    with Session(engine) as session:
        # Sample parts for Porsche 911
        sample_parts = [
            {
                "name": "Sport Spoiler",
                "type": "exterior",
                "price": 350.0,
                "gltf_url": "",  # Empty for now - no actual GLTF file
                "attach_to": "spoiler",
                "pos_x": 0.0, "pos_y": 1.2, "pos_z": -2.5,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "Carbon Fiber Hood",
                "type": "exterior", 
                "price": 2500.0,
                "gltf_url": "",  # Empty for now
                "attach_to": "hood",
                "pos_x": 0.0, "pos_y": 1.0, "pos_z": 0.0,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "Sport Exhaust System",
                "type": "performance",
                "price": 1800.0,
                "gltf_url": "",  # Empty for now
                "attach_to": "exhaust",
                "pos_x": 0.0, "pos_y": 0.3, "pos_z": -2.8,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "LED Headlights",
                "type": "exterior",
                "price": 1200.0,
                "gltf_url": "",  # Empty for now
                "attach_to": "headlights", 
                "pos_x": 0.0, "pos_y": 0.8, "pos_z": 2.6,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "Sport Wheels",
                "type": "wheels",
                "price": 800.0,
                "gltf_url": "",  # Empty for now
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
        
        # Link parts to Porsche 911 (assuming it has ID 1)
        porsche_id = 1
        for part in session.query(Part).all():
            link = CarModelPartLink(car_model_id=porsche_id, part_id=part.id)
            session.add(link)
        
        session.commit()
        print(f"Added {len(sample_parts)} sample parts to the database")

if __name__ == "__main__":
    add_sample_parts() 