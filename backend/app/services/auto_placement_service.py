#!/usr/bin/env python3
"""
Enhanced auto-placement service for parts
"""

import json
import hashlib
from typing import Dict, List, Optional, Tuple
from sqlmodel import Session, select
from app.models import CarModel, Part, Anchor, Fitment, User

class AutoPlacementService:
    def __init__(self, session: Session):
        self.session = session
    
    def get_best_fitment_transform(
        self, 
        car_model_id: int, 
        part_id: int, 
        anchor_id: int, 
        part_variant_hash: str = "",
        current_user: Optional[User] = None
    ) -> Optional[Dict]:
        """
        Get the best fitment transform for a part-anchor combination
        Priority: User fitment -> Global fitment -> Auto placement
        """
        
        # First try user fitment
        if current_user:
            user_fitment = self.session.exec(
                select(Fitment).where(
                    Fitment.car_model_id == car_model_id,
                    Fitment.part_id == part_id,
                    Fitment.anchor_id == anchor_id,
                    Fitment.part_variant_hash == part_variant_hash,
                    Fitment.scope == "user",
                    Fitment.created_by_user_id == current_user.id
                )
            ).first()
            
            if user_fitment and user_fitment.transform_override:
                try:
                    return json.loads(user_fitment.transform_override)
                except:
                    pass
        
        # Then try global best fitment
        global_fitment = self.session.exec(
            select(Fitment).where(
                Fitment.car_model_id == car_model_id,
                Fitment.part_id == part_id,
                Fitment.anchor_id == anchor_id,
                Fitment.part_variant_hash == part_variant_hash,
                Fitment.scope == "global"
            ).order_by(Fitment.quality_score.desc())
        ).first()
        
        if global_fitment and global_fitment.transform_override:
            try:
                return json.loads(global_fitment.transform_override)
            except:
                pass
        
        # Fall back to auto placement
        return self.compute_auto_placement_transform(car_model_id, part_id, anchor_id)
    
    def compute_auto_placement_transform(
        self, 
        car_model_id: int, 
        part_id: int, 
        anchor_id: int
    ) -> Dict:
        """
        Compute automatic placement transform for a part at an anchor
        """
        
        # Get car model, part, and anchor
        car_model = self.session.get(CarModel, car_model_id)
        part = self.session.get(Part, part_id)
        anchor = self.session.get(Anchor, anchor_id)
        
        if not all([car_model, part, anchor]):
            return self.get_default_transform()
        
        # Start with anchor transform
        transform = {
            "position": [anchor.pos_x, anchor.pos_y, anchor.pos_z],
            "rotation_euler": [anchor.rot_x, anchor.rot_y, anchor.rot_z],
            "scale": [anchor.scale_x, anchor.scale_y, anchor.scale_z]
        }
        
        # Apply part-specific adjustments
        transform = self.apply_part_specific_adjustments(transform, part, anchor, car_model)
        
        return transform
    
    def apply_part_specific_adjustments(
        self, 
        transform: Dict, 
        part: Part, 
        anchor: Anchor, 
        car_model: CarModel
    ) -> Dict:
        """
        Apply part-specific adjustments to the transform
        """
        
        # Get part intrinsic size
        part_size = self.get_part_intrinsic_size(part)
        anchor_metadata = self.get_anchor_metadata(anchor)
        
        # Apply category-specific adjustments
        if part.category == "wheel" or part.type == "wheels":
            transform = self.adjust_wheel_transform(transform, part, anchor, part_size, anchor_metadata)
        elif part.category == "headlight" or "headlight" in part.type.lower():
            transform = self.adjust_headlight_transform(transform, part, anchor, part_size)
        elif part.category == "spoiler" or "spoiler" in part.type.lower():
            transform = self.adjust_spoiler_transform(transform, part, anchor, part_size)
        elif part.category == "exhaust" or "exhaust" in part.type.lower():
            transform = self.adjust_exhaust_transform(transform, part, anchor, part_size)
        
        # Apply pivot adjustments
        transform = self.apply_pivot_adjustments(transform, part, anchor)
        
        # Apply unit scale from car model
        if car_model.unit_scale != 1.0:
            scale = transform["scale"]
            transform["scale"] = [s * car_model.unit_scale for s in scale]
        
        return transform
    
    def adjust_wheel_transform(
        self, 
        transform: Dict, 
        part: Part, 
        anchor: Anchor, 
        part_size: Dict, 
        anchor_metadata: Dict
    ) -> Dict:
        """
        Adjust transform for wheel parts
        """
        
        # Scale based on expected wheel diameter
        if anchor.expected_diameter and part_size.get("radius"):
            current_diameter = part_size["radius"] * 2
            scale_factor = anchor.expected_diameter / current_diameter
            transform["scale"] = [s * scale_factor for s in transform["scale"]]
        
        # Apply wheel-specific scaling
        wheel_scale = 0.6  # Default wheel scale
        transform["scale"] = [s * wheel_scale for s in transform["scale"]]
        
        return transform
    
    def adjust_headlight_transform(
        self, 
        transform: Dict, 
        part: Part, 
        anchor: Anchor, 
        part_size: Dict
    ) -> Dict:
        """
        Adjust transform for headlight parts
        """
        
        # Headlights should be smaller and positioned at front
        headlight_scale = 0.6
        transform["scale"] = [s * headlight_scale for s in transform["scale"]]
        
        return transform
    
    def adjust_spoiler_transform(
        self, 
        transform: Dict, 
        part: Part, 
        anchor: Anchor, 
        part_size: Dict
    ) -> Dict:
        """
        Adjust transform for spoiler parts
        """
        
        # Spoilers should be positioned at rear and elevated
        spoiler_scale = 1.0
        transform["scale"] = [s * spoiler_scale for s in transform["scale"]]
        
        return transform
    
    def adjust_exhaust_transform(
        self, 
        transform: Dict, 
        part: Part, 
        anchor: Anchor, 
        part_size: Dict
    ) -> Dict:
        """
        Adjust transform for exhaust parts
        """
        
        # Exhaust should be smaller and positioned at rear
        exhaust_scale = 0.8
        transform["scale"] = [s * exhaust_scale for s in transform["scale"]]
        
        return transform
    
    def apply_pivot_adjustments(
        self, 
        transform: Dict, 
        part: Part, 
        anchor: Anchor
    ) -> Dict:
        """
        Apply pivot-based adjustments to center the part properly
        """
        
        pivot_hint = part.pivot_hint or "center"
        
        if pivot_hint == "bottom-center":
            # Adjust Y position to place bottom at anchor
            part_size = self.get_part_intrinsic_size(part)
            if part_size.get("height"):
                transform["position"][1] -= part_size["height"] * transform["scale"][1] / 2
        
        elif pivot_hint == "hub-center":
            # For wheels, center on hub
            part_size = self.get_part_intrinsic_size(part)
            if part_size.get("radius"):
                transform["position"][1] += part_size["radius"] * transform["scale"][1]
        
        return transform
    
    def get_part_intrinsic_size(self, part: Part) -> Dict:
        """
        Get part intrinsic size from JSON string
        """
        try:
            if part.intrinsic_size:
                return json.loads(part.intrinsic_size)
        except:
            pass
        
        # Default sizes based on part type
        defaults = {
            "wheels": {"radius": 0.34, "width": 0.2, "height": 0.68},
            "headlight": {"length": 0.3, "width": 0.2, "height": 0.1},
            "spoiler": {"length": 1.5, "width": 0.5, "height": 0.3},
            "exhaust": {"length": 0.8, "width": 0.3, "height": 0.3}
        }
        
        for category, size in defaults.items():
            if category in part.category.lower() or category in part.type.lower():
                return size
        
        return {"length": 0.5, "width": 0.5, "height": 0.5}
    
    def get_anchor_metadata(self, anchor: Anchor) -> Dict:
        """
        Get anchor metadata from JSON string
        """
        try:
            if anchor.anchor_metadata:
                return json.loads(anchor.anchor_metadata)
        except:
            pass
        
        return {}
    
    def get_default_transform(self) -> Dict:
        """
        Get default transform when no placement data is available
        """
        return {
            "position": [0, 0, 0],
            "rotation_euler": [0, 0, 0],
            "scale": [1, 1, 1]
        }
    
    def compute_part_variant_hash(self, part: Part, material_variant: str = "") -> str:
        """
        Compute hash for part variant (GLB + material/size)
        """
        hash_input = f"{part.glb_url}:{part.intrinsic_size}:{material_variant}"
        return hashlib.sha256(hash_input.encode()).hexdigest()
    
    def find_matching_anchor(self, part: Part, anchors: List[Anchor]) -> Optional[Anchor]:
        """
        Find the best matching anchor for a part
        """
        
        # First try exact match by attach_to
        if part.attach_to:
            for anchor in anchors:
                if anchor.name == part.attach_to:
                    return anchor
        
        # Then try category match
        for anchor in anchors:
            if anchor.type == part.category or anchor.type == part.type:
                return anchor
        
        # For wheels, find wheel anchors
        if part.category == "wheel" or part.type == "wheels":
            for anchor in anchors:
                if "wheel" in anchor.name.lower():
                    return anchor
        
        # For headlights, find headlight anchors
        if "headlight" in part.type.lower():
            for anchor in anchors:
                if "headlight" in anchor.name.lower():
                    return anchor
        
        return None 