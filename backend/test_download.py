#!/usr/bin/env python3
"""
Test script to download a car model from Sketchfab
"""

import os
import requests
from app.services.sketchfab_service import SketchfabService

def test_download():
    api_token = os.getenv("SKETCHFAB_API_TOKEN")
    if not api_token:
        print("❌ SKETCHFAB_API_TOKEN not set")
        return
    
    service = SketchfabService(api_token)
    
    print("=== Testing Model Download ===")
    
    # Search for car models
    car_models = service.search_car_models(limit=3)
    
    if not car_models:
        print("No car models found")
        return
    
    # Test with the first car model
    test_model = car_models[0]
    print(f"Testing download with: {test_model.name}")
    print(f"Model UID: {test_model.uid}")
    print(f"License: {test_model.license}")
    print(f"Uploader: {test_model.uploader}")
    
    # Get download URL
    print(f"\nGetting download URL...")
    download_url = service.get_download_url(test_model.uid)
    
    if download_url:
        print(f"✅ Download URL obtained: {download_url[:50]}...")
        
        # Create downloads directory
        os.makedirs("downloads", exist_ok=True)
        download_path = f"downloads/{test_model.uid}.glb"
        
        # Download the model
        print(f"Downloading to {download_path}...")
        success = service.download_model(test_model.uid, download_path)
        
        if success:
            print(f"✅ Model downloaded successfully!")
            print(f"File size: {os.path.getsize(download_path)} bytes")
        else:
            print("❌ Download failed")
    else:
        print("❌ Could not get download URL")

if __name__ == "__main__":
    test_download() 