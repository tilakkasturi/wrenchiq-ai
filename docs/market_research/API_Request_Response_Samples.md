# API Request/Response Samples

## /api/parts

#### **Request**
```json
{
    "vin": "4T1KZ1AK3PU084821",
    "text": "brake pads",
    "part_number":true,
    "price":true,
    "labor": true,
    "failsafe": false
}
```

#### **Response**
```json
{
    "parts": [
        {
            "part_key": "04466",
            "pt": "DISC BRAKE PAD",
            "part_number": "04466-0E070",
            "part_description": "PAD KIT, DISC BRAKE, REAR",
            "system_group": null,
            "display_term": "DISC BRAKE PAD KIT, REAR",
            "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
            "category": "MAIN",
            "system": "BRAKE SYSTEM",
            "image_id": "96332",
            "suggested_price": 72.0,
            "fluid": [],
            "labor": [
                {
                    "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - All",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - Front or Rear, Both Sides",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - OVERHAUL CALIPER - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas - Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE CALIPER - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE",
                "MARK AK NS554"
            ],
            "supersession": null,
            "local_reman_parts": [
                "04466-AZ214"
            ]
        },
        {
            "part_key": "04465",
            "pt": "DISC BRAKE PAD",
            "part_number": "04465-06170",
            "part_description": "PAD KIT, DISC BRAKE, FRONT",
            "system_group": null,
            "display_term": "DISC BRAKE PAD KIT, FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
            "category": "MAIN",
            "system": "BRAKE SYSTEM",
            "image_id": "96330",
            "suggested_price": 122.92,
            "fluid": [],
            "labor": [
                {
                    "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - All",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - Front or Rear, Both Sides",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - OVERHAUL CALIPER - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas - Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE CALIPER - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVH7#,GSV70;AXVA70..LE,XLE",
                "MARK NBK D6504H"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "04465",
            "pt": "DISC BRAKE PAD",
            "part_number": "04465-06170",
            "part_description": "PAD KIT, DISC BRAKE, FRONT",
            "system_group": null,
            "display_term": "DISC BRAKE PAD KIT, FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
            "category": "MAIN",
            "system": "BRAKE SYSTEM",
            "image_id": "96329",
            "suggested_price": 122.92,
            "fluid": [],
            "labor": [
                {
                    "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - All",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - Front or Rear, Both Sides",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - OVERHAUL CALIPER - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas - Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE CALIPER - Gas One - Includes: Bleed Brakes.",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "DISC BRAKE PAD"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVH7#,GSV70;AXVA70..LE,XLE",
                "MARK NBK D6504H"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47710A",
            "pt": "BRAKE CALIPER MOUNTING BOLT",
            "part_number": "90080-10067",
            "part_description": "BOLT, HEXAGON(FOR FRONT DISC BRAKE CALIPER)",
            "system_group": null,
            "display_term": null,
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96329",
            "suggested_price": 4.64,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "04",
            "usage": [
                "AXVA7#,AXVH7#,GSV70",
                "*12-1.25PX29.5-23"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47750",
            "pt": "BRAKE CALIPER",
            "part_number": "47750-06321",
            "part_description": "CYLINDER ASSY, DISC BRAKE, LH",
            "system_group": null,
            "display_term": "BRAKE CALIPER, LEFT FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96329",
            "suggested_price": 186.94,
            "fluid": [],
            "labor": [
                {
                    "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 2.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.4,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                    "Skill": "B",
                    "Labor (Hours)": 0.1,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47730",
            "pt": "BRAKE CALIPER",
            "part_number": "47730-06321",
            "part_description": "CYLINDER ASSY, FRONT DISC BRAKE, RH",
            "system_group": null,
            "display_term": "BRAKE CALIPER, RIGHT FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96330",
            "suggested_price": 186.94,
            "fluid": [],
            "labor": [
                {
                    "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 2.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.4,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                    "Skill": "B",
                    "Labor (Hours)": 0.1,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47715A",
            "pt": "BRAKE CALIPER SLIDE PIN",
            "part_number": "47715-04080",
            "part_description": "PIN, FRONT DISC BRAKE CYLINDER SLIDE",
            "system_group": null,
            "display_term": "BRAKE CALIPER SLIDE PIN, FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96330",
            "suggested_price": 16.78,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "02",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "04945",
            "pt": "BRAKE VIBRATION DAMPER",
            "part_number": "04945-0E071",
            "part_description": "SHIM KIT, ANTI SQUEAL, FRONT",
            "system_group": null,
            "display_term": "DISC BRAKE SHIM KIT, FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96330",
            "suggested_price": 47.06,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "43512",
            "pt": "BRAKE ROTOR",
            "part_number": "43512-06200",
            "part_description": "DISC, FRONT",
            "system_group": null,
            "display_term": "BRAKE ROTOR, FRONT",
            "part_location": "43-03 - FRONT AXLE HUB (1706- )",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96314",
            "suggested_price": 103.61,
            "fluid": [],
            "labor": [
                {
                    "Note": "REFINISH BRAKE DRUM OR ROTOR (REMOVED) - Rotor, Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REFINISH BRAKE DRUM OR ROTOR (REMOVED) - Rotor, One",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REFINISH DISC ROTOR (ON VEHICLE) - Gas - Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REFINISH DISC ROTOR (ON VEHICLE) - Gas - One",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Front, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Front, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - REFINISH DISC ROTOR (REMOVED) - Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - REFINISH DISC ROTOR (REMOVED) - One",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                }
            ],
            "stats": {
                "total_count": 1891,
                "cooccurrence_count": 1156,
                "cooccurrence_percent": 61.13
            },
            "qty": "02",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47850",
            "pt": "BRAKE CALIPER",
            "part_number": "47850-06160",
            "part_description": "CYLINDER ASSY, DISC BRAKE, REAR LH",
            "system_group": null,
            "display_term": "BRAKE CALIPER, LEFT REAR",
            "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96332",
            "suggested_price": 165.49,
            "fluid": [],
            "labor": [
                {
                    "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 2.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.4,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                    "Skill": "B",
                    "Labor (Hours)": 0.1,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47815",
            "pt": "BRAKE CALIPER SLIDE PIN",
            "part_number": "47815-0R050",
            "part_description": "PIN, REAR  CYLINDER SLIDE, NO.2(FOR REAR DISC BRAKE)",
            "system_group": null,
            "display_term": null,
            "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96332",
            "suggested_price": 33.58,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "02",
            "usage": [
                "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "04945",
            "pt": "BRAKE VIBRATION DAMPER",
            "part_number": "04945-0E071",
            "part_description": "SHIM KIT, ANTI SQUEAL, FRONT",
            "system_group": null,
            "display_term": "DISC BRAKE SHIM KIT, FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96329",
            "suggested_price": 47.06,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47715A",
            "pt": "BRAKE CALIPER SLIDE PIN",
            "part_number": "47715-04080",
            "part_description": "PIN, FRONT DISC BRAKE CYLINDER SLIDE",
            "system_group": null,
            "display_term": "BRAKE CALIPER SLIDE PIN, FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96329",
            "suggested_price": 16.78,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "02",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47830",
            "pt": "BRAKE CALIPER",
            "part_number": "47830-06170",
            "part_description": "CYLINDER ASSY, DISC BRAKE, REAR RH",
            "system_group": null,
            "display_term": "BRAKE CALIPER, RIGHT REAR",
            "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96332",
            "suggested_price": 181.29,
            "fluid": [],
            "labor": [
                {
                    "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 2.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.4,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                    "Skill": "B",
                    "Labor (Hours)": 0.1,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "04947",
            "pt": "BRAKE VIBRATION DAMPER",
            "part_number": "04947-0E031",
            "part_description": "FITTING KIT, DISC BRAKE, FRONT",
            "system_group": null,
            "display_term": "DISC BRAKE FITTING KIT, FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96329",
            "suggested_price": 30.09,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "42431",
            "pt": "BRAKE ROTOR",
            "part_number": "42431-06180",
            "part_description": "DISC, REAR",
            "system_group": null,
            "display_term": "BRAKE ROTOR, REAR",
            "part_location": "41-02 - REAR AXLE SHAFT & HUB (1706- )AXVA70,AXVH7#,GSV70",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96301",
            "suggested_price": 98.45,
            "fluid": [],
            "labor": [
                {
                    "Note": "REFINISH BRAKE DRUM OR ROTOR (REMOVED) - Rotor, Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REFINISH BRAKE DRUM OR ROTOR (REMOVED) - Rotor, One",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REFINISH DISC ROTOR (ON VEHICLE) - Gas - Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REFINISH DISC ROTOR (ON VEHICLE) - Gas - One",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Front, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Front, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - REFINISH DISC ROTOR (REMOVED) - Each Additional",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                },
                {
                    "Note": "COMBINATION - REFINISH DISC ROTOR (REMOVED) - One",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE ROTOR"
                }
            ],
            "stats": {
                "total_count": 1891,
                "cooccurrence_count": 1156,
                "cooccurrence_percent": 61.13
            },
            "qty": "02",
            "usage": [
                "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47814",
            "pt": "BRAKE CALIPER SLIDE PIN",
            "part_number": "47814-0R050",
            "part_description": "PIN, CYLINDER SLIDE, NO.1(FOR REAR DISC BRAKE)",
            "system_group": null,
            "display_term": null,
            "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96332",
            "suggested_price": 33.58,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "02",
            "usage": [
                "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47710A",
            "pt": "BRAKE CALIPER MOUNTING BOLT",
            "part_number": "90080-10067",
            "part_description": "BOLT, HEXAGON(FOR FRONT DISC BRAKE CALIPER)",
            "system_group": null,
            "display_term": null,
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96330",
            "suggested_price": 4.64,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "04",
            "usage": [
                "AXVA7#,AXVH7#,GSV70",
                "*12-1.25PX29.5-23"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "04948",
            "pt": "BRAKE VIBRATION DAMPER",
            "part_number": "04948-33060",
            "part_description": "FITTING KIT, DISC BRAKE, REAR",
            "system_group": null,
            "display_term": "DISC BRAKE FITTING KIT, REAR",
            "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96332",
            "suggested_price": 30.43,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47715D",
            "pt": "BRAKE CALIPER SLIDE PIN",
            "part_number": "47715-33340",
            "part_description": "PIN, FRONT DISC BRAKE CYLINDER SLIDE, NO.2",
            "system_group": null,
            "display_term": null,
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96329",
            "suggested_price": 13.29,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "02",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47750",
            "pt": "BRAKE CALIPER",
            "part_number": "47750-06321",
            "part_description": "CYLINDER ASSY, DISC BRAKE, LH",
            "system_group": null,
            "display_term": "BRAKE CALIPER, LEFT FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96330",
            "suggested_price": 186.94,
            "fluid": [],
            "labor": [
                {
                    "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 2.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.4,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                    "Skill": "B",
                    "Labor (Hours)": 0.1,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "04946",
            "pt": "BRAKE VIBRATION DAMPER",
            "part_number": "04946-02120",
            "part_description": "SHIM KIT, ANTI SQUEAL(FOR REAR DISC BRAKE)",
            "system_group": null,
            "display_term": "DISC BRAKE SHIM KIT, REAR",
            "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96332",
            "suggested_price": 46.89,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "04947",
            "pt": "BRAKE VIBRATION DAMPER",
            "part_number": "04947-0E031",
            "part_description": "FITTING KIT, DISC BRAKE, FRONT",
            "system_group": null,
            "display_term": "DISC BRAKE FITTING KIT, FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96330",
            "suggested_price": 30.09,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47715D",
            "pt": "BRAKE CALIPER SLIDE PIN",
            "part_number": "47715-33340",
            "part_description": "PIN, FRONT DISC BRAKE CYLINDER SLIDE, NO.2",
            "system_group": null,
            "display_term": null,
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96330",
            "suggested_price": 13.29,
            "fluid": [],
            "labor": [],
            "stats": null,
            "qty": "02",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        },
        {
            "part_key": "47730",
            "pt": "BRAKE CALIPER",
            "part_number": "47730-06321",
            "part_description": "CYLINDER ASSY, FRONT DISC BRAKE, RH",
            "system_group": null,
            "display_term": "BRAKE CALIPER, RIGHT FRONT",
            "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
            "category": "RELATED",
            "system": "BRAKE SYSTEM",
            "image_id": "96329",
            "suggested_price": 186.94,
            "fluid": [],
            "labor": [
                {
                    "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 0.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                    "Skill": "B",
                    "Labor (Hours)": 2.6,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.4,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                    "Skill": "B",
                    "Labor (Hours)": 1.8,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                    "Skill": "B",
                    "Labor (Hours)": 1.0,
                    "Warranty": "",
                    "LaborTypeName": "OPERATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                    "Skill": "B",
                    "Labor (Hours)": 0.3,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                    "Skill": "B",
                    "Labor (Hours)": 0.2,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                    "Skill": "B",
                    "Labor (Hours)": 0.1,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                    "Skill": "B",
                    "Labor (Hours)": 0.4,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 1.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                    "Skill": "B",
                    "Labor (Hours)": 0.5,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                },
                {
                    "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                    "Skill": "B",
                    "Labor (Hours)": 0.8,
                    "Warranty": "",
                    "LaborTypeName": "COMBINATION",
                    "LaborComponent": "BRAKE CALIPER"
                }
            ],
            "stats": null,
            "qty": "01",
            "usage": [
                "AXVA7#,AXVH7#,GSV70"
            ],
            "supersession": null,
            "local_reman_parts": null
        }
    ],
    "maintenance": [],
    "repair_parts": [],
    "dtc_parts": [],
    "pt": "DISC BRAKE PAD",
    "labor_hours": null,
    "input": {
        "vin": "4T1KZ1AK3PU084821",
        "text": "brake pads",
        "part_number": true,
        "price": true,
        "labor": true,
        "failsafe": false,
        "make": "TOYOTA",
        "catalog_code": "2834A0"
    }
}
```


## /api/labors

#### **Request**
```json
{
    "vin": "4T1KZ1AK3PU084821",
    "text": "brake pads",
    "part_number":true,
    "price":true,
    "labor": true,
    "failsafe": false
}
```

#### **Response**
```json
{
    "parts": {
        "labor_list": [
            {
                "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - All",
                "Skill": "B",
                "Labor (Hours)": 1.8,
                "Warranty": "",
                "LaborTypeName": "OPERATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - Front or Rear, Both Sides",
                "Skill": "B",
                "Labor (Hours)": 1.0,
                "Warranty": "",
                "LaborTypeName": "OPERATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                "Skill": "B",
                "Labor (Hours)": 0.5,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                "Skill": "B",
                "Labor (Hours)": 0.2,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                "Skill": "B",
                "Labor (Hours)": 0.2,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                "Skill": "B",
                "Labor (Hours)": 0.2,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - OVERHAUL CALIPER - Gas One - Includes: Bleed Brakes.",
                "Skill": "B",
                "Labor (Hours)": 0.5,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas - Each Additional",
                "Skill": "B",
                "Labor (Hours)": 0.2,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas One - Includes: Bleed Brakes.",
                "Skill": "B",
                "Labor (Hours)": 0.3,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - REPLACE CALIPER - Gas One - Includes: Bleed Brakes.",
                "Skill": "B",
                "Labor (Hours)": 0.3,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                "Skill": "B",
                "Labor (Hours)": 0.4,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                "Skill": "B",
                "Labor (Hours)": 1.5,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            },
            {
                "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                "Skill": "B",
                "Labor (Hours)": 0.5,
                "Warranty": "",
                "LaborTypeName": "COMBINATION",
                "LaborComponent": "DISC BRAKE PAD"
            }
        ],
        "part_list": [
            {
                "part_key": "04466",
                "pt": "DISC BRAKE PAD",
                "part_number": "04466-0E070",
                "part_description": "PAD KIT, DISC BRAKE, REAR",
                "system_group": null,
                "display_term": "DISC BRAKE PAD KIT, REAR",
                "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
                "category": "MAIN",
                "system": "BRAKE SYSTEM",
                "image_id": "96332",
                "suggested_price": 72.0,
                "fluid": [],
                "labor": [
                    {
                        "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - All",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - Front or Rear, Both Sides",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - OVERHAUL CALIPER - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas - Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE CALIPER - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE",
                    "MARK AK NS554"
                ],
                "supersession": null,
                "local_reman_parts": [
                    "04466-AZ214"
                ]
            },
            {
                "part_key": "04465",
                "pt": "DISC BRAKE PAD",
                "part_number": "04465-06170",
                "part_description": "PAD KIT, DISC BRAKE, FRONT",
                "system_group": null,
                "display_term": "DISC BRAKE PAD KIT, FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
                "category": "MAIN",
                "system": "BRAKE SYSTEM",
                "image_id": "96330",
                "suggested_price": 122.92,
                "fluid": [],
                "labor": [
                    {
                        "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - All",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - Front or Rear, Both Sides",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - OVERHAUL CALIPER - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas - Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE CALIPER - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVH7#,GSV70;AXVA70..LE,XLE",
                    "MARK NBK D6504H"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "04465",
                "pt": "DISC BRAKE PAD",
                "part_number": "04465-06170",
                "part_description": "PAD KIT, DISC BRAKE, FRONT",
                "system_group": null,
                "display_term": "DISC BRAKE PAD KIT, FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
                "category": "MAIN",
                "system": "BRAKE SYSTEM",
                "image_id": "96329",
                "suggested_price": 122.92,
                "fluid": [],
                "labor": [
                    {
                        "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - All",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SHOES &/OR PADS - Gas - Front or Rear, Both Sides",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - OVERHAUL CALIPER - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas - Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE CALIPER - Gas One - Includes: Bleed Brakes.",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "DISC BRAKE PAD"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVH7#,GSV70;AXVA70..LE,XLE",
                    "MARK NBK D6504H"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47710A",
                "pt": "BRAKE CALIPER MOUNTING BOLT",
                "part_number": "90080-10067",
                "part_description": "BOLT, HEXAGON(FOR FRONT DISC BRAKE CALIPER)",
                "system_group": null,
                "display_term": null,
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96329",
                "suggested_price": 4.64,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "04",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70",
                    "*12-1.25PX29.5-23"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47750",
                "pt": "BRAKE CALIPER",
                "part_number": "47750-06321",
                "part_description": "CYLINDER ASSY, DISC BRAKE, LH",
                "system_group": null,
                "display_term": "BRAKE CALIPER, LEFT FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96329",
                "suggested_price": 186.94,
                "fluid": [],
                "labor": [
                    {
                        "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 2.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.4,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                        "Skill": "B",
                        "Labor (Hours)": 0.1,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47730",
                "pt": "BRAKE CALIPER",
                "part_number": "47730-06321",
                "part_description": "CYLINDER ASSY, FRONT DISC BRAKE, RH",
                "system_group": null,
                "display_term": "BRAKE CALIPER, RIGHT FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96330",
                "suggested_price": 186.94,
                "fluid": [],
                "labor": [
                    {
                        "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 2.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.4,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                        "Skill": "B",
                        "Labor (Hours)": 0.1,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47715A",
                "pt": "BRAKE CALIPER SLIDE PIN",
                "part_number": "47715-04080",
                "part_description": "PIN, FRONT DISC BRAKE CYLINDER SLIDE",
                "system_group": null,
                "display_term": "BRAKE CALIPER SLIDE PIN, FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96330",
                "suggested_price": 16.78,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "02",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "04945",
                "pt": "BRAKE VIBRATION DAMPER",
                "part_number": "04945-0E071",
                "part_description": "SHIM KIT, ANTI SQUEAL, FRONT",
                "system_group": null,
                "display_term": "DISC BRAKE SHIM KIT, FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96330",
                "suggested_price": 47.06,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "43512",
                "pt": "BRAKE ROTOR",
                "part_number": "43512-06200",
                "part_description": "DISC, FRONT",
                "system_group": null,
                "display_term": "BRAKE ROTOR, FRONT",
                "part_location": "43-03 - FRONT AXLE HUB (1706- )",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96314",
                "suggested_price": 103.61,
                "fluid": [],
                "labor": [
                    {
                        "Note": "REFINISH BRAKE DRUM OR ROTOR (REMOVED) - Rotor, Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REFINISH BRAKE DRUM OR ROTOR (REMOVED) - Rotor, One",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REFINISH DISC ROTOR (ON VEHICLE) - Gas - Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REFINISH DISC ROTOR (ON VEHICLE) - Gas - One",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Front, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Front, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - REFINISH DISC ROTOR (REMOVED) - Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - REFINISH DISC ROTOR (REMOVED) - One",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    }
                ],
                "stats": {
                    "total_count": 1891,
                    "cooccurrence_count": 1156,
                    "cooccurrence_percent": 61.13
                },
                "qty": "02",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47850",
                "pt": "BRAKE CALIPER",
                "part_number": "47850-06160",
                "part_description": "CYLINDER ASSY, DISC BRAKE, REAR LH",
                "system_group": null,
                "display_term": "BRAKE CALIPER, LEFT REAR",
                "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96332",
                "suggested_price": 165.49,
                "fluid": [],
                "labor": [
                    {
                        "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 2.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.4,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                        "Skill": "B",
                        "Labor (Hours)": 0.1,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47815",
                "pt": "BRAKE CALIPER SLIDE PIN",
                "part_number": "47815-0R050",
                "part_description": "PIN, REAR  CYLINDER SLIDE, NO.2(FOR REAR DISC BRAKE)",
                "system_group": null,
                "display_term": null,
                "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96332",
                "suggested_price": 33.58,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "02",
                "usage": [
                    "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "04945",
                "pt": "BRAKE VIBRATION DAMPER",
                "part_number": "04945-0E071",
                "part_description": "SHIM KIT, ANTI SQUEAL, FRONT",
                "system_group": null,
                "display_term": "DISC BRAKE SHIM KIT, FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96329",
                "suggested_price": 47.06,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47715A",
                "pt": "BRAKE CALIPER SLIDE PIN",
                "part_number": "47715-04080",
                "part_description": "PIN, FRONT DISC BRAKE CYLINDER SLIDE",
                "system_group": null,
                "display_term": "BRAKE CALIPER SLIDE PIN, FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96329",
                "suggested_price": 16.78,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "02",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47830",
                "pt": "BRAKE CALIPER",
                "part_number": "47830-06170",
                "part_description": "CYLINDER ASSY, DISC BRAKE, REAR RH",
                "system_group": null,
                "display_term": "BRAKE CALIPER, RIGHT REAR",
                "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96332",
                "suggested_price": 181.29,
                "fluid": [],
                "labor": [
                    {
                        "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 2.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.4,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                        "Skill": "B",
                        "Labor (Hours)": 0.1,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "04947",
                "pt": "BRAKE VIBRATION DAMPER",
                "part_number": "04947-0E031",
                "part_description": "FITTING KIT, DISC BRAKE, FRONT",
                "system_group": null,
                "display_term": "DISC BRAKE FITTING KIT, FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96329",
                "suggested_price": 30.09,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "42431",
                "pt": "BRAKE ROTOR",
                "part_number": "42431-06180",
                "part_description": "DISC, REAR",
                "system_group": null,
                "display_term": "BRAKE ROTOR, REAR",
                "part_location": "41-02 - REAR AXLE SHAFT & HUB (1706- )AXVA70,AXVH7#,GSV70",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96301",
                "suggested_price": 98.45,
                "fluid": [],
                "labor": [
                    {
                        "Note": "REFINISH BRAKE DRUM OR ROTOR (REMOVED) - Rotor, Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REFINISH BRAKE DRUM OR ROTOR (REMOVED) - Rotor, One",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REFINISH DISC ROTOR (ON VEHICLE) - Gas - Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REFINISH DISC ROTOR (ON VEHICLE) - Gas - One",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Front, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Front, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "REMOVE & REPLACE DISC ROTOR - Gas - Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - REFINISH DISC ROTOR (REMOVED) - Each Additional",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    },
                    {
                        "Note": "COMBINATION - REFINISH DISC ROTOR (REMOVED) - One",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE ROTOR"
                    }
                ],
                "stats": {
                    "total_count": 1891,
                    "cooccurrence_count": 1156,
                    "cooccurrence_percent": 61.13
                },
                "qty": "02",
                "usage": [
                    "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47814",
                "pt": "BRAKE CALIPER SLIDE PIN",
                "part_number": "47814-0R050",
                "part_description": "PIN, CYLINDER SLIDE, NO.1(FOR REAR DISC BRAKE)",
                "system_group": null,
                "display_term": null,
                "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96332",
                "suggested_price": 33.58,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "02",
                "usage": [
                    "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47710A",
                "pt": "BRAKE CALIPER MOUNTING BOLT",
                "part_number": "90080-10067",
                "part_description": "BOLT, HEXAGON(FOR FRONT DISC BRAKE CALIPER)",
                "system_group": null,
                "display_term": null,
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96330",
                "suggested_price": 4.64,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "04",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70",
                    "*12-1.25PX29.5-23"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "04948",
                "pt": "BRAKE VIBRATION DAMPER",
                "part_number": "04948-33060",
                "part_description": "FITTING KIT, DISC BRAKE, REAR",
                "system_group": null,
                "display_term": "DISC BRAKE FITTING KIT, REAR",
                "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96332",
                "suggested_price": 30.43,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47715D",
                "pt": "BRAKE CALIPER SLIDE PIN",
                "part_number": "47715-33340",
                "part_description": "PIN, FRONT DISC BRAKE CYLINDER SLIDE, NO.2",
                "system_group": null,
                "display_term": null,
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96329",
                "suggested_price": 13.29,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "02",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47750",
                "pt": "BRAKE CALIPER",
                "part_number": "47750-06321",
                "part_description": "CYLINDER ASSY, DISC BRAKE, LH",
                "system_group": null,
                "display_term": "BRAKE CALIPER, LEFT FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96330",
                "suggested_price": 186.94,
                "fluid": [],
                "labor": [
                    {
                        "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 2.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.4,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                        "Skill": "B",
                        "Labor (Hours)": 0.1,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "04946",
                "pt": "BRAKE VIBRATION DAMPER",
                "part_number": "04946-02120",
                "part_description": "SHIM KIT, ANTI SQUEAL(FOR REAR DISC BRAKE)",
                "system_group": null,
                "display_term": "DISC BRAKE SHIM KIT, REAR",
                "part_location": "47-07 - REAR DISC BRAKE CALIPER & DUST COVER (1706- )AXVA75,AXVH7# ; (1706- )AXVA70,GSV70..XLE,XSE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96332",
                "suggested_price": 46.89,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA75,AXVH7#;AXVA70,GSV70..XLE,XSE"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "04947",
                "pt": "BRAKE VIBRATION DAMPER",
                "part_number": "04947-0E031",
                "part_description": "FITTING KIT, DISC BRAKE, FRONT",
                "system_group": null,
                "display_term": "DISC BRAKE FITTING KIT, FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96330",
                "suggested_price": 30.09,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47715D",
                "pt": "BRAKE CALIPER SLIDE PIN",
                "part_number": "47715-33340",
                "part_description": "PIN, FRONT DISC BRAKE CYLINDER SLIDE, NO.2",
                "system_group": null,
                "display_term": null,
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1909- )GSV70..XSE TRD PACKAGE",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96330",
                "suggested_price": 13.29,
                "fluid": [],
                "labor": [],
                "stats": null,
                "qty": "02",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            },
            {
                "part_key": "47730",
                "pt": "BRAKE CALIPER",
                "part_number": "47730-06321",
                "part_description": "CYLINDER ASSY, FRONT DISC BRAKE, RH",
                "system_group": null,
                "display_term": "BRAKE CALIPER, RIGHT FRONT",
                "part_location": "47-05 - FRONT DISC BRAKE CALIPER & DUST COVER (1706- )",
                "category": "RELATED",
                "system": "BRAKE SYSTEM",
                "image_id": "96329",
                "suggested_price": 186.94,
                "fluid": [],
                "labor": [
                    {
                        "Note": "INSPECT BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 0.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE BRAKE SYSTEM (COMPLETE) - Gas - All Wheels",
                        "Skill": "B",
                        "Labor (Hours)": 2.6,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.4,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE & REPLACE CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, Both",
                        "Skill": "B",
                        "Labor (Hours)": 1.8,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "REMOVE, INSTALL & OVERHAUL CALIPER - Gas - Front or Rear, One Side",
                        "Skill": "B",
                        "Labor (Hours)": 1.0,
                        "Warranty": "",
                        "LaborTypeName": "OPERATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - ADJUSTMENT PARKING BRAKE",
                        "Skill": "B",
                        "Labor (Hours)": 0.3,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM -  ABS Automated Bleed - Includes: Additional time for use of scan tool to perform this procedure.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BLEED BRAKE SYSTEM - Hydraulic Bleed",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - BURNISH BRAKE ROTORS WHILE DRIVING VEHICLE DISC ROTOR",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CLEAN AND INSPECT HUB & ROTOR DISC -  Corrosion, Each - Clean any rust or corrosion from mating surface of Hub/Axle Flange and Brake Rotor.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - CORRECT DISC ROTOR -  Lateral Runout, Each - Correct Rotor lateral runout by indexing.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - DISABLE & ENABLE ELECTRONIC PARKING BRAKE SYSTEM -  Brake Pad Replacement Mode - Includes: Disable and enable electronic brake system with use of scan tool or interactive vehicle controls.",
                        "Skill": "B",
                        "Labor (Hours)": 0.2,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE BRAKE HOSE - Each",
                        "Skill": "B",
                        "Labor (Hours)": 0.1,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE PARKING BRAKE SHOE & LINING - Each Side",
                        "Skill": "B",
                        "Labor (Hours)": 0.4,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Front, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 1.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - REPLACE WHEEL BEARING -  Rear, Hub Assembly, One Side - DOES NOT include wheel alignment.",
                        "Skill": "B",
                        "Labor (Hours)": 0.5,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    },
                    {
                        "Note": "COMBINATION - TESTING ANTI-LOCK BRAKE SYSTEM",
                        "Skill": "B",
                        "Labor (Hours)": 0.8,
                        "Warranty": "",
                        "LaborTypeName": "COMBINATION",
                        "LaborComponent": "BRAKE CALIPER"
                    }
                ],
                "stats": null,
                "qty": "01",
                "usage": [
                    "AXVA7#,AXVH7#,GSV70"
                ],
                "supersession": null,
                "local_reman_parts": null
            }
        ]
    },
    "maintenance": {
        "labor_list": [],
        "part_list": []
    },
    "repair_parts": {
        "labor_list": [],
        "part_list": []
    },
    "dtc_parts": {
        "labor_list": [],
        "part_list": []
    },
    "pt": "DISC BRAKE PAD",
    "labor_hours": null,
    "input": {
        "vin": "4T1KZ1AK3PU084821",
        "text": "brake pads",
        "part_number": true,
        "price": true,
        "labor": true,
        "failsafe": false,
        "make": "TOYOTA",
        "catalog_code": "2834A0"
    }
}
```

