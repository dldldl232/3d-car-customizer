#!/usr/bin/env python3
"""
Test script to see what the API returns for car models
"""

import requests
import json

def test_api():
    base_url = "http://localhost:8000"
    
    try:
        # Test the car models endpoint
        response = requests.get(f"{base_url}/car_models/")
        
        if response.status_code == 200:
            car_models = response.json()
            print(f"API returned {len(car_models)} car models:")
            
            # Find Porsche models
            porsche_models = [car for car in car_models if "porsche" in car["name"].lower()]
            
            print(f"\nFound {len(porsche_models)} Porsche models:")
            for car in porsche_models:
                print(f"  - {car['name']} (ID: {car['id']})")
                print(f"    URL: {car['glb_url']}")
                print(f"    Source UID: {car['source_uid']}")
        else:
            print(f"API returned status {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("Could not connect to API. Is the server running?")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_api() 