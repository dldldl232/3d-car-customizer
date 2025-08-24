#!/usr/bin/env python3
"""
Service to ingest Sketchfab models into the database
"""

import os
import json
from typing import List, Optional
from sqlmodel import Session, create_engine, select
from app.models import CarModel, Anchor
from app.services.sketchfab_service import SketchfabService
from app.db import DATABASE_URL

class IngestionService:
    def __init__(self, api_token: str):
        self.sketchfab_service = SketchfabService(api_token)
        self.downloads_dir = "downloads"
        self.engine = create_engine(DATABASE_URL, echo=True)
        os.makedirs(self.downloads_dir, exist_ok=True)
    
    def ingest_car_models(self, limit: int = 5) -> List[CarModel]:
        """
        Ingest car models from Sketchfab into the database
        """
        print(f"=== Ingesting {limit} car models from Sketchfab ===")
        
        # Get car models from Sketchfab
        sketchfab_models = self.sketchfab_service.search_car_models(limit=limit)
        
        if not sketchfab_models:
            print("No car models found on Sketchfab")
            return []
        
        ingested_models = []
        
        for sketchfab_model in sketchfab_models:
            try:
                # Check if model already exists in database
                with Session(self.engine) as session:
                    existing = session.exec(
                        select(CarModel).where(CarModel.source_uid == sketchfab_model.uid)
                    ).first()
                    
                    if existing:
                        print(f"Model {sketchfab_model.name} already exists in database")
                        continue
                    
                    # Download the model
                    download_path = self._download_model(sketchfab_model)
                    if not download_path:
                        print(f"Failed to download {sketchfab_model.name}")
                        continue
                    
                    # Create car model in database
                    car_model = CarModel(
                        name=sketchfab_model.name,
                        manufacturer="Unknown",  # Could be extracted from name/tags
                        year=2024,  # Default year
                        glb_url=download_path,  # Local path for now
                        thumbnail_url=sketchfab_model.thumbnail_url,
                        license_slug=sketchfab_model.license,
                        license_url=sketchfab_model.license_url,
                        attribution_html=sketchfab_model.attribution_html,
                        source_url=f"https://sketchfab.com/3d-models/{sketchfab_model.uid}",
                        uploader=sketchfab_model.uploader,
                        source_uid=sketchfab_model.uid,
                        bounds="",  # Will be calculated later
                        scale_factor=1.0
                    )
                    
                    session.add(car_model)
                    session.commit()
                    session.refresh(car_model)
                    
                    # Create anchor nodes for this car
                    self._create_anchor_nodes(session, car_model.id)
                    
                    ingested_models.append(car_model)
                    print(f"✅ Ingested: {car_model.name} (ID: {car_model.id})")
                    
            except Exception as e:
                print(f"❌ Failed to ingest {sketchfab_model.name}: {e}")
                continue
        
        print(f"=== Ingestion complete: {len(ingested_models)} models added ===")
        return ingested_models
    
    def _download_model(self, sketchfab_model) -> Optional[str]:
        """
        Download a model and return the local path
        """
        try:
            download_url = self.sketchfab_service.get_download_url(sketchfab_model.uid)
            if not download_url:
                return None
            
            # Create local path
            local_path = f"{self.downloads_dir}/{sketchfab_model.uid}.glb"
            
            # Download if not already exists
            if not os.path.exists(local_path):
                success = self.sketchfab_service.download_model(sketchfab_model.uid, local_path)
                if not success:
                    return None
            
            return local_path
            
        except Exception as e:
            print(f"Error downloading model: {e}")
            return None
    
    def _create_anchor_nodes(self, session: Session, car_model_id: int):
        """
        Create default anchor nodes for a car model
        """
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
            anchor = Anchor(car_model_id=car_model_id, **anchor_data)
            session.add(anchor)
        
        session.commit()
        print(f"Created {len(anchors)} anchor nodes for car model {car_model_id}") 