import os
import uuid
import pymongo
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
db = pymongo.MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

P = "https://images.pexels.com/photos"

# rename + enrich the existing Chandranahan Lake entry (same lake as Chandar Nahan)
lake = {
    "title": "Chandar Nahan Lake",
    "tag": "Best time: Jun – Sep",
    "altitude": "≈ 3,800 m · via Janglikh",
    "difficulty": "Moderate trek",
    "description": "A breathtaking glacial lake in the Pabbar valley at roughly 3,800 m, ringed by towering snow-covered peaks. Crystal-clear, glacier-fed and still enough to hold the mountains like a mirror — among the most pristine high-altitude lakes in Himachal. Trek, camp, photograph; then leave no trace.",
}
r = db.explore.update_one({"title": {"$in": ["Chandranahan Lake", "Chandar Nahan Lake"]}}, {"$set": lake})
print("lake updated:", r.matched_count)

BACKFILL = {
    "Chanshal Pass": {"altitude": "4,520 m · 50 km from Rohru", "difficulty": "Moderate · 4x4 route"},
    "Pabbar River Valley": {"altitude": "1,550 m · riverside", "difficulty": "Easy"},
    "Kharapathar": {"altitude": "2,700 m · 35 km from Rohru", "difficulty": "Easy"},
    "Villages of Rohru": {"altitude": "1,500 – 2,400 m", "difficulty": "Easy walks"},
}
for title, fields in BACKFILL.items():
    db.explore.update_one({"title": title}, {"$set": fields})
print("backfilled:", len(BACKFILL))

NEW_PLACES = [
    {"type": "place", "title": "Kuppar Peak", "tag": "Best time: May – Oct", "altitude": "≈ 3,400 m · Rohru valley rim", "difficulty": "Challenging", "image_url": f"{P}/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "A dramatic, demanding summit rising over the Rohru valley with a 360° sweep of the greater Himalayan range from the top. The trail climbs through dense alpine forest, flower meadows and broken rock — a true trekker's and mountaineer's day out.", "sort": 6},
    {"type": "place", "title": "Dodra Kwar Village", "tag": "Best time: Apr – Nov", "altitude": "Beyond Chanshal Pass", "difficulty": "Easy · remote drive", "image_url": f"{P}/1366957/pexels-photo-1366957.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "A remote twin village tucked deep in the mountains of Shimla district — ancient wooden temples, Kinnauri-influenced architecture and a way of life the modern world forgot. Even the drive in is an adventure: narrow cliff roads, hanging valleys and some of the quietest miles in Himachal.", "sort": 7},
    {"type": "place", "title": "Rupin Pass Trek", "tag": "Best time: May – Jun & Sep – Oct", "altitude": "≈ 4,650 m", "difficulty": "Difficult", "image_url": f"{P}/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "One of India's most celebrated treks, winding out of the Rohru region through hanging villages, meadows and glacial terrain — past a waterfall that bursts from beneath a snow bridge — before crossing the pass at roughly 4,650 m. A proper expedition, not a stroll.", "sort": 8},
]
for p in NEW_PLACES:
    existing = db.explore.find_one({"title": p["title"]})
    if existing:
        db.explore.update_one({"_id": existing["_id"]}, {"$set": p})
        print("updated:", p["title"])
    else:
        db.explore.insert_one({"id": uuid.uuid4().hex, **p})
        print("inserted:", p["title"])

print("total places:", db.explore.count_documents({"type": "place"}))
