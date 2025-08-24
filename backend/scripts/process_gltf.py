#!/usr/bin/env python3
"""
Script to process GLTF files for car customization
- Add anchor nodes for part attachment
- Optimize for web use
- Convert to GLB format
"""

import json
import os
import sys
from pathlib import Path
from typing import Dict, List, Tuple
import trimesh
import numpy as np

def add_anchor_nodes(gltf_path: str, output_path: str) -> bool:
    """
    Add anchor nodes to a GLTF file for part attachment
    """
    try:
        # Load the GLTF file
        with open(gltf_path, 'r') as f:
            gltf_data = json.load(f)
        
        # Get the nodes array
        nodes = gltf_data.get('nodes', [])
        
        # Define anchor nodes for car parts
        anchor_nodes = create_anchor_nodes()
        
        # Add anchor nodes to the scene
        for anchor in anchor_nodes:
            nodes.append(anchor)
        
        # Update the GLTF data
        gltf_data['nodes'] = nodes
        
        # Save the modified GLTF
        with open(output_path, 'w') as f:
            json.dump(gltf_data, f, indent=2)
        
        print(f"Added {len(anchor_nodes)} anchor nodes to {output_path}")
        return True
        
    except Exception as e:
        print(f"Error processing GLTF: {e}")
        return False

def create_anchor_nodes() -> List[Dict]:
    """
    Create anchor nodes for car part attachment
    """
    anchors = [
        # Wheel anchors
        {
            "name": "wheel_FL_anchor",
            "type": "wheel",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.8, 0, -1.2, 1],
            "extras": {
                "radius": 0.34,
                "axis": "x",
                "type": "wheel"
            }
        },
        {
            "name": "wheel_FR_anchor",
            "type": "wheel",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.8, 0, -1.2, 1],
            "extras": {
                "radius": 0.34,
                "axis": "x",
                "type": "wheel"
            }
        },
        {
            "name": "wheel_RL_anchor",
            "type": "wheel",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.8, 0, 1.2, 1],
            "extras": {
                "radius": 0.34,
                "axis": "x",
                "type": "wheel"
            }
        },
        {
            "name": "wheel_RR_anchor",
            "type": "wheel",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.8, 0, 1.2, 1],
            "extras": {
                "radius": 0.34,
                "axis": "x",
                "type": "wheel"
            }
        },
        
        # Body part anchors
        {
            "name": "spoiler_anchor",
            "type": "spoiler",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1.2, -2.5, 1],
            "extras": {
                "type": "spoiler"
            }
        },
        {
            "name": "hood_anchor",
            "type": "hood",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1.0, 0, 1],
            "extras": {
                "type": "hood"
            }
        },
        {
            "name": "exhaust_L_anchor",
            "type": "exhaust",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.3, 0.3, -2.8, 1],
            "extras": {
                "type": "exhaust"
            }
        },
        {
            "name": "exhaust_R_anchor",
            "type": "exhaust",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.3, 0.3, -2.8, 1],
            "extras": {
                "type": "exhaust"
            }
        },
        
        # Light anchors
        {
            "name": "headlight_L_anchor",
            "type": "headlight",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.6, 0.8, 2.6, 1],
            "extras": {
                "type": "headlight"
            }
        },
        {
            "name": "headlight_R_anchor",
            "type": "headlight",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.6, 0.8, 2.6, 1],
            "extras": {
                "type": "headlight"
            }
        },
        {
            "name": "taillight_L_anchor",
            "type": "taillight",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, -0.6, 0.8, -2.6, 1],
            "extras": {
                "type": "taillight"
            }
        },
        {
            "name": "taillight_R_anchor",
            "type": "taillight",
            "matrix": [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0.6, 0.8, -2.6, 1],
            "extras": {
                "type": "taillight"
            }
        }
    ]
    
    return anchors

def optimize_gltf(gltf_path: str, output_path: str) -> bool:
    """
    Optimize GLTF file for web use
    """
    try:
        # Load the GLTF file
        with open(gltf_path, 'r') as f:
            gltf_data = json.load(f)
        
        # Basic optimizations
        optimized_data = {
            "asset": gltf_data.get("asset", {}),
            "scene": gltf_data.get("scene", 0),
            "scenes": gltf_data.get("scenes", []),
            "nodes": gltf_data.get("nodes", []),
            "materials": gltf_data.get("materials", []),
            "meshes": gltf_data.get("meshes", []),
            "accessors": gltf_data.get("accessors", []),
            "bufferViews": gltf_data.get("bufferViews", []),
            "buffers": gltf_data.get("buffers", [])
        }
        
        # Remove unnecessary fields
        if "animations" in optimized_data:
            del optimized_data["animations"]
        if "cameras" in optimized_data:
            del optimized_data["cameras"]
        if "skins" in optimized_data:
            del optimized_data["skins"]
        
        # Save optimized GLTF
        with open(output_path, 'w') as f:
            json.dump(optimized_data, f, separators=(',', ':'))
        
        print(f"Optimized GLTF saved to {output_path}")
        return True
        
    except Exception as e:
        print(f"Error optimizing GLTF: {e}")
        return False

def convert_to_glb(gltf_path: str, output_path: str) -> bool:
    """
    Convert GLTF to GLB format
    """
    try:
        # Load the GLTF file
        with open(gltf_path, 'r') as f:
            gltf_data = json.load(f)
        
        # Convert to GLB using trimesh
        mesh = trimesh.load(gltf_path)
        mesh.export(output_path, file_type='glb')
        
        print(f"Converted to GLB: {output_path}")
        return True
        
    except Exception as e:
        print(f"Error converting to GLB: {e}")
        return False

def process_car_model(input_path: str, output_dir: str) -> bool:
    """
    Process a car model: add anchors, optimize, convert to GLB
    """
    try:
        # Create output directory
        os.makedirs(output_dir, exist_ok=True)
        
        # Step 1: Add anchor nodes
        anchored_path = os.path.join(output_dir, "with_anchors.gltf")
        if not add_anchor_nodes(input_path, anchored_path):
            return False
        
        # Step 2: Optimize
        optimized_path = os.path.join(output_dir, "optimized.gltf")
        if not optimize_gltf(anchored_path, optimized_path):
            return False
        
        # Step 3: Convert to GLB
        glb_path = os.path.join(output_dir, "car_model.glb")
        if not convert_to_glb(optimized_path, glb_path):
            return False
        
        print(f"Successfully processed car model: {glb_path}")
        return True
        
    except Exception as e:
        print(f"Error processing car model: {e}")
        return False

def main():
    """
    Main function to process GLTF files
    """
    if len(sys.argv) < 3:
        print("Usage: python process_gltf.py <input_gltf> <output_dir>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_dir = sys.argv[2]
    
    if not os.path.exists(input_path):
        print(f"Input file not found: {input_path}")
        sys.exit(1)
    
    success = process_car_model(input_path, output_dir)
    if success:
        print("Processing completed successfully!")
    else:
        print("Processing failed!")
        sys.exit(1)

if __name__ == "__main__":
    main() 