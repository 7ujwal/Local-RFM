import os
import pymongo
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
db = pymongo.MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

P = "https://images.pexels.com/photos"
IMG = lambda pid, w=1200: f"{P}/{pid}/pexels-photo-{pid}.jpeg?auto=compress&cs=tinysrgb&w={w}"

DATA = {
    "Chanshal 4x4 Off-Road Expedition": {
        "itinerary": [
            "Day 1 — Meet at Rohru by noon, convoy briefing and vehicle check, drive up through Chirgaon to Larot. Riverside camp and bonfire dinner.",
            "Day 2 — Dawn run to Chanshal Pass (4,520 m), photo stops at the saddle, explore the Dodra-Kwar viewpoint, back to camp by dusk.",
            "Day 3 — Slow breakfast, visit a nearby village, convoy back to Rohru by evening.",
        ],
        "packing": ["Warm layers and a windproof jacket", "Gloves and sunglasses", "Driving licence", "Power bank and torch", "Personal medication", "Camera"],
        "gallery": [IMG(552785), IMG(417173), IMG(2398220)],
    },
    "Pabbar Valley Riverside Camping": {
        "itinerary": [
            "Day 1 — Arrive in Rohru, short drive to the riverside camp, sunset chai, trout barbecue and stargazing by the fire.",
            "Day 2 — Sunrise deodar walk, breakfast by the river, optional fishing session, lazy afternoon in hammocks.",
            "Day 3 — Slow morning, group breakfast, disperse by noon.",
        ],
        "packing": ["Light jacket for the evening", "Comfortable shoes plus sandals", "Torch and power bank", "Towel and toiletries", "Personal medication"],
        "gallery": [IMG(2398220), IMG(1761279), IMG(933054)],
    },
    "Snow Drive: Winter Chanshal": {
        "itinerary": [
            "Day 1 — Rohru briefing, snow-chain fitting practice, drive up to the heated base camp at Kharapathar.",
            "Day 2 — Full snow convoy day towards Chanshal with marshals, recovery drills, hot lunch on the ridge.",
            "Day 3 — Sunrise snow walk, group photos, return to Rohru by evening.",
        ],
        "packing": ["Heavy down jacket and thermals", "Waterproof boots", "Gloves plus a spare pair", "Balaclava and woollen cap", "Sunglasses (snow glare)", "Personal medication", "Power bank"],
        "gallery": [IMG(417173), IMG(1366919), IMG(552785)],
    },
    "Chandranahan Lake Trek": {
        "itinerary": [
            "Day 1 — Drive Rohru to Janglikh village, trek briefing, night in a village homestay.",
            "Day 2 — Trek through meadows and shepherd trails to base camp.",
            "Day 3 — Summit push to Chandranahan Lake, night beside the lake under the stars.",
            "Day 4 — Descend to Janglikh and drive back to Rohru.",
        ],
        "packing": ["Broken-in trekking shoes", "40L backpack", "Warm layers and a rain shell", "Reusable water bottle", "Sunglasses and cap", "Headlamp", "Personal medication"],
        "gallery": [IMG(1476880), IMG(933054), IMG(1366919)],
    },
    "Village Culture Immersion Weekend": {
        "itinerary": [
            "Day 1 — Arrive, meet your host family, evening walk through the village and temple courtyard.",
            "Day 2 — Orchard work in the morning, Siddu cooking on a wood fire, community dham dinner with folk songs.",
            "Day 3 — Morning chai with the elders, visit a kath-kuni temple, depart after lunch.",
        ],
        "packing": ["Comfortable walking shoes", "Modest warm clothing", "Torch", "Reusable water bottle", "Camera", "A small gift for your hosts (optional)"],
        "gallery": [f"{P}/37839627/pexels-photo-37839627.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200", f"{P}/32225789/pexels-photo-32225789.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200", IMG(2577274)],
    },
}

n = 0
for name, fields in DATA.items():
    r = db.events.update_one({"name": name}, {"$set": fields})
    n += r.matched_count
print(f"enriched {n}/{len(DATA)} events with itinerary, packing and gallery")
