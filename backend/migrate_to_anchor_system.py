#!/usr/bin/env python3
"""
Migration script to update database for anchor-based part attachment system
"""

import os
import sys
import json
from sqlmodel import Session, create_engine, select
from app.models import CarModel, Part, Anchor
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def migrate_database():
    """Migrate the database to support anchor-based system"""
    with Session(engine) as session:
        print("Starting database migration...")
        
        # Step 1: Update existing car models to use GLB URLs
        car_models = session.exec(select(CarModel)).all()
        for car in car_models:
            if hasattr(car, 'gltf_url') and car.gltf_url:
                # Convert GLTF URL to GLB URL
                car.glb_url = car.gltf_url.replace('.gltf', '.glb')
                car.thumbnail_url = car.gltf_url.replace('.gltf', '_thumb.jpg')
                car.license_slug = "CC-BY-4.0"  # Default license
                car.license_url = "https://creativecommons.org/licenses/by/4.0/"
                car.attribution_html = "Model by Lionsharp Studios"
                car.source_url = "https://skfb.ly/6WZyV"
                car.uploader = "Lionsharp Studios"
                car.source_uid = "6WZyV"
                car.bounds = '{"min": [-1, 0, -2], "max": [1, 1, 2]}'
                car.scale_factor = 1.0
                
                # Remove old gltf_url field
                if hasattr(car, 'gltf_url'):
                    delattr(car, 'gltf_url')
                if hasattr(car, 'image_url'):
                    delattr(car, 'image_url')
        
        # Step 2: Update existing parts to use GLB URLs and anchor names
        parts = session.exec(select(Part)).all()
        for part in parts:
            if hasattr(part, 'gltf_url') and part.gltf_url:
                # Convert GLTF URL to GLB URL
                part.glb_url = part.gltf_url.replace('.gltf', '.glb')
                part.thumbnail_url = part.gltf_url.replace('.gltf', '_thumb.jpg')
                part.license_slug = "CC-BY-4.0"
                part.license_url = "https://creativecommons.org/licenses/by/4.0/"
                part.attribution_html = "Part by Creator"
                part.source_url = ""
                part.uploader = "Creator"
                part.source_uid = ""
                
                # Set intrinsic size based on part type
                if part.type == 'wheels':
                    part.intrinsic_size = '{"radius": 0.34, "type": "wheel"}'
                elif part.type == 'exterior':
                    part.intrinsic_size = '{"type": "body"}'
                else:
                    part.intrinsic_size = '{"type": "generic"}'
                
                # Update attach_to to use anchor names
                if part.attach_to == 'wheels':
                    part.attach_to = 'wheel_FL_anchor'  # Default to front left
                elif part.attach_to == 'headlights':
                    part.attach_to = 'headlight_L_anchor'
                elif part.attach_to == 'hood':
                    part.attach_to = 'hood_anchor'
                elif part.attach_to == 'spoiler':
                    part.attach_to = 'spoiler_anchor'
                elif part.attach_to == 'exhaust':
                    part.attach_to = 'exhaust_L_anchor'
                
                # Remove old gltf_url field
                if hasattr(part, 'gltf_url'):
                    delattr(part, 'gltf_url')
        
        # Step 3: Create anchor nodes for existing car models
        for car in car_models:
            # Create wheel anchors
            wheel_anchors = [
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
                }
            ]
            
            # Create body part anchors
            body_anchors = [
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
                    "name": "exhaust_L_anchor",
                    "type": "exhaust",
                    "pos_x": -0.3, "pos_y": 0.3, "pos_z": -2.8,
                    "rot_x": 0, "rot_y": 0, "rot_z": 0,
                    "scale_x": 1, "scale_y": 1, "scale_z": 1,
                    "anchor_metadata": '{"type": "exhaust"}'
                },
                {
                    "name": "exhaust_R_anchor",
                    "type": "exhaust",
                    "pos_x": 0.3, "pos_y": 0.3, "pos_z": -2.8,
                    "rot_x": 0, "rot_y": 0, "rot_z": 0,
                    "scale_x": 1, "scale_y": 1, "scale_z": 1,
                    "anchor_metadata": '{"type": "exhaust"}'
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
                },
                {
                    "name": "taillight_L_anchor",
                    "type": "taillight",
                    "pos_x": -0.6, "pos_y": 0.8, "pos_z": -2.6,
                    "rot_x": 0, "rot_y": 0, "rot_z": 0,
                    "scale_x": 1, "scale_y": 1, "scale_z": 1,
                    "anchor_metadata": '{"type": "taillight"}'
                },
                {
                    "name": "taillight_R_anchor",
                    "type": "taillight",
                    "pos_x": 0.6, "pos_y": 0.8, "pos_z": -2.6,
                    "rot_x": 0, "rot_y": 0, "rot_z": 0,
                    "scale_x": 1, "scale_y": 1, "scale_z": 1,
                    "anchor_metadata": '{"type": "taillight"}'
                }
            ]
            
            # Add all anchors for this car
            all_anchors = wheel_anchors + body_anchors
            for anchor_data in all_anchors:
                anchor = Anchor(
                    car_model_id=car.id,
                    **anchor_data
                )
                session.add(anchor)
        
        # Commit all changes
        session.commit()
        print("Database migration completed successfully!")
        
        # Print summary
        print(f"Updated {len(car_models)} car models")
        print(f"Updated {len(parts)} parts")
        print(f"Created {len(car_models) * 12} anchor nodes")

if __name__ == "__main__":
    migrate_database() 