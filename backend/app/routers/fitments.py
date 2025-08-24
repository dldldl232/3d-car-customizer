from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session, select
from app.db import get_session
from app.models import Fitment, CarModel, Part, Anchor, User
from app.auth import get_current_user
from typing import List, Optional
from pydantic import BaseModel
import json
from datetime import datetime

router = APIRouter(prefix="/fitments", tags=["fitments"])

class FitmentCreate(BaseModel):
    car_model_id: int
    part_id: int
    anchor_id: int
    part_variant_hash: str = ""
    transform_override: dict
    scope: str = "user"

class FitmentResponse(BaseModel):
    id: str
    car_model_id: int
    part_id: int
    anchor_id: int
    part_variant_hash: str
    transform_override: dict
    quality_score: float
    scope: str
    created_by_user_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    version: int

class ManualAdjustmentSave(BaseModel):
    car_model_id: int
    part_id: int
    transform: dict
    
    class Config:
        extra = "allow"  # Allow extra fields to be more permissive

@router.get("/", response_model=List[FitmentResponse])
def get_fitments(
    car_model_id: Optional[int] = Query(None),
    part_id: Optional[int] = Query(None),
    anchor_id: Optional[int] = Query(None),
    scope: str = Query("global"),
    session: Session = Depends(get_session),
    current_user: Optional[User] = None  # Make authentication optional for testing
):
    """Get fitments with optional filtering"""
    query = select(Fitment)
    
    if car_model_id:
        query = query.where(Fitment.car_model_id == car_model_id)
    if part_id:
        query = query.where(Fitment.part_id == part_id)
    if anchor_id:
        query = query.where(Fitment.anchor_id == anchor_id)
    
    # Filter by scope
    if scope == "user" and current_user:
        query = query.where(Fitment.scope == "user", Fitment.created_by_user_id == current_user.id)
    elif scope == "global":
        query = query.where(Fitment.scope == "global")
    elif scope == "org":
        query = query.where(Fitment.scope == "org")
    
    # Order by quality score for global fitments
    if scope == "global":
        query = query.order_by(Fitment.quality_score.desc())
    
    fitments = session.exec(query).all()
    
    # Convert transform_override from JSON string to dict
    result = []
    for fitment in fitments:
        fitment_dict = fitment.dict()
        try:
            fitment_dict["transform_override"] = json.loads(fitment.transform_override) if fitment.transform_override else {}
        except:
            fitment_dict["transform_override"] = {}
        result.append(FitmentResponse(**fitment_dict))
    
    return result

@router.get("/best", response_model=Optional[FitmentResponse])
def get_best_fitment(
    car_model_id: int,
    part_id: int,
    anchor_id: int,
    part_variant_hash: str = "",
    session: Session = Depends(get_session),
    current_user: Optional[User] = None  # Make authentication optional for testing
):
    """Get the best fitment for a specific car-part-anchor combination"""
    
    # First try user fitment
    if current_user:
        user_fitment = session.exec(
            select(Fitment).where(
                Fitment.car_model_id == car_model_id,
                Fitment.part_id == part_id,
                Fitment.anchor_id == anchor_id,
                Fitment.part_variant_hash == part_variant_hash,
                Fitment.scope == "user",
                Fitment.created_by_user_id == current_user.id
            )
        ).first()
        
        if user_fitment:
            fitment_dict = user_fitment.dict()
            try:
                fitment_dict["transform_override"] = json.loads(user_fitment.transform_override) if user_fitment.transform_override else {}
            except:
                fitment_dict["transform_override"] = {}
            return FitmentResponse(**fitment_dict)
    
    # Then try global best fitment
    global_fitment = session.exec(
        select(Fitment).where(
            Fitment.car_model_id == car_model_id,
            Fitment.part_id == part_id,
            Fitment.anchor_id == anchor_id,
            Fitment.part_variant_hash == part_variant_hash,
            Fitment.scope == "global"
        ).order_by(Fitment.quality_score.desc())
    ).first()
    
    if global_fitment:
        fitment_dict = global_fitment.dict()
        try:
            fitment_dict["transform_override"] = json.loads(global_fitment.transform_override) if global_fitment.transform_override else {}
        except:
            fitment_dict["transform_override"] = {}
        return FitmentResponse(**fitment_dict)
    
    return None



@router.post("/", response_model=FitmentResponse, status_code=201)
def create_fitment(
    fitment_data: FitmentCreate,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Create or update a fitment"""
    
    # Validate that car model, part, and anchor exist
    car_model = session.get(CarModel, fitment_data.car_model_id)
    if not car_model:
        raise HTTPException(status_code=404, detail="Car model not found")
    
    part = session.get(Part, fitment_data.part_id)
    if not part:
        raise HTTPException(status_code=404, detail="Part not found")
    
    anchor = session.get(Anchor, fitment_data.anchor_id)
    if not anchor:
        raise HTTPException(status_code=404, detail="Anchor not found")
    
    # Check if fitment already exists for this combination
    existing_fitment = session.exec(
        select(Fitment).where(
            Fitment.car_model_id == fitment_data.car_model_id,
            Fitment.part_id == fitment_data.part_id,
            Fitment.anchor_id == fitment_data.anchor_id,
            Fitment.part_variant_hash == fitment_data.part_variant_hash,
            Fitment.scope == fitment_data.scope
        )
    ).first()
    
    if existing_fitment:
        # Update existing fitment
        existing_fitment.transform_override = json.dumps(fitment_data.transform_override)
        existing_fitment.updated_at = datetime.utcnow()
        existing_fitment.version += 1
        session.add(existing_fitment)
        session.commit()
        session.refresh(existing_fitment)
        
        fitment_dict = existing_fitment.dict()
        try:
            fitment_dict["transform_override"] = json.loads(existing_fitment.transform_override) if existing_fitment.transform_override else {}
        except:
            fitment_dict["transform_override"] = {}
        return FitmentResponse(**fitment_dict)
    else:
        # Create new fitment
        fitment = Fitment(
            car_model_id=fitment_data.car_model_id,
            part_id=fitment_data.part_id,
            anchor_id=fitment_data.anchor_id,
            part_variant_hash=fitment_data.part_variant_hash,
            transform_override=json.dumps(fitment_data.transform_override),
            scope=fitment_data.scope,
            created_by_user_id=current_user.id if current_user else None,
            quality_score=0.5  # Default score for new fitments
        )
        
        session.add(fitment)
        session.commit()
        session.refresh(fitment)
        
        fitment_dict = fitment.dict()
        try:
            fitment_dict["transform_override"] = json.loads(fitment.transform_override) if fitment.transform_override else {}
        except:
            fitment_dict["transform_override"] = {}
        return FitmentResponse(**fitment_dict)

@router.post("/manual-adjustment", response_model=FitmentResponse, status_code=201)
def save_manual_adjustment(
    adjustment_data: ManualAdjustmentSave,
    session: Session = Depends(get_session),
    current_user: Optional[User] = Depends(get_current_user)
):
    """Save manual adjustment from frontend manual correction UI"""
    
    try:
        print(f"🔍 Received manual adjustment data: {adjustment_data}")
        print(f"🔍 Data type: {type(adjustment_data)}")
        print(f"🔍 Transform data: {adjustment_data.transform}")
        print(f"🔍 Transform type: {type(adjustment_data.transform)}")
        
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")
        
        # Validate that car model and part exist
        car_model = session.get(CarModel, adjustment_data.car_model_id)
        if not car_model:
            raise HTTPException(status_code=404, detail="Car model not found")
        
        part = session.get(Part, adjustment_data.part_id)
        if not part:
            raise HTTPException(status_code=404, detail="Part not found")
        
        # Find the appropriate anchor for this part
        anchor = session.exec(
            select(Anchor).where(
                Anchor.car_model_id == adjustment_data.car_model_id,
                Anchor.name == part.attach_to
            )
        ).first()
        
        if not anchor:
            # Try to find anchor by type
            anchor = session.exec(
                select(Anchor).where(
                    Anchor.car_model_id == adjustment_data.car_model_id,
                    Anchor.type == part.type
                )
            ).first()
        
        if not anchor:
            raise HTTPException(status_code=404, detail="No suitable anchor found for this part")
        
        # Check if user fitment already exists
        existing_fitment = session.exec(
            select(Fitment).where(
                Fitment.car_model_id == adjustment_data.car_model_id,
                Fitment.part_id == adjustment_data.part_id,
                Fitment.anchor_id == anchor.id,
                Fitment.scope == "user",
                Fitment.created_by_user_id == current_user.id
            )
        ).first()
        
        if existing_fitment:
            # Update existing fitment
            existing_fitment.transform_override = json.dumps(adjustment_data.transform)
            existing_fitment.updated_at = datetime.utcnow()
            existing_fitment.version += 1
            session.add(existing_fitment)
            session.commit()
            session.refresh(existing_fitment)
            
            fitment_dict = existing_fitment.dict()
            try:
                fitment_dict["transform_override"] = json.loads(existing_fitment.transform_override) if existing_fitment.transform_override else {}
            except:
                fitment_dict["transform_override"] = {}
            return FitmentResponse(**fitment_dict)
        else:
            # Create new user fitment
            fitment = Fitment(
                car_model_id=adjustment_data.car_model_id,
                part_id=adjustment_data.part_id,
                anchor_id=anchor.id,
                transform_override=json.dumps(adjustment_data.transform),
                scope="user",
                created_by_user_id=current_user.id,
                quality_score=0.8  # Higher score for manual adjustments
            )
            
            session.add(fitment)
            session.commit()
            session.refresh(fitment)
            
            fitment_dict = fitment.dict()
            try:
                fitment_dict["transform_override"] = json.loads(fitment.transform_override) if fitment.transform_override else {}
            except:
                fitment_dict["transform_override"] = {}
            return FitmentResponse(**fitment_dict)
            
    except Exception as e:
        print(f"❌ Error in save_manual_adjustment: {e}")
        print(f"❌ Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=422, detail=f"Validation error: {str(e)}")

@router.delete("/{fitment_id}", status_code=204)
def delete_fitment(
    fitment_id: str,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user)
):
    """Delete a user's fitment"""
    fitment = session.get(Fitment, fitment_id)
    if not fitment:
        raise HTTPException(status_code=404, detail="Fitment not found")
    
    # Only allow users to delete their own fitments
    if fitment.created_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this fitment")
    
    session.delete(fitment)
    session.commit()
    return 