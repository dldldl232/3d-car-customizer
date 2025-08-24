from sqlmodel import Session, select
from app.models import Part, PartCompatibility, CarModelPartLink
from fastapi import HTTPException
from typing import List, Optional

class PartService:
    def __init__(self, session: Session):
        self.session = session
    
    def get_parts_by_car_model(self, car_model_id: int) -> List[Part]:
        """Get all parts compatible with a specific car model"""
        statement = (
            select(Part)
            .join(CarModelPartLink, Part.id == CarModelPartLink.part_id)
            .where(CarModelPartLink.car_model_id == car_model_id)
        )
        return self.session.exec(statement).all()
    
    def get_compatible_parts(self, part_id: int) -> List[Part]:
        """Get all parts compatible with a specific part"""
        statement = (
            select(Part)
            .join(PartCompatibility, Part.id == PartCompatibility.compatible_with_part_id)
            .where(PartCompatibility.part_id == part_id)
        )
        return self.session.exec(statement).all()
    
    def estimate_cost(self, part_ids: List[int]) -> float:
        """Calculate total cost for a list of parts"""
        statement = select(Part).where(Part.id.in_(part_ids))
        parts = self.session.exec(statement).all()
        return sum(part.price for part in parts)
    
    def get_part_by_id(self, part_id: int) -> Optional[Part]:
        """Get part by ID"""
        return self.session.get(Part, part_id)
    
    def create_part(self, part: Part) -> Part:
        """Create a new part"""
        self.session.add(part)
        self.session.commit()
        self.session.refresh(part)
        return part
    
    def update_part(self, part_id: int, part_data: Part) -> Part:
        """Update an existing part"""
        db_part = self.session.get(Part, part_id)
        if not db_part:
            raise HTTPException(status_code=404, detail="Part not found")
        
        db_part.name = part_data.name
        db_part.type = part_data.type
        db_part.price = part_data.price
        db_part.gltf_url = part_data.gltf_url
        
        self.session.add(db_part)
        self.session.commit()
        self.session.refresh(db_part)
        return db_part
    
    def delete_part(self, part_id: int) -> None:
        """Delete a part"""
        part = self.session.get(Part, part_id)
        if not part:
            raise HTTPException(status_code=404, detail="Part not found")
        
        self.session.delete(part)
        self.session.commit() 