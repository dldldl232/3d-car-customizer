#!/usr/bin/env python3
"""
Debug script to see what license UIDs are actually available
"""

import os
import requests
from app.services.sketchfab_service import SketchfabService

def debug_licenses():
    api_token = os.getenv("SKETCHFAB_API_TOKEN")
    if not api_token:
        print("❌ SKETCHFAB_API_TOKEN not set")
        return
    
    service = SketchfabService(api_token)
    
    print("=== Debugging License UIDs ===")
    
    # Get raw license response
    url = "https://api.sketchfab.com/v3/licenses"
    headers = {
        "Authorization": f"Token {api_token}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        
        print(f"\nRaw license response:")
        print(f"Status: {response.status_code}")
        print(f"Data keys: {list(data.keys())}")
        
        if "results" in data:
            print(f"\nFound {len(data['results'])} licenses:")
            for i, license_info in enumerate(data["results"]):
                print(f"  License {i+1}:")
                print(f"    Keys: {list(license_info.keys())}")
                print(f"    Full data: {license_info}")
                print()
        
    except Exception as e:
        print(f"Error getting licenses: {e}")
    
    # Test search
    print(f"\n=== Testing Search ===")
    try:
        search_url = "https://api.sketchfab.com/v3/search"
        params = {
            "q": "car",
            "type": "models",
            "downloadable": True,
            "count": 5
        }
        
        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()
        data = response.json()
        
        print(f"Search response keys: {list(data.keys())}")
        print(f"Total results: {data.get('totalCount', 0)}")
        
        if "results" in data and data["results"]:
            print(f"\nFound {len(data['results'])} car models:")
            for i, result in enumerate(data["results"]):
                name = result.get("name", "Unknown")
                is_downloadable = result.get("isDownloadable", False)
                license_info = result.get("license", {})
                license_uid = license_info.get("uid", "N/A")
                license_label = license_info.get("label", "N/A")
                
                print(f"  {i+1}. '{name}'")
                print(f"     Downloadable: {is_downloadable}")
                print(f"     License UID: '{license_uid}'")
                print(f"     License Label: '{license_label}'")
                print()
        else:
            print("No car models found")
        
    except Exception as e:
        print(f"Error searching: {e}")

if __name__ == "__main__":
    debug_licenses() 