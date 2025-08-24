#!/usr/bin/env python3
"""
Script to add sample data for the anchor-based system
"""

from sqlmodel import Session, create_engine, select
from app.models import CarModel, Part, Anchor, CarModelPartLink
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def add_sample_data():
    """Add sample data for testing the anchor-based system"""
    with Session(engine) as session:
        print("Adding sample data...")
        
        # Add a sample car model
        car_model = CarModel(
            name="1975 Porsche 911 (930) Turbo",
            manufacturer="Porsche",
            year=1975,
            glb_url="/free_1975_porsche_911_930_turbo/scene.glb",
            thumbnail_url="/free_1975_porsche_911_930_turbo/thumbnail.jpg",
            license_slug="CC-BY-4.0",
            license_url="https://creativecommons.org/licenses/by/4.0/",
            attribution_html="Model by Lionsharp Studios",
            source_url="https://skfb.ly/6WZyV",
            uploader="Lionsharp Studios",
            source_uid="6WZyV",
            bounds='{"min": [-1, 0, -2], "max": [1, 1, 2]}',
            scale_factor=1.0
        )
        session.add(car_model)
        session.commit()
        session.refresh(car_model)
        
        print(f"Added car model: {car_model.name} (ID: {car_model.id})")
        
        # Add sample parts
        sample_parts = [
            {
                "name": "Sport Wheels",
                "type": "wheels",
                "price": 800.0,
                "glb_url": "",  # Empty for now
                "thumbnail_url": "",
                "license_slug": "CC-BY-4.0",
                "license_url": "https://creativecommons.org/licenses/by/4.0/",
                "attribution_html": "Wheels by Creator",
                "source_url": "",
                "uploader": "Creator",
                "source_uid": "",
                "intrinsic_size": '{"radius": 0.34, "type": "wheel"}',
                "attach_to": "wheel_FL_anchor",
                "pos_x": 0.0, "pos_y": 0.0, "pos_z": 0.0,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "Carbon Fiber Hood",
                "type": "exterior",
                "price": 2500.0,
                "glb_url": "",
                "thumbnail_url": "",
                "license_slug": "CC-BY-4.0",
                "license_url": "https://creativecommons.org/licenses/by/4.0/",
                "attribution_html": "Hood by Creator",
                "source_url": "",
                "uploader": "Creator",
                "source_uid": "",
                "intrinsic_size": '{"type": "body"}',
                "attach_to": "hood_anchor",
                "pos_x": 0.0, "pos_y": 0.0, "pos_z": 0.0,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "Sport Spoiler",
                "type": "exterior",
                "price": 350.0,
                "glb_url": "",
                "thumbnail_url": "",
                "license_slug": "CC-BY-4.0",
                "license_url": "https://creativecommons.org/licenses/by/4.0/",
                "attribution_html": "Spoiler by Creator",
                "source_url": "",
                "uploader": "Creator",
                "source_uid": "",
                "intrinsic_size": '{"type": "body"}',
                "attach_to": "spoiler_anchor",
                "pos_x": 0.0, "pos_y": 0.0, "pos_z": 0.0,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            },
            {
                "name": "LED Headlights",
                "type": "lights",
                "price": 1200.0,
                "glb_url": "",
                "thumbnail_url": "",
                "license_slug": "CC-BY-4.0",
                "license_url": "https://creativecommons.org/licenses/by/4.0/",
                "attribution_html": "Lights by Creator",
                "source_url": "",
                "uploader": "Creator",
                "source_uid": "",
                "intrinsic_size": '{"type": "light"}',
                "attach_to": "headlight_L_anchor",
                "pos_x": 0.0, "pos_y": 0.0, "pos_z": 0.0,
                "rot_x": 0.0, "rot_y": 0.0, "rot_z": 0.0,
                "scale_x": 1.0, "scale_y": 1.0, "scale_z": 1.0
            }
        ]
        
        for part_data in sample_parts:
            part = Part(**part_data)
            session.add(part)
        
        session.commit()
        
        # Link parts to car model
        parts = session.exec(select(Part)).all()
        for part in parts:
            link = CarModelPartLink(car_model_id=car_model.id, part_id=part.id)
            session.add(link)
        
        # Add anchor nodes for the car model
        anchors = [
            # Wheel anchors
            {
                "name": "wheel_FL_anchor",
                "type": "wheel",
                "pos_x": -0.8, "pos_y": 0, "pos_z": -1.2,
                "rot_x": 0, "rot_y": 0, "rot_z": 0,
                "scale_x": 1, "scale_y": 1, "scale_z": 1,
                "anchor_metadata": '{"radius": 0.34, "axis": "x", "type": "wheel"}'
            },
            {
                "name": "wheel_FR_anchor",
                "type": "wheel",
                "pos_x": 0.8, "pos_y": 0, "pos_z": -1.2,
                "rot_x": 0, "rot_y": 0, "rot_z": 0,
                "scale_x": 1, "scale_y": 1, "scale_z": 1,
                "anchor_metadata": '{"radius": 0.34, "axis": "x", "type": "wheel"}'
            },
            {
                "name": "wheel_RL_anchor",
                "type": "wheel",
                "pos_x": -0.8, "pos_y": 0, "pos_z": 1.2,
                "rot_x": 0, "rot_y": 0, "rot_z": 0,
                "scale_x": 1, "scale_y": 1, "scale_z": 1,
                "anchor_metadata": '{"radius": 0.34, "axis": "x", "type": "wheel"}'
            },
            {
                "name": "wheel_RR_anchor",
                "type": "wheel",
                "pos_x": 0.8, "pos_y": 0, "pos_z": 1.2,
                "rot_x": 0, "rot_y": 0, "rot_z": 0,
                "scale_x": 1, "scale_y": 1, "scale_z": 1,
                "anchor_metadata": '{"radius": 0.34, "axis": "x", "type": "wheel"}'
            },
            # Body part anchors
            {
                "name": "spoiler_anchor",
                "type": "spoiler",
                "pos_x": 0, "pos_y": 1.2, "pos_z": -2.5,
                "rot_x": 0, "rot_y": 0, "rot_z": 0,
                "scale_x": 1, "scale_y": 1, "scale_z": 1,
                "anchor_metadata": '{"type": "spoiler"}'
            },
            {
                "name": "hood_anchor",
                "type": "hood",
                "pos_x": 0, "pos_y": 1.0, "pos_z": 0,
                "rot_x": 0, "rot_y": 0, "rot_z": 0,
                "scale_x": 1, "scale_y": 1, "scale_z": 1,
                "anchor_metadata": '{"type": "hood"}'
            },
            {
                "name": "headlight_L_anchor",
                "type": "headlight",
                "pos_x": -0.6, "pos_y": 0.8, "pos_z": 2.6,
                "rot_x": 0, "rot_y": 0, "rot_z": 0,
                "scale_x": 1, "scale_y": 1, "scale_z": 1,
                "anchor_metadata": '{"type": "headlight"}'
            },
            {
                "name": "headlight_R_anchor",
                "type": "headlight",
                "pos_x": 0.6, "pos_y": 0.8, "pos_z": 2.6,
                "rot_x": 0, "rot_y": 0, "rot_z": 0,
                "scale_x": 1, "scale_y": 1, "scale_z": 1,
                "anchor_metadata": '{"type": "headlight"}'
            }
        ]
        
        for anchor_data in anchors:
            anchor = Anchor(car_model_id=car_model.id, **anchor_data)
            session.add(anchor)
        
        session.commit()
        
        print(f"Added {len(sample_parts)} parts")
        print(f"Added {len(anchors)} anchor nodes")
        print("Sample data added successfully!")

if __name__ == "__main__":
    add_sample_data() 