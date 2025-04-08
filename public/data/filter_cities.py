#!/usr/bin/env python3

import json
import os

def filter_cities_by_population(input_file, output_file, min_population):
    """
    Filter cities in a GeoJSON file by population and save to a new file.
    
    Args:
        input_file (str): Path to the input GeoJSON file
        output_file (str): Path to the output GeoJSON file
        min_population (int): Minimum population threshold
    """
    print(f"Loading cities from {input_file}...")
    
    with open(input_file, 'r') as f:
        data = json.load(f)
    
    original_count = len(data['features'])
    print(f"Original file contains {original_count} cities")
    
    # Filter cities by population
    data['features'] = [feature for feature in data['features'] 
                        if feature['properties'].get('population', 0) >= min_population]
    
    filtered_count = len(data['features'])
    print(f"Filtered to {filtered_count} cities with population >= {min_population}")
    print(f"Removed {original_count - filtered_count} cities")
    
    # Write the filtered data to the output file
    with open(output_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Saved filtered data to {output_file}")

if __name__ == "__main__":
    #input_file = "us-cities-converted.json"
    #output_file = "us-cities-5000.json"
    input_file = "us-cities-10000.json"
    output_file = "us-cities-20000.json"
    min_population = 20000 
    
    if not os.path.exists(input_file):
        print(f"Error: Input file {input_file} not found!")
        exit(1)
    
    filter_cities_by_population(input_file, output_file, min_population)

