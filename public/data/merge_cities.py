#!/usr/bin/env python3

import json
import os

def merge_and_deduplicate_cities():
    # Define file paths
    current_dir = os.path.dirname(os.path.abspath(__file__))
    file1_path = os.path.join(current_dir, 'us-cities.json')
    file2_path = os.path.join(current_dir, 'us-cities-new.json')
    output_path = os.path.join(current_dir, 'us-cities-merged.json')
    
    # Read the first file
    with open(file1_path, 'r') as f1:
        data1 = json.load(f1)
    
    # Read the second file
    with open(file2_path, 'r') as f2:
        data2 = json.load(f2)
    
    # Ensure both files have the expected structure
    if 'type' not in data1 or 'features' not in data1 or 'type' not in data2 or 'features' not in data2:
        raise ValueError("One or both input files don't have the expected GeoJSON structure")
    
    # Create a dictionary to track unique cities by name and state
    unique_cities = {}
    
    # Process features from both files
    all_features = data1['features'] + data2['features']
    
    # Filter out duplicates
    merged_features = []
    for feature in all_features:
        if 'properties' in feature and 'name' in feature['properties'] and 'state' in feature['properties']:
            city_name = feature['properties']['name']
            state_name = feature['properties']['state']
            key = f"{city_name}_{state_name}"
            
            if key not in unique_cities:
                unique_cities[key] = True
                merged_features.append(feature)
    
    # Create the merged GeoJSON
    merged_data = {
        "type": "FeatureCollection",
        "features": merged_features
    }
    
    # Write the merged data to the output file
    with open(output_path, 'w') as out_file:
        json.dump(merged_data, out_file, indent=2)
    
    print(f"Merged and deduplicated {len(merged_features)} cities to {output_path}")
    print(f"Original files had {len(data1['features'])} and {len(data2['features'])} cities")

if __name__ == "__main__":
    merge_and_deduplicate_cities()

