#!/usr/bin/env python3
"""
Test script for the ingestion service
"""

import os
from app.services.ingestion_service import IngestionService

def test_ingestion():
    api_token = os.getenv("SKETCHFAB_API_TOKEN")
    if not api_token:
        print("❌ SKETCHFAB_API_TOKEN not set")
        return
    
    service = IngestionService(api_token)
    
    print("=== Testing Model Ingestion ===")
    
    # Ingest 2 car models
    ingested_models = service.ingest_car_models(limit=2)
    
    print(f"\n=== Ingestion Results ===")
    print(f"Successfully ingested {len(ingested_models)} models:")
    
    for model in ingested_models:
        print(f"  - {model.name} (ID: {model.id})")
        print(f"    Source UID: {model.source_uid}")
        print(f"    License: {model.license_slug}")
        print(f"    GLB URL: {model.glb_url}")

if __name__ == "__main__":
    test_ingestion() 