import os
import pymongo
from dotenv import load_dotenv

load_dotenv("/app/backend/.env")
db = pymongo.MongoClient(os.environ["MONGO_URL"])[os.environ["DB_NAME"]]

UPDATES = {
    "Chanshal Pass": "The road from Rohru climbs past Chirgaon and the last pine at Larot before the world opens at 4,520 m — the highest motorable saddle in Shimla district. Beyond it lies Dodra-Kwar, a valley that still measures time in harvests. Expect wind, prayer flags and a silence you can lean on.",
    "Pabbar River Valley": "Born from the Chandranahan glacier, the Pabbar runs cold and green past Rohru — rapids for the brave, still pools for brown and rainbow trout, and shingle banks made for evening fires. Follow it upstream past Hatkoti and the valley narrows into pure cedar country.",
    "Kharapathar": "An hour above Rohru at roughly 2,700 m, Kharapathar is where the valley exhales — a deodar-wrapped ridge with Giri Ganga temple close by and views that run from apple orchards to permanent snow. In January the whole ridge turns into a white, silent amphitheatre.",
    "Chandranahan Lake": "The Pabbar begins here, in a glacial amphitheatre at 4,260 m above the meadow-village of Janglikh. Two days of walking through shepherd country and alpine flowers ends at water so still it doubles the peaks. Locals hold the lake sacred — we keep it that way.",
    "Villages of Rohru": "Kath-kuni houses stacked in slate and deodar, temple courtyards where the devta's palanquin rests, orchards stepping down to the river. Villages like Janglikh, Kui and Samra don't perform for visitors — they simply let you in. Walk slow, accept the chai.",
    "Siddu": "Wheat dough risen by the hearth, stuffed with walnut, poppy or spiced dal, then steamed over a wood fire and served drowning in desi ghee. Every Rohru grandmother guards her own ratio. Eaten with hands, ideally while snow falls outside.",
    "Babru": "Think kachori, mountain-style: black-gram paste whipped light, folded into wheat dough and fried till it blisters. Babru appears at weddings, fairs and any excuse in between — always with sour tamarind chutney cut with jaggery.",
    "Madra": "Chickpeas simmered for hours in yoghurt, ghee, cloves and black cardamom until the gravy turns to silk. At a village dham, the hereditary cooks stir pots wider than your arms — this is the dish the whole valley judges them by.",
    "Chha Gosht": "Mutton marinated overnight in yoghurt and roasted gram flour, then cooked low until the meat gives up pretending to resist. Rich, smoky, unapologetic — the dish that comes out when a Pabbar-side family wants to honour you.",
    "Aktori": "A dense buckwheat-and-wheat cake studded with walnuts and dried apricot, cooked slowly on an iron griddle and eaten warm with ghee. It tastes like the end of apple season — sweet, smoky and gone too fast.",
    "Pabbar Trout": "Rainbow and brown trout from the valley's own farms and cold runs, pan-fried in local butter with mountain herbs and lemon. Twenty minutes from water to plate. Order it at a riverside dhaba and thank us later.",
    "Jagra & Village Fairs": "When the drums start at dusk and the karnal horns answer from across the valley, the devta is being invoked. Jagra runs all night — masked dancers, offerings, fire circles — and every village keeps its own date on the old lunar calendar.",
    "Folk Music of the Valley": "Long-note ballads in Pahari carried over dhol and shehnai — songs of shepherds, feuds, rivers and weddings. You won't find them on streaming. You'll find them at a wedding in Kui at midnight, sung the same way for fifty years.",
    "The Mountain Way of Life": "Days start before the sun clears the ridge: orchard work, wood smoke, wool drying on lines, the day measured by weather rather than clocks. Apples pay the bills, the devta settles the disputes, and no guest leaves unfed.",
    "Temples & Local Deities": "Carved kath-kuni temples of deodar and slate house devtas who still govern their valleys — carried in palanquins, consulted on crops and journeys, fed at every fair. Hatkoti's ancient stone temples on the Pabbar are the valley's oldest chapter.",
}

updated = 0
for title, description in UPDATES.items():
    r = db.explore.update_one({"title": title}, {"$set": {"description": description}})
    updated += r.matched_count
print(f"updated {updated}/{len(UPDATES)} explore entries")
