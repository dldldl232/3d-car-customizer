#!/usr/bin/env python3
"""
Service to ingest parts from Sketchfab into the database
"""

import os
import json
from typing import List, Optional
from sqlmodel import Session, create_engine, select
from app.models import Part
from app.services.sketchfab_service import SketchfabService
from app.db import DATABASE_URL

class PartIngestionService:
    def __init__(self, api_token: str):
        self.sketchfab_service = SketchfabService(api_token)
        self.downloads_dir = "downloads"
        self.engine = create_engine(DATABASE_URL, echo=True)
        os.makedirs(self.downloads_dir, exist_ok=True)
    
    def ingest_parts(self, limit: int = 20) -> List[Part]:
        """
        Ingest parts from Sketchfab into the database
        """
        print(f"=== Ingesting {limit} parts from Sketchfab ===")
        
        # Define part categories and search terms - improved for better filtering
        part_categories = {
            "wheels": ["car wheel rim", "alloy wheel", "sport wheel", "tire rim", "wheel rim"],
            "exterior": ["car spoiler", "body kit", "car bumper", "side skirt", "car hood", "car fender"],
            "performance": ["car exhaust", "car intake", "car turbo", "car muffler"],
            "lights": ["car headlight", "car taillight", "led headlight", "car fog light"],
            "interior": ["car steering wheel", "car seat", "car dashboard", "gear shift"]
        }
        
        ingested_parts = []
        
        for part_type, search_terms in part_categories.items():
            print(f"\n--- Ingesting {part_type} parts ---")
            
            for search_term in search_terms:
                try:
                    # Search for parts
                    result = self.sketchfab_service.search_models(
                        query=search_term,
                        categories=["cars-vehicles"],
                        downloadable=True,
                        limit=limit // len(part_categories)
                    )
                    
                    if not result["models"]:
                        print(f"No {part_type} models found for '{search_term}'")
                        continue
                    
                    for sketchfab_model in result["models"]:
                        try:
                            # Filter out irrelevant models
                            if self._is_irrelevant_model(sketchfab_model):
                                print(f"Skipping irrelevant model: {sketchfab_model.name}")
                                continue
                            
                            # Check if part already exists
                            with Session(self.engine) as session:
                                existing = session.exec(
                                    select(Part).where(Part.source_uid == sketchfab_model.uid)
                                ).first()
                                
                                if existing:
                                    print(f"Part {sketchfab_model.name} already exists")
                                    continue
                                
                                # Download the part
                                download_path = self._download_part(sketchfab_model)
                                if not download_path:
                                    print(f"Failed to download {sketchfab_model.name}")
                                    continue
                                
                                # Create part in database
                                part = Part(
                                    name=sketchfab_model.name,
                                    type=part_type,
                                    price=self._estimate_price(part_type),
                                    glb_url=download_path,
                                    thumbnail_url=sketchfab_model.thumbnail_url,
                                    license_slug=sketchfab_model.license,
                                    license_url=sketchfab_model.license_url,
                                    attribution_html=sketchfab_model.attribution_html,
                                    source_url=f"https://sketchfab.com/3d-models/{sketchfab_model.uid}",
                                    uploader=sketchfab_model.uploader,
                                    source_uid=sketchfab_model.uid,
                                    intrinsic_size=self._calculate_intrinsic_size(sketchfab_model),
                                    attach_to=self._get_attach_to(part_type),
                                    pos_x=0.0, pos_y=0.0, pos_z=0.0,
                                    rot_x=0.0, rot_y=0.0, rot_z=0.0,
                                    scale_x=1.0, scale_y=1.0, scale_z=1.0
                                )
                                
                                session.add(part)
                                session.commit()
                                session.refresh(part)
                                
                                ingested_parts.append(part)
                                print(f"✅ Ingested: {part.name} ({part_type})")
                                
                        except Exception as e:
                            print(f"❌ Failed to ingest {sketchfab_model.name}: {e}")
                            continue
                            
                except Exception as e:
                    print(f"❌ Error searching for {part_type}: {e}")
                    continue
        
        print(f"=== Part ingestion complete: {len(ingested_parts)} parts added ===")
        return ingested_parts
    
    def _is_irrelevant_model(self, sketchfab_model) -> bool:
        """
        Check if a model is irrelevant for car parts
        """
        name_lower = sketchfab_model.name.lower()
        
        # Check for truck/vehicle parts
        if any(keyword in name_lower for keyword in [
            'volvo-fh12', 'volvo fh12', 'fh12', 'truck', 'lorry', 'semi',
            'container', 'shipping', 'freight', 'cargo', 'trailer', 'wsc'
        ]):
            return True
        
        # Check for non-car items
        if any(keyword in name_lower for keyword in [
            'space fighter', 'hammerhead', 'fighter', 'aircraft', 'plane',
            'tank', 'military', 'weapon', 'missile', 'rocket', 'building',
            'house', 'furniture', 'chair', 'table', 'lamp', 'street'
        ]):
            return True
        
        # Check for full car models (not parts)
        if any(keyword in name_lower for keyword in [
            'porsche 911', 'bmw', 'ford', 'mustang', 'audi r8', 'honda s2000',
            'corvette', 'lamborghini', 'ferrari', 'mercedes'
        ]) and not any(part_keyword in name_lower for part_keyword in [
            'wheel', 'spoiler', 'bumper', 'headlight', 'exhaust', 'intake'
        ]):
            return True
        
        return False
    
    def _download_part(self, sketchfab_model) -> Optional[str]:
        """
        Download a part and return the local path
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
            print(f"Error downloading part: {e}")
            return None
    
    def _estimate_price(self, part_type: str) -> float:
        """
        Estimate price based on part type
        """
        price_ranges = {
            "wheels": (200, 800),
            "exterior": (150, 2500),
            "performance": (500, 3000),
            "lights": (100, 1200),
            "interior": (50, 500)
        }
        
        import random
        min_price, max_price = price_ranges.get(part_type, (100, 1000))
        return round(random.uniform(min_price, max_price), 2)
    
    def _calculate_intrinsic_size(self, sketchfab_model) -> str:
        """
        Calculate intrinsic size for auto-scaling
        """
        # Default sizes for different part types
        default_sizes = {
            "wheels": {"radius": 0.34, "width": 0.2},
            "exterior": {"length": 1.5, "width": 0.5, "height": 0.3},
            "performance": {"length": 0.8, "width": 0.3, "height": 0.3},
            "lights": {"length": 0.3, "width": 0.2, "height": 0.1},
            "interior": {"length": 0.4, "width": 0.3, "height": 0.2}
        }
        
        # For now, return default sizes based on model name
        for part_type, size in default_sizes.items():
            if part_type in sketchfab_model.name.lower():
                return json.dumps(size)
        
        return json.dumps({"length": 0.5, "width": 0.5, "height": 0.5})
    
    def _get_attach_to(self, part_type: str) -> str:
        """
        Get anchor name for part type
        """
        anchor_mapping = {
            "wheels": "wheels",
            "exterior": "spoiler_anchor",
            "performance": "exhaust",
            "lights": "headlights",
            "interior": "interior"
        }
        
        return anchor_mapping.get(part_type, "default_anchor")
    
    # Removed _link_to_car_models method since we don't need it during ingestion 