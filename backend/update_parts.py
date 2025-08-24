#!/usr/bin/env python3
"""
Script to update existing parts in the database to have empty GLTF URLs
"""

from sqlmodel import Session, create_engine, select
from app.models import Part
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=True)

def update_parts():
    with Session(engine) as session:
        # Get all parts
        parts = session.exec(select(Part)).all()
        
        print(f"Found {len(parts)} parts in database")
        
        # Update each part to have empty GLTF URL
        for part in parts:
            print(f"Updating part: {part.name} (ID: {part.id})")
            part.gltf_url = ""  # Set to empty string
        
        # Commit changes
        session.commit()
        print("Successfully updated all parts to have empty GLTF URLs")

if __name__ == "__main__":
    update_parts() 