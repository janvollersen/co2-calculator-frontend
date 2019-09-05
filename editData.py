# editData.py
# script to edit the location of geodata in maps

import json

FILENAME = 'resTest.json'
with open(FILENAME, 'r') as f:
    data = json.load(f)
    buildings = data["features"][0:10]
    for b in buildings:
        for coord in b["geometry"]["coordinates"][0][0]:
            coord[0] = coord[0]/20
            coord[1] = coord[1]/20
            print(coord)
            
        
