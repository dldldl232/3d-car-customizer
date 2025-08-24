#!/usr/bin/env python3
"""
Script to update placeholder parts to use real GLB models
"""

from sqlmodel import Session, create_engine, select
from app.models import Part
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def update_placeholder_parts():
    with Session(engine) as session:
        # Get all parts
        all_parts = session.exec(select(Part)).all()
        
        # Separate placeholder parts (empty URLs) from real parts
        placeholder_parts = [p for p in all_parts if not p.glb_url or p.glb_url == ""]
        real_parts = [p for p in all_parts if p.glb_url and p.glb_url.startswith("http://localhost:8000/models/")]
        
        print(f"Found {len(placeholder_parts)} placeholder parts and {len(real_parts)} real parts")
        
        # Group real parts by type
        wheels = [p for p in real_parts if p.type == "wheels"]
        exterior = [p for p in real_parts if p.type == "exterior"]
        lights = [p for p in real_parts if p.type == "lights"]
        interior = [p for p in real_parts if p.type == "interior"]
        
        print(f"Available real parts:")
        print(f"  Wheels: {len(wheels)}")
        print(f"  Exterior: {len(exterior)}")
        print(f"  Lights: {len(lights)}")
        print(f"  Interior: {len(interior)}")
        
        # Update placeholder parts
        for placeholder in placeholder_parts:
            print(f"\nUpdating placeholder part: {placeholder.name} (ID: {placeholder.id}, Type: {placeholder.type})")
            
            # Find a matching real part
            matching_part = None
            
            if placeholder.type == "wheels" and wheels:
                matching_part = wheels[0]  # Use first wheel
                wheels = wheels[1:] if len(wheels) > 1 else wheels
            elif placeholder.type == "exterior" and exterior:
                matching_part = exterior[0]  # Use first exterior part
                exterior = exterior[1:] if len(exterior) > 1 else exterior
            elif placeholder.type == "lights" and lights:
                matching_part = lights[0]  # Use first light
                lights = lights[1:] if len(lights) > 1 else lights
            elif placeholder.type == "interior" and interior:
                matching_part = interior[0]  # Use first interior part
                interior = interior[1:] if len(interior) > 1 else interior
            
            if matching_part:
                print(f"  -> Using real part: {matching_part.name}")
                print(f"  -> URL: {matching_part.glb_url}")
                
                # Update the placeholder part
                placeholder.glb_url = matching_part.glb_url
                placeholder.thumbnail_url = matching_part.thumbnail_url
                placeholder.license_slug = matching_part.license_slug
                placeholder.license_url = matching_part.license_url
                placeholder.attribution_html = matching_part.attribution_html
                placeholder.source_url = matching_part.source_url
                placeholder.uploader = matching_part.uploader
                placeholder.source_uid = matching_part.source_uid
                placeholder.intrinsic_size = matching_part.intrinsic_size
                placeholder.nominal_size = matching_part.nominal_size
                placeholder.pivot_hint = matching_part.pivot_hint
                placeholder.symmetry = matching_part.symmetry
                placeholder.bounding_box = matching_part.bounding_box
                
                session.add(placeholder)
            else:
                print(f"  -> No matching real part found for type: {placeholder.type}")
        
        session.commit()
        print(f"\nUpdated {len([p for p in placeholder_parts if p.glb_url])} placeholder parts with real GLB models!")

if __name__ == "__main__":
    update_placeholder_parts()
