#!/usr/bin/env python3
"""
Script to clean up irrelevant parts from the database
"""

from sqlmodel import Session, create_engine, select
from app.models import Part, CarModelPartLink
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def clean_irrelevant_parts():
    with Session(engine) as session:
        # Get all parts
        parts = session.exec(select(Part)).all()
        
        print(f"Checking {len(parts)} parts for irrelevant content...")
        
        parts_to_remove = []
        
        for part in parts:
            # Check for truck-related parts
            if any(keyword in part.name.lower() for keyword in [
                'volvo-fh12', 'volvo fh12', 'fh12', 'truck', 'lorry', 'semi',
                'container', 'shipping', 'freight', 'cargo', 'trailer',
                'wsc', 'intercooler'  # Remove intercoolers as they're not standalone parts
            ]):
                print(f"❌ Removing irrelevant part: {part.name}")
                parts_to_remove.append(part)
                continue
            
            # Check for non-car parts
            if any(keyword in part.name.lower() for keyword in [
                'space fighter', 'hammerhead', 'fighter', 'aircraft', 'plane',
                'tank', 'military', 'weapon', 'missile', 'rocket'
            ]):
                print(f"❌ Removing non-car part: {part.name}")
                parts_to_remove.append(part)
                continue
            
            # Check for parts that are actually full cars
            if any(keyword in part.name.lower() for keyword in [
                'porsche 911', 'bmw', 'ford', 'mustang', 'audi r8', 'honda s2000',
                'corvette', 'lamborghini', 'ferrari', 'mercedes'
            ]) and part.type != 'exterior':
                print(f"❌ Removing full car model: {part.name}")
                parts_to_remove.append(part)
                continue
        
        # Remove the irrelevant parts
        for part in parts_to_remove:
            # First remove all car model links
            session.exec(
                select(CarModelPartLink).where(CarModelPartLink.part_id == part.id)
            ).all()
            
            # Delete the part
            session.delete(part)
            print(f"✅ Deleted: {part.name}")
        
        session.commit()
        print(f"\n✅ Successfully removed {len(parts_to_remove)} irrelevant parts!")
        
        # Show remaining parts
        remaining_parts = session.exec(select(Part)).all()
        print(f"\n📊 Remaining parts: {len(remaining_parts)}")
        for part in remaining_parts:
            print(f"  - {part.name} ({part.type}) - ${part.price}")

if __name__ == "__main__":
    clean_irrelevant_parts() 