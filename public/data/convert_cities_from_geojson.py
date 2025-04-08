#!/usr/bin/env python3
import json

# Dictionary to map US state codes to full state names
US_STATE_CODES = {
    "AL": "Alabama",
    "AK": "Alaska",
    "AZ": "Arizona",
    "AR": "Arkansas",
    "CA": "California",
    "CO": "Colorado",
    "CT": "Connecticut",
    "DE": "Delaware",
    "FL": "Florida",
    "GA": "Georgia",
    "HI": "Hawaii",
    "ID": "Idaho",
    "IL": "Illinois",
    "IN": "Indiana",
    "IA": "Iowa",
    "KS": "Kansas",
    "KY": "Kentucky",
    "LA": "Louisiana",
    "ME": "Maine",
    "MD": "Maryland",
    "MA": "Massachusetts",
    "MI": "Michigan",
    "MN": "Minnesota",
    "MS": "Mississippi",
    "MO": "Missouri",
    "MT": "Montana",
    "NE": "Nebraska",
    "NV": "Nevada",
    "NH": "New Hampshire",
    "NJ": "New Jersey",
    "NM": "New Mexico",
    "NY": "New York",
    "NC": "North Carolina",
    "ND": "North Dakota",
    "OH": "Ohio",
    "OK": "Oklahoma",
    "OR": "Oregon",
    "PA": "Pennsylvania",
    "RI": "Rhode Island",
    "SC": "South Carolina",
    "SD": "South Dakota",
    "TN": "Tennessee",
    "TX": "Texas",
    "UT": "Utah",
    "VT": "Vermont",
    "VA": "Virginia",
    "WA": "Washington",
    "WV": "West Virginia",
    "WI": "Wisconsin",
    "WY": "Wyoming",
    "DC": "District of Columbia",
    "PR": "Puerto Rico",
    "VI": "Virgin Islands",
    "GU": "Guam",
    "MP": "Northern Mariana Islands",
    "AS": "American Samoa",
    "FM": "Federated States of Micronesia",
    "MH": "Marshall Islands",
    "PW": "Palau"
}

def convert_cities():
    # Read the source GeoJSON file
    with open('all-us-cities-1000.geojson', 'r') as f:
        source_data = json.load(f)
    
    # Read the target format file to understand structure
    with open('us-cities-merged.json', 'r') as f:
        target_structure = json.load(f)
    
    # Create a new GeoJSON object with the same structure as the target
    converted_data = {
        "type": "FeatureCollection",
        "features": []
    }
    
    # Process each feature from the source data
    for feature in source_data['features']:
        # Extract properties we need
        properties = feature['properties']
        name = properties.get('name', '')
        admin1_code = properties.get('admin1_code', '')
        population = properties.get('population', 0)
        
        # Get full state name from the state code
        state_name = US_STATE_CODES.get(admin1_code, admin1_code)
        
        # Extract coordinates from the geometry
        coordinates = feature['geometry']['coordinates']
        
        # Create a new feature in the target format
        new_feature = {
            "type": "Feature",
            "properties": {
                "name": name,
                "state": state_name,
                "population": population
            },
            "geometry": {
                "type": "Point",
                "coordinates": coordinates
            }
        }
        
        # Add the new feature to our converted data
        converted_data['features'].append(new_feature)
    
    # Write the converted data to a new file
    with open('us-cities-converted.json', 'w') as f:
        json.dump(converted_data, f, indent=2)
    
    print(f"Conversion complete! Created us-cities-converted.json with {len(converted_data['features'])} cities.")

if __name__ == "__main__":
    convert_cities()

