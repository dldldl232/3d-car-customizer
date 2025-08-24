#!/usr/bin/env python3
"""
Debug script to see what download formats are available
"""

import os
import requests
from app.services.sketchfab_service import SketchfabService

def debug_download():
    api_token = os.getenv("SKETCHFAB_API_TOKEN")
    if not api_token:
        print("❌ SKETCHFAB_API_TOKEN not set")
        return
    
    service = SketchfabService(api_token)
    
    print("=== Debugging Download Formats ===")
    
    # Search for car models
    car_models = service.search_car_models(limit=3)
    
    if not car_models:
        print("No car models found")
        return
    
    # Test with the first car model
    test_model = car_models[0]
    print(f"Testing with: {test_model.name} (UID: {test_model.uid})")
    
    # Get raw download info
    url = f"https://api.sketchfab.com/v3/models/{test_model.uid}/download"
    headers = {
        "Authorization": f"Token {api_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        print(f"\nDownload response:")
        print(f"Status: {response.status_code}")
        print(f"Data keys: {list(data.keys())}")
        
        if "files" in data:
            print(f"\nAvailable download formats:")
            for i, file_info in enumerate(data["files"]):
                print(f"  {i+1}. Format: {file_info.get('format', 'N/A')}")
                print(f"     Size: {file_info.get('size', 'N/A')}")
                print(f"     URL: {file_info.get('url', 'N/A')[:50]}...")
                print()
        else:
            print("No files found in response")
            print(f"Full response: {data}")
        
    except Exception as e:
        print(f"Error getting download info: {e}")

if __name__ == "__main__":
    debug_download() 