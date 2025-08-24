import requests
import json
import os
from typing import Dict, List, Optional
from dataclasses import dataclass
from urllib.parse import urljoin

@dataclass
class SketchfabModel:
    uid: str
    name: str
    description: str
    license: str
    license_url: str
    attribution_html: str
    download_url: str
    thumbnail_url: str
    uploader: str
    categories: List[str]
    tags: List[str]
    is_downloadable: bool
    face_count: int
    vertex_count: int

class SketchfabService:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.base_url = "https://api.sketchfab.com/v3"
        self.headers = {
            "Authorization": f"Token {api_token}",
            "Content-Type": "application/json"
        }
        
        # Only allow CC-BY and CC0 licenses
        # Using actual UIDs from Sketchfab API
        self.allowed_licenses = [
            "322a749bcfa841b29dff1e8a1bb74b0b",  # CC Attribution
            "7c23a1ba438d4306920229c12afcb5f9"   # CC0 Public Domain
        ]
    
    def search_models(self, query: str, categories: List[str] = None, 
                     downloadable: bool = True, limit: int = 24, cursor: str = None) -> Dict:
        """
        Search for models on Sketchfab using the correct endpoint
        """
        url = f"{self.base_url}/search"
        params = {
            "q": query,
            "type": "models",
            "downloadable": downloadable,
            "count": limit
        }
        
        if categories:
            params["categories"] = ",".join(categories)
        
        if cursor:
            params["cursor"] = cursor
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            
            data = response.json()
            models = []
            
            for result in data.get("results", []):
                # Only include models with allowed licenses
                license_uid = result.get("license", {}).get("uid", "")
                if license_uid not in self.allowed_licenses:
                    continue
                
                # Only include downloadable models
                if not result.get("isDownloadable", False):
                    continue
                
                model = SketchfabModel(
                    uid=result["uid"],
                    name=result["name"],
                    description=result.get("description", ""),
                    license=result["license"]["uid"],
                    license_url=result["license"].get("url", ""),
                    attribution_html=result["license"].get("attribution_html", ""),
                    download_url="",  # Will be fetched separately
                    thumbnail_url=result["thumbnails"]["images"][0]["url"],
                    uploader=result["user"].get("display_name", "Unknown"),
                    categories=result.get("categories", []),
                    tags=result.get("tags", []),
                    is_downloadable=result.get("isDownloadable", False),
                    face_count=result.get("faceCount", 0),
                    vertex_count=result.get("vertexCount", 0)
                )
                models.append(model)
            
            return {
                "models": models,
                "next_cursor": data.get("next", ""),
                "total_count": data.get("totalCount", 0)
            }
            
        except requests.exceptions.RequestException as e:
            print(f"Error searching Sketchfab: {e}")
            return {"models": [], "next_cursor": "", "total_count": 0}
    
    def get_model_details(self, uid: str) -> Optional[SketchfabModel]:
        """
        Get detailed information about a specific model
        """
        url = f"{self.base_url}/models/{uid}"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Check if license is allowed
            license_uid = data.get("license", {}).get("uid", "")
            if license_uid not in self.allowed_licenses:
                print(f"Model {uid} has disallowed license: {license_uid}")
                return None
            
            # Check if downloadable
            if not data.get("isDownloadable", False):
                print(f"Model {uid} is not downloadable")
                return None
            
            return SketchfabModel(
                uid=data["uid"],
                name=data["name"],
                description=data.get("description", ""),
                license=data["license"]["uid"],
                license_url=data["license"].get("url", ""),
                attribution_html=data["license"].get("attribution_html", ""),
                download_url="",  # Will be fetched separately
                thumbnail_url=data["thumbnails"]["images"][0]["url"],
                uploader=data["user"].get("display_name", "Unknown"),
                categories=data.get("categories", []),
                tags=data.get("tags", []),
                is_downloadable=data.get("isDownloadable", False),
                face_count=data.get("faceCount", 0),
                vertex_count=data.get("vertexCount", 0)
            )
            
        except requests.exceptions.RequestException as e:
            print(f"Error getting model details: {e}")
            return None
    
    def get_download_url(self, uid: str) -> Optional[str]:
        """
        Get download URL for a model using the correct endpoint
        """
        url = f"{self.base_url}/models/{uid}/download"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            
            # Get the GLB download URL - it's directly in the response
            if "glb" in data:
                return data["glb"].get("url", "")
            
            print(f"No GLB download URL found for model {uid}")
            return None
            
        except requests.exceptions.RequestException as e:
            print(f"Error getting download URL: {e}")
            return None
    
    def download_model(self, uid: str, download_path: str) -> bool:
        """
        Download a model from Sketchfab
        """
        # First get the download URL
        download_url = self.get_download_url(uid)
        if not download_url:
            print(f"No download URL available for model {uid}")
            return False
        
        try:
            # Download the model
            response = requests.get(download_url)
            response.raise_for_status()
            
            # Save to file
            with open(download_path, 'wb') as f:
                f.write(response.content)
            
            print(f"Downloaded model {uid} to {download_path}")
            return True
            
        except requests.exceptions.RequestException as e:
            print(f"Error downloading model: {e}")
            return False
    
    def search_car_models(self, limit: int = 24) -> List[SketchfabModel]:
        """
        Search specifically for car models with allowed licenses
        """
        car_queries = [
            "car model",
            "automobile",
            "vehicle",
            "sports car",
            "luxury car",
            "classic car"
        ]
        
        all_models = []
        for query in car_queries:
            result = self.search_models(
                query=query,
                categories=["cars-vehicles"],  # Fixed category slug
                downloadable=True,
                limit=limit // len(car_queries)
            )
            all_models.extend(result["models"])
        
        # Remove duplicates based on UID
        unique_models = {model.uid: model for model in all_models}.values()
        return list(unique_models)
    
    def get_licenses(self) -> List[Dict]:
        """
        Get available licenses from Sketchfab
        """
        url = f"{self.base_url}/licenses"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            return data.get("results", [])
            
        except requests.exceptions.RequestException as e:
            print(f"Error getting licenses: {e}")
            return []
    
    def get_categories(self) -> List[Dict]:
        """
        Get available categories from Sketchfab
        """
        url = f"{self.base_url}/categories"
        
        try:
            response = requests.get(url, headers=self.headers)
            response.raise_for_status()
            
            data = response.json()
            return data.get("results", [])
            
        except requests.exceptions.RequestException as e:
            print(f"Error getting categories: {e}")
            return []
    
    def validate_license(self, license_uid: str) -> bool:
        """
        Check if a license allows commercial use (CC-BY or CC0)
        """
        return license_uid in self.allowed_licenses 