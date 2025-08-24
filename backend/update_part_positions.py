#!/usr/bin/env python3
"""
Script to update part positions and scaling for better part-specific modifications
"""

from sqlmodel import Session, create_engine, select
from app.models import Part
from app.db import DATABASE_URL

# Create engine
engine = create_engine(DATABASE_URL, echo=False)

def update_part_positions():
    with Session(engine) as session:
        # Get all parts
        parts = session.exec(select(Part)).all()
        
        print(f"Updating positions for {len(parts)} parts...")
        
        for part in parts:
            print(f"\n--- Updating {part.name} ({part.type}) ---")
            
            # Part-specific positioning and scaling
            if part.type == "wheels":
                # Wheels need to be positioned at wheel wells - use proper positioning
                part.attach_to = "wheels"
                part.pos_x = 0.0
                part.pos_y = 0.0
                part.pos_z = 0.0
                part.scale_x = 0.6  # Smaller scale for better fit
                part.scale_y = 0.6
                part.scale_z = 0.6
                print(f"  ✅ Set wheel positioning and scaling")
                
            elif part.type == "exterior":
                # Exterior parts like spoilers, body kits
                if "spoiler" in part.name.lower():
                    part.attach_to = "spoiler_anchor"
                    part.pos_x = 0.0
                    part.pos_y = 0.0
                    part.pos_z = 0.0
                    part.scale_x = 1.0
                    part.scale_y = 1.0
                    part.scale_z = 1.0
                    print(f"  ✅ Set spoiler positioning")
                elif "bumper" in part.name.lower():
                    part.attach_to = "bumper_anchor"
                    part.pos_x = 0.0
                    part.pos_y = 0.0
                    part.pos_z = 0.0
                    part.scale_x = 1.0
                    part.scale_y = 1.0
                    part.scale_z = 1.0
                    print(f"  ✅ Set bumper positioning")
                elif "hood" in part.name.lower():
                    part.attach_to = "hood_anchor"
                    part.pos_x = 0.0
                    part.pos_y = 0.0
                    part.pos_z = 0.0
                    part.scale_x = 1.0
                    part.scale_y = 1.0
                    part.scale_z = 1.0
                    print(f"  ✅ Set hood positioning")
                else:
                    part.attach_to = "exterior_anchor"
                    part.pos_x = 0.0
                    part.pos_y = 0.0
                    part.pos_z = 0.0
                    print(f"  ✅ Set general exterior positioning")
                    
            elif part.type == "performance":
                # Performance parts like exhausts, intakes
                if "exhaust" in part.name.lower() or "muffle" in part.name.lower():
                    part.attach_to = "exhaust"
                    part.pos_x = 0.0
                    part.pos_y = 0.0
                    part.pos_z = 0.0
                    part.scale_x = 0.8
                    part.scale_y = 0.8
                    part.scale_z = 0.8
                    print(f"  ✅ Set exhaust positioning")
                else:
                    part.attach_to = "performance_anchor"
                    part.pos_x = 0.0
                    part.pos_y = 0.0
                    part.pos_z = 0.0
                    print(f"  ✅ Set general performance positioning")
                    
            elif part.type == "lights":
                # Light parts
                part.attach_to = "headlights"
                part.pos_x = 0.0
                part.pos_y = 0.0
                part.pos_z = 0.0
                part.scale_x = 0.6
                part.scale_y = 0.6
                part.scale_z = 0.6
                print(f"  ✅ Set light positioning")
                
            elif part.type == "interior":
                # Interior parts
                part.attach_to = "interior"
                part.pos_x = 0.0
                part.pos_y = 0.0
                part.pos_z = 0.0
                part.scale_x = 0.8
                part.scale_y = 0.8
                part.scale_z = 0.8
                print(f"  ✅ Set interior positioning")
            
            # Update the part
            session.add(part)
        
        session.commit()
        print(f"\n✅ Successfully updated all part positions and scaling!")

if __name__ == "__main__":
    update_part_positions() 