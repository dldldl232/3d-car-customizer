#!/usr/bin/env python3
"""
Test script for Sketchfab integration
"""

import os
import sys
from app.services.sketchfab_service import SketchfabService

def test_sketchfab_integration():
    """Test the Sketchfab service with the correct endpoints"""
    
    # Get API token from environment
    api_token = os.getenv('SKETCHFAB_API_TOKEN')
    if not api_token:
        print("Please set SKETCHFAB_API_TOKEN environment variable")
        return
    
    # Initialize service
    service = SketchfabService(api_token)
    
    print("=== Testing Sketchfab Integration ===\n")
    
    # Test 1: Search for car models
    print("1. Searching for car models...")
    result = service.search_models(
        query="car",
        categories=["vehicles"],
        downloadable=True,
        limit=5
    )
    
    print(f"Found {len(result['models'])} downloadable car models")
    for model in result['models']:
        print(f"  - {model.name} (UID: {model.uid})")
        print(f"    License: {model.license}")
        print(f"    Uploader: {model.uploader}")
        print(f"    Downloadable: {model.is_downloadable}")
        print(f"    Face count: {model.face_count}")
        print()
    
    # Test 2: Get model details
    if result['models']:
        test_model = result['models'][0]
        print(f"2. Getting details for model {test_model.uid}...")
        details = service.get_model_details(test_model.uid)
        if details:
            print(f"  Name: {details.name}")
            print(f"  Description: {details.description[:100]}...")
            print(f"  License: {details.license}")
            print(f"  Attribution: {details.attribution_html}")
            print()
    
    # Test 3: Get download URL
    if result['models']:
        test_model = result['models'][0]
        print(f"3. Getting download URL for model {test_model.uid}...")
        download_url = service.get_download_url(test_model.uid)
        if download_url:
            print(f"  Download URL: {download_url}")
        else:
            print("  No download URL available")
        print()
    
    # Test 4: Get licenses
    print("4. Getting available licenses...")
    licenses = service.get_licenses()
    print(f"Found {len(licenses)} licenses:")
    for license_info in licenses:
        if license_info.get('uid') in service.allowed_licenses:
            print(f"  ✓ {license_info.get('uid')} - {license_info.get('label', 'Unknown')}")
        else:
            print(f"  ✗ {license_info.get('uid')} - {license_info.get('label', 'Unknown')}")
    print()
    
    # Test 5: Get categories
    print("5. Getting available categories...")
    categories = service.get_categories()
    print(f"Found {len(categories)} categories:")
    for category in categories[:10]:  # Show first 10
        print(f"  - {category.get('slug', 'Unknown')}: {category.get('name', 'Unknown')}")
    print()
    
    # Test 6: Search specifically for car models
    print("6. Searching specifically for car models...")
    car_models = service.search_car_models(limit=10)
    print(f"Found {len(car_models)} car models with allowed licenses:")
    for model in car_models:
        print(f"  - {model.name} ({model.license}) by {model.uploader}")
    print()
    
    print("=== Test completed ===")

def main():
    """Main function"""
    test_sketchfab_integration()

if __name__ == "__main__":
    main() 