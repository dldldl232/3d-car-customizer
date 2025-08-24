#!/usr/bin/env python3
"""
Test script for part ingestion from Sketchfab
"""

import os
from app.services.part_ingestion_service import PartIngestionService
from app.config import get_settings

def test_part_ingestion():
    # Get settings
    settings = get_settings()
    
    if not settings.sketchfab_api_token:
        print("❌ No Sketchfab API token found in settings")
        return
    
    print("🚀 Starting part ingestion test...")
    
    # Create ingestion service
    ingestion_service = PartIngestionService(settings.sketchfab_api_token)
    
    try:
        # Ingest parts (limit to 10 for testing)
        ingested_parts = ingestion_service.ingest_parts(limit=10)
        
        print(f"\n✅ Successfully ingested {len(ingested_parts)} parts:")
        for part in ingested_parts:
            print(f"  - {part.name} ({part.type}) - ${part.price}")
            
    except Exception as e:
        print(f"❌ Error during part ingestion: {e}")

if __name__ == "__main__":
    test_part_ingestion() 