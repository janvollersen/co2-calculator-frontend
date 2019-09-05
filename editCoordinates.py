# editCoordinates.py
# script to edit the location of geodata in maps

import json
import sys

FILENAME = sys.argv[1]
SCALE = float(sys.argv[2])
LAT_OFFSET = 24.758239
LON_OFFSET = 46.663474
with open(FILENAME, 'r+') as f:
    data = json.load(f)
    buildings = data["features"]
    for building in buildings:
        for coord in building["geometry"]["coordinates"][0][0]:
            coord[0] = coord[0]/SCALE + LON_OFFSET
            coord[1] = coord[1]/SCALE + LAT_OFFSET
    f.seek(0)
    f.write(json.dumps(data))
    f.truncate()


    # for b in buildings:
    #     for coord in b["geometry"]["coordinates"][0][0]:
    #         coord[0] = coord[0]/20
    #         coord[1] = coord[1]/20
    #         print(coord)
