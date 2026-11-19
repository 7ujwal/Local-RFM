from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional
import certifi
import os
import uuid
import hmac
import hashlib
import asyncio
import logging
import requests
import razorpay
import resend
from datetime import datetime, timezone, timedelta
from pathlib import Path

ROOT_DIR = Path(__file__).parent
# Do not override platform env (Render). Empty local files cannot wipe MONGO_URL.
load_dotenv(ROOT_DIR / '.env', override=False)
load_dotenv(Path('/etc/secrets/.env'), override=False)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def _env(name, default=''):
    value = os.environ.get(name, default)
    return value.strip() if isinstance(value, str) else default


mongo_url = _env('MONGO_URL') or _env('MONGODB_URI')
db_name = _env('DB_NAME') or 'roaming_from_rohru'
if not mongo_url:
    present = [key for key in ('MONGO_URL', 'MONGODB_URI', 'DB_NAME') if _env(key)]
    raise RuntimeError(
        "MONGO_URL is not set on this process. In Render: this Web Service → Environment → "
        "add MONGO_URL (Atlas URI) and optionally DB_NAME. Do not put the password in Git. "
        f"Keys currently set: {present or 'none'}."
    )

# Use TLS only for Atlas (mongodb+srv://), not for local connections
use_tls = mongo_url.startswith("mongodb+srv://")
client_kwargs = {
    "serverSelectionTimeoutMS": 15000,
}
if use_tls:
    client_kwargs["tls"] = True
    client_kwargs["tlsCAFile"] = certifi.where()

client = AsyncIOMotorClient(mongo_url, **client_kwargs)
db = client[db_name]


def cors_allow_origins():
    raw = os.environ.get('CORS_ORIGINS', 'http://localhost:3000')
    origins = [item.strip() for item in raw.split(',') if item.strip()]
    if not origins or origins == ['*']:
        logger.warning("CORS_ORIGINS must list explicit frontend origins when cookies are used; defaulting to http://localhost:3000")
        return ['http://localhost:3000']
    return origins

ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'roamingfromrohru@gmail.com').lower()
ADMIN_PASSKEY = os.environ.get('ADMIN_PASSKEY', '')
ADMIN_PASSKEY_HASH = None
if ADMIN_PASSKEY:
    import bcrypt as _bcrypt
    ADMIN_PASSKEY_HASH = _bcrypt.hashpw(ADMIN_PASSKEY.encode(), _bcrypt.gensalt())
RAZORPAY_KEY_ID = os.environ.get('RAZORPAY_KEY_ID', '')
RAZORPAY_KEY_SECRET = os.environ.get('RAZORPAY_KEY_SECRET', '')
rzp_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)) if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET else None

RESEND_API_KEY = os.environ.get('RESEND_API_KEY', '')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'onboarding@resend.dev')
if RESEND_API_KEY:
    resend.api_key = RESEND_API_KEY

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)

app = FastAPI()
app.mongodb_client = client

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_allow_origins(),
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    if isinstance(exc, HTTPException):
        raise exc
    logger.exception("Unhandled server error on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


class ExploreIn(BaseModel):
    type: str
    title: str
    description: str = ""
    tag: str = ""
    altitude: str = ""
    difficulty: str = ""
    image_url: str = ""

class EventIn(BaseModel):
    name: str
    date: str
    location: str
    description: str = ""
    tag: str = ""
    total_spots: int = 20
    available_spots: int = 20
    price: int = 0
    image_url: str = ""
    cover_url: str = ""
    itinerary: list[str] = []
    packing: list[str] = []
    gallery: list[str] = []

class BookingIn(BaseModel):
    event_id: str
    name: str
    phone: str
    pax: int = 1

class PaymentVerifyIn(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str

class MessageIn(BaseModel):
    name: str
    email: str
    phone: str = ""
    message: str

class ContactSettingsIn(BaseModel):
    phone: str = ""
    whatsapp: str = ""
    email: str = ""
    instagram: str = ""
    youtube: str = ""
    facebook: str = ""
    address: str = ""

class SessionExchangeIn(BaseModel):
    session_id: str


# ---------- auth helpers ----------

def required_levels():
    levels = ["google"]
    if ADMIN_PASSKEY_HASH:
        levels.append("passkey")
    if RESEND_API_KEY:
        levels.append("otp")
    return levels


def security_status(session):
    return {"required": required_levels(), "cleared": session.get("cleared") or ["google"]}


async def get_session(request: Request):
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    return session, token


async def get_session_user(request: Request):
    session, _ = await get_session(request)
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def require_admin(request: Request):
    session, _ = await get_session(request)
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if user["email"].lower() != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access restricted to the site owner")
    sec = security_status(session)
    if not set(sec["required"]) <= set(sec["cleared"]):
        raise HTTPException(status_code=403, detail="Additional verification required")
    return user


# ---------- email alerts ----------

async def send_booking_alert(booking: dict, subject_prefix: str):
    if not RESEND_API_KEY:
        logger.info(f"RESEND_API_KEY not set — skipping booking alert email ({subject_prefix})")
        return
    row = lambda k, v: f'<tr><td style="padding:6px 12px;color:#888;font-size:13px">{k}</td><td style="padding:6px 12px;font-size:13px"><b>{v}</b></td></tr>'
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;border:1px solid #ddd">
      <div style="background:#0D0E0C;padding:16px 20px">
        <span style="color:#F05A28;font-size:18px;font-weight:bold">ROAMING FROM ROHRU</span>
        <span style="color:#D6A84F;font-size:12px;float:right">{subject_prefix}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;padding:12px">
        {row("Event", booking["event_name"])}
        {row("Name", booking["name"])}
        {row("Phone", booking["phone"])}
        {row("People", booking["pax"])}
        {row("Amount", "₹" + format(booking["amount"], ","))}
        {row("Status", booking["payment_status"])}
        {row("Booking ref", booking["id"][:8].upper())}
      </table>
      <p style="padding:0 20px 16px;color:#888;font-size:12px">View all bookings in the admin panel.</p>
    </div>"""
    params = {
        "from": SENDER_EMAIL,
        "to": [ADMIN_EMAIL],
        "subject": f"{subject_prefix}: {booking['event_name']} — {booking['name']} x{booking['pax']}",
        "html": html,
    }
    try:
        await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Booking alert email sent ({subject_prefix}, ref {booking['id'][:8]})")
    except Exception as e:
        logger.error(f"Booking alert email failed: {e}")


# ---------- public ----------

@app.api_route("/", methods=["GET", "HEAD"])
async def health():
    return {"status": "ok", "api": "/api/", "ping_db": "/api/ping-db"}


@api_router.get("/")
async def root():
    return {"message": "Roaming From Rohru API. Try GET /api/ping-db"}


@api_router.get("/ping-db")
async def ping_db():
    try:
        await app.mongodb_client.admin.command("ping")
        return {"ok": True, "message": "MongoDB is reachable"}
    except Exception as e:
        logger.exception("MongoDB ping failed")
        return JSONResponse(status_code=500, content={"ok": False, "error": str(e)})


@app.get("/ping-db")
async def ping_db_root():
    return await ping_db()


@api_router.get("/explore")
async def list_explore(type: Optional[str] = None):
    q = {"type": type} if type else {}
    return await db.explore.find(q, {"_id": 0}).sort("sort", 1).to_list(200)


@api_router.get("/events")
async def list_events():
    return await db.events.find({}, {"_id": 0}).sort("sort", 1).to_list(200)


@api_router.get("/events/{event_id}")
async def get_event(event_id: str):
    ev = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    return ev


class WaitlistIn(BaseModel):
    event_id: str
    name: str
    phone: str

@api_router.post("/waitlist")
async def join_waitlist(data: WaitlistIn):
    if len(data.name.strip()) < 2 or len(data.phone.strip()) < 8:
        raise HTTPException(status_code=400, detail="Please provide a valid name and phone number")
    ev = await db.events.find_one({"id": data.event_id}, {"_id": 0})
    if not ev:
        raise HTTPException(status_code=404, detail="Event not found")
    doc = {
        "id": uuid.uuid4().hex,
        "event_id": ev["id"],
        "event_name": ev["name"],
        "name": data.name.strip(),
        "phone": data.phone.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.waitlist.insert_one(doc)
    doc.pop("_id", None)
    return {"status": "waitlisted", "id": doc["id"]}


@api_router.get("/admin/waitlist")
async def admin_waitlist(request: Request):
    await require_admin(request)
    return await db.waitlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/settings/contact")
async def get_contact_settings():
    doc = await db.settings.find_one({"key": "contact"}, {"_id": 0})
    return doc or {"key": "contact", "phone": "", "email": "", "instagram": "", "address": ""}


@api_router.post("/messages")
async def create_message(data: MessageIn):
    doc = {"id": uuid.uuid4().hex, **data.model_dump(),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.messages.insert_one(doc)
    doc.pop("_id", None)
    return {"status": "received", "id": doc["id"]}


@api_router.post("/bookings")
async def create_booking(data: BookingIn):
    if data.pax < 1 or data.pax > 20:
        raise HTTPException(status_code=400, detail="Number of people must be between 1 and 20")
    if len(data.name.strip()) < 2 or len(data.phone.strip()) < 8:
        raise HTTPException(status_code=400, detail="Please provide a valid name and phone number")
    event = await db.events.find_one({"id": data.event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    if event.get("available_spots", 0) < data.pax:
        raise HTTPException(status_code=400, detail="Not enough spots available")
    amount = int(event["price"]) * data.pax
    booking = {
        "id": uuid.uuid4().hex,
        "event_id": event["id"],
        "event_name": event["name"],
        "name": data.name.strip(),
        "phone": data.phone.strip(),
        "pax": data.pax,
        "amount": amount,
        "payment_status": "pending",
        "razorpay_order_id": None,
        "razorpay_payment_id": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.bookings.insert_one(booking)
    if rzp_client:
        order = await asyncio.to_thread(rzp_client.order.create, {
            "amount": amount * 100,
            "currency": "INR",
            "payment_capture": 1,
            "receipt": booking["id"][:40],
        })
        await db.bookings.update_one({"id": booking["id"]}, {"$set": {"razorpay_order_id": order["id"]}})
        asyncio.create_task(send_booking_alert(booking, "New booking (payment pending)"))
        return {
            "booking_id": booking["id"], "order_id": order["id"], "amount": amount * 100,
            "key_id": RAZORPAY_KEY_ID, "demo_mode": False,
            "event_name": event["name"], "amount_inr": amount,
        }
    await db.bookings.update_one({"id": booking["id"]}, {"$set": {"payment_status": "demo_confirmed"}})
    await db.events.update_one(
        {"id": event["id"], "available_spots": {"$gte": data.pax}},
        {"$inc": {"available_spots": -data.pax}},
    )
    booking["payment_status"] = "demo_confirmed"
    asyncio.create_task(send_booking_alert(booking, "New booking (demo mode)"))
    return {
        "booking_id": booking["id"], "order_id": None, "amount": amount * 100,
        "key_id": None, "demo_mode": True,
        "event_name": event["name"], "amount_inr": amount,
    }


@api_router.post("/payments/verify")
async def verify_payment(data: PaymentVerifyIn):
    if not rzp_client:
        raise HTTPException(status_code=400, detail="Payments are not configured")
    booking = await db.bookings.find_one({"id": data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking["payment_status"] == "paid":
        return {"status": "success", "booking_id": booking["id"]}
    body = f"{data.razorpay_order_id}|{data.razorpay_payment_id}"
    expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, data.razorpay_signature):
        await db.bookings.update_one({"id": booking["id"]}, {"$set": {"payment_status": "failed"}})
        raise HTTPException(status_code=400, detail="Payment verification failed")
    await db.bookings.update_one(
        {"id": booking["id"]},
        {"$set": {"payment_status": "paid", "razorpay_payment_id": data.razorpay_payment_id}},
    )
    await db.events.update_one(
        {"id": booking["event_id"], "available_spots": {"$gte": booking["pax"]}},
        {"$inc": {"available_spots": -booking["pax"]}},
    )
    booking["payment_status"] = "paid"
    asyncio.create_task(send_booking_alert(booking, "Payment received"))
    return {"status": "success", "booking_id": booking["id"]}


# ---------- auth ----------

@api_router.post("/auth/session")
async def auth_session(data: SessionExchangeIn, response: Response):
    def fetch_session():
        return requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": data.session_id},
            timeout=10,
        )
    resp = await asyncio.to_thread(fetch_session)
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session id")
    payload = resp.json()
    email = payload.get("email", "").lower()
    if email != ADMIN_EMAIL:
        raise HTTPException(status_code=403, detail="Admin access is restricted to the site owner")
    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": payload.get("name", ""),
            "picture": payload.get("picture", ""),
            "created_at": datetime.now(timezone.utc),
        })
    session_token = payload["session_token"]
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
        "cleared": ["google"],
    })
    response.set_cookie(
        "session_token", session_token,
        httponly=True, secure=True, samesite="none", path="/",
        max_age=7 * 24 * 3600,
    )
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if isinstance(user.get("created_at"), datetime):
        user["created_at"] = user["created_at"].isoformat()
    return {"user": user, "security": {"required": required_levels(), "cleared": ["google"]}}


@api_router.get("/auth/me")
async def auth_me(request: Request):
    session, _ = await get_session(request)
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    if isinstance(user.get("created_at"), datetime):
        user["created_at"] = user["created_at"].isoformat()
    return {"user": user, "security": security_status(session)}


@api_router.post("/auth/logout")
async def auth_logout(request: Request, response: Response):
    token = request.cookies.get("session_token")
    if token:
        await db.user_sessions.delete_many({"session_token": token})
    response.delete_cookie("session_token", path="/", secure=True, samesite="none")
    return {"status": "logged_out"}


class PasskeyIn(BaseModel):
    passkey: str

class OtpIn(BaseModel):
    code: str


async def send_otp_email(code: str):
    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;border:1px solid #ddd">
      <div style="background:#0D0E0C;padding:16px 20px">
        <span style="color:#F05A28;font-size:18px;font-weight:bold">ROAMING FROM ROHRU</span>
        <span style="color:#D6A84F;font-size:12px;float:right">ADMIN ACCESS</span>
      </div>
      <div style="padding:28px 20px;text-align:center">
        <p style="color:#555;font-size:13px;margin:0 0 14px">Your one-time admin login code (valid 5 minutes):</p>
        <p style="font-size:38px;letter-spacing:10px;font-weight:bold;color:#0D0E0C;margin:0">{code}</p>
        <p style="color:#999;font-size:12px;margin:18px 0 0">If you did not try to sign in, change your Google password immediately.</p>
      </div>
    </div>"""
    await asyncio.to_thread(resend.Emails.send, {
        "from": SENDER_EMAIL,
        "to": [ADMIN_EMAIL],
        "subject": f"Admin login code: {code}",
        "html": html,
    })


@api_router.post("/auth/passkey")
async def auth_passkey(data: PasskeyIn, request: Request):
    session, token = await get_session(request)
    if not ADMIN_PASSKEY_HASH:
        return {"status": "not_required"}
    if session.get("passkey_attempts", 0) >= 5:
        await db.user_sessions.delete_many({"session_token": token})
        raise HTTPException(status_code=429, detail="Too many attempts — session ended, sign in again")
    import bcrypt
    if not bcrypt.checkpw(data.passkey.encode(), ADMIN_PASSKEY_HASH):
        await db.user_sessions.update_one({"session_token": token}, {"$inc": {"passkey_attempts": 1}})
        raise HTTPException(status_code=401, detail="Incorrect passkey")
    await db.user_sessions.update_one(
        {"session_token": token},
        {"$addToSet": {"cleared": {"$each": ["google", "passkey"]}}, "$unset": {"passkey_attempts": ""}},
    )
    return {"status": "ok"}


@api_router.post("/auth/otp/request")
async def auth_otp_request(request: Request):
    session, token = await get_session(request)
    if not RESEND_API_KEY:
        return {"status": "not_required"}
    recent = await db.otp_codes.find_one({"session_token": token})
    if recent:
        created = datetime.fromisoformat(recent["created_at"])
        if created.tzinfo is None:
            created = created.replace(tzinfo=timezone.utc)
        if (datetime.now(timezone.utc) - created).total_seconds() < 60:
            raise HTTPException(status_code=429, detail="Code already sent — wait a minute before requesting another")
    import secrets
    code = f"{secrets.randbelow(1000000):06d}"
    await db.otp_codes.delete_many({"session_token": token})
    await db.otp_codes.insert_one({
        "session_token": token,
        "code_hash": hashlib.sha256(code.encode()).hexdigest(),
        "attempts": 0,
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=5)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    try:
        await send_otp_email(code)
    except Exception as e:
        logger.error(f"OTP email failed: {e}")
        raise HTTPException(status_code=500, detail="Could not send the code email — check the Resend key")
    return {"status": "sent"}


@api_router.post("/auth/otp/verify")
async def auth_otp_verify(data: OtpIn, request: Request):
    session, token = await get_session(request)
    rec = await db.otp_codes.find_one({"session_token": token})
    if not rec:
        raise HTTPException(status_code=400, detail="No code requested — request a new one")
    expires = datetime.fromisoformat(rec["expires_at"])
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if expires < datetime.now(timezone.utc):
        await db.otp_codes.delete_many({"session_token": token})
        raise HTTPException(status_code=400, detail="Code expired — request a new one")
    if rec.get("attempts", 0) >= 5:
        await db.otp_codes.delete_many({"session_token": token})
        raise HTTPException(status_code=429, detail="Too many wrong codes — request a new one")
    if hashlib.sha256(data.code.strip().encode()).hexdigest() != rec["code_hash"]:
        await db.otp_codes.update_one({"session_token": token}, {"$inc": {"attempts": 1}})
        raise HTTPException(status_code=401, detail="Incorrect code")
    await db.otp_codes.delete_many({"session_token": token})
    await db.user_sessions.update_one({"session_token": token}, {"$addToSet": {"cleared": {"$each": ["google", "otp"]}}})
    return {"status": "ok"}


# ---------- admin ----------

@api_router.post("/admin/explore")
async def admin_create_explore(data: ExploreIn, request: Request):
    await require_admin(request)
    if data.type not in ("place", "food", "culture"):
        raise HTTPException(status_code=400, detail="Invalid type")
    doc = {"id": uuid.uuid4().hex, **data.model_dump(), "sort": int(datetime.now(timezone.utc).timestamp())}
    await db.explore.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/explore/{item_id}")
async def admin_update_explore(item_id: str, data: ExploreIn, request: Request):
    await require_admin(request)
    res = await db.explore.update_one({"id": item_id}, {"$set": data.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return await db.explore.find_one({"id": item_id}, {"_id": 0})


@api_router.delete("/admin/explore/{item_id}")
async def admin_delete_explore(item_id: str, request: Request):
    await require_admin(request)
    await db.explore.delete_one({"id": item_id})
    return {"status": "deleted"}


@api_router.post("/admin/events")
async def admin_create_event(data: EventIn, request: Request):
    await require_admin(request)
    doc = {"id": uuid.uuid4().hex, **data.model_dump(), "sort": int(datetime.now(timezone.utc).timestamp())}
    await db.events.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/events/{event_id}")
async def admin_update_event(event_id: str, data: EventIn, request: Request):
    await require_admin(request)
    res = await db.events.update_one({"id": event_id}, {"$set": data.model_dump()})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Event not found")
    return await db.events.find_one({"id": event_id}, {"_id": 0})


@api_router.delete("/admin/events/{event_id}")
async def admin_delete_event(event_id: str, request: Request):
    await require_admin(request)
    await db.events.delete_one({"id": event_id})
    return {"status": "deleted"}


@api_router.get("/admin/bookings")
async def admin_bookings(request: Request):
    await require_admin(request)
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.delete("/admin/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str, request: Request):
    await require_admin(request)
    await db.bookings.delete_one({"id": booking_id})
    return {"status": "deleted"}


@api_router.delete("/admin/bookings")
async def admin_bulk_delete_bookings(request: Request):
    await require_admin(request)
    body = await request.json()
    ids = body.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No booking IDs provided")
    result = await db.bookings.delete_many({"id": {"$in": ids}})
    return {"status": "deleted", "count": result.deleted_count}


@api_router.get("/admin/bookings.csv")
async def admin_bookings_csv(request: Request):
    await require_admin(request)
    import csv
    import io
    rows = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["booking_ref", "event", "name", "phone", "people", "amount_inr", "payment_status", "created_at"])
    for b in rows:
        w.writerow([
            b["id"][:8].upper(), b["event_name"], b["name"], b["phone"],
            b["pax"], b["amount"], b["payment_status"], b["created_at"],
        ])
    return Response(
        buf.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=rohru-bookings.csv"},
    )


@api_router.get("/admin/messages")
async def admin_messages(request: Request):
    await require_admin(request)
    return await db.messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.delete("/admin/messages/{message_id}")
async def admin_delete_message(message_id: str, request: Request):
    await require_admin(request)
    await db.messages.delete_one({"id": message_id})
    return {"status": "deleted"}


@api_router.delete("/admin/messages")
async def admin_bulk_delete_messages(request: Request):
    await require_admin(request)
    body = await request.json()
    ids = body.get("ids", [])
    if not ids:
        raise HTTPException(status_code=400, detail="No message IDs provided")
    result = await db.messages.delete_many({"id": {"$in": ids}})
    return {"status": "deleted", "count": result.deleted_count}


@api_router.put("/admin/settings/contact")
async def admin_update_contact(data: ContactSettingsIn, request: Request):
    await require_admin(request)
    doc = {"key": "contact", **data.model_dump()}
    await db.settings.update_one({"key": "contact"}, {"$set": doc}, upsert=True)
    return doc


@api_router.post("/admin/upload")
async def admin_upload(request: Request, file: UploadFile = File(...)):
    await require_admin(request)
    ct = file.content_type or ""
    is_image = ct.startswith("image/")
    is_video = ct.startswith("video/")
    if not (is_image or is_video):
        raise HTTPException(status_code=400, detail="Only image or video files are allowed")
    data = await file.read()
    limit = 200 * 1024 * 1024 if is_video else 8 * 1024 * 1024
    if len(data) > limit:
        raise HTTPException(status_code=400, detail="Video too large (max 200 MB)" if is_video else "File too large (max 8 MB)")
    ext = Path(file.filename or "").suffix.lower()
    if is_video:
        if ext not in (".mp4", ".webm", ".mov"):
            ext = ".mp4"
    elif ext not in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        ext = ".jpg"
    fname = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / fname).write_bytes(data)
    return {"url": f"/api/uploads/{fname}"}


class SiteSettingsIn(BaseModel):
    hero_video: str = ""
    season: str = "summer"

@api_router.get("/settings/site")
async def get_site_settings():
    doc = await db.settings.find_one({"key": "site"}, {"_id": 0})
    return doc or {"key": "site", "hero_video": "", "season": "summer"}

@api_router.put("/settings/site")
async def update_site_settings(data: SiteSettingsIn):
    season = data.season if data.season in ("summer", "winter") else "summer"
    doc = {"key": "site", "hero_video": data.hero_video, "season": season}
    await db.settings.update_one({"key": "site"}, {"$set": doc}, upsert=True)
    return doc

@api_router.put("/admin/settings/site")
async def admin_update_site(data: SiteSettingsIn, request: Request):
    await require_admin(request)
    season = data.season if data.season in ("summer", "winter") else "summer"
    doc = {"key": "site", "hero_video": data.hero_video, "season": season}
    await db.settings.update_one({"key": "site"}, {"$set": doc}, upsert=True)
    return doc


class ContentIn(BaseModel):
    data: dict = {}

@api_router.get("/settings/content")
async def get_content_settings():
    doc = await db.settings.find_one({"key": "content"}, {"_id": 0})
    return doc or {"key": "content", "data": {}}

@api_router.put("/admin/settings/content")
async def admin_update_content(data: ContentIn, request: Request):
    await require_admin(request)
    if len(str(data.data)) > 200000:
        raise HTTPException(status_code=400, detail="Content too large")
    await db.settings.update_one({"key": "content"}, {"$set": {"key": "content", "data": data.data}}, upsert=True)
    return {"status": "saved"}


# ---------- seed ----------

P = "https://images.pexels.com/photos"

SEED_EXPLORE = [
    {"type": "place", "title": "Chanshal Pass", "tag": "Best time: May – Oct", "altitude": "4,520 m · 50 km from Rohru", "difficulty": "Moderate · 4x4 route", "image_url": f"{P}/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "The road from Rohru climbs past Chirgaon and the last pine at Larot before the world opens at 4,520 m — the highest motorable saddle in Shimla district. Beyond it lies Dodra-Kwar, a valley that still measures time in harvests. Expect wind, prayer flags and a silence you can lean on.", "sort": 1},
    {"type": "place", "title": "Pabbar River Valley", "tag": "Best time: Mar – Jun", "altitude": "1,550 m · riverside", "difficulty": "Easy", "image_url": f"{P}/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "Born from the Chandranahan glacier, the Pabbar runs cold and green past Rohru — rapids for the brave, still pools for brown and rainbow trout, and shingle banks made for evening fires. Follow it upstream past Hatkoti and the valley narrows into pure cedar country.", "sort": 2},
    {"type": "place", "title": "Kharapathar", "tag": "Best time: Apr – Nov", "altitude": "2,700 m · 35 km from Rohru", "difficulty": "Easy", "image_url": f"{P}/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "An hour above Rohru at roughly 2,700 m, Kharapathar is where the valley exhales — a deodar-wrapped ridge with Giri Ganga temple close by and views that run from apple orchards to permanent snow. In January the whole ridge turns into a white, silent amphitheatre.", "sort": 3},
    {"type": "place", "title": "Chandar Nahan Lake", "tag": "Best time: Jun – Sep", "altitude": "≈ 3,800 m · via Janglikh", "difficulty": "Moderate trek", "image_url": f"{P}/1476880/pexels-photo-1476880.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "A breathtaking glacial lake in the Pabbar valley at roughly 3,800 m, ringed by towering snow-covered peaks. Crystal-clear, glacier-fed and still enough to hold the mountains like a mirror — among the most pristine high-altitude lakes in Himachal. Trek, camp, photograph; then leave no trace.", "sort": 4},
    {"type": "place", "title": "Villages of Rohru", "tag": "Best time: All year", "altitude": "1,500 – 2,400 m", "difficulty": "Easy walks", "image_url": f"{P}/32225789/pexels-photo-32225789.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "description": "Kath-kuni houses stacked in slate and deodar, temple courtyards where the devta's palanquin rests, orchards stepping down to the river. Villages like Janglikh, Kui and Samra don't perform for visitors — they simply let you in. Walk slow, accept the chai.", "sort": 5},
    {"type": "place", "title": "Kuppar Peak", "tag": "Best time: May – Oct", "altitude": "≈ 3,400 m · Rohru valley rim", "difficulty": "Challenging", "image_url": f"{P}/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "A dramatic, demanding summit rising over the Rohru valley with a 360° sweep of the greater Himalayan range from the top. The trail climbs through dense alpine forest, flower meadows and broken rock — a true trekker's and mountaineer's day out.", "sort": 6},
    {"type": "place", "title": "Dodra Kwar Village", "tag": "Best time: Apr – Nov", "altitude": "Beyond Chanshal Pass", "difficulty": "Easy · remote drive", "image_url": f"{P}/32225789/pexels-photo-32225789.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "description": "A remote twin village tucked deep in the mountains of Shimla district — ancient wooden temples, Kinnauri-influenced architecture and a way of life the modern world forgot. Even the drive in is an adventure: narrow cliff roads, hanging valleys and some of the quietest miles in Himachal.", "sort": 7},
    {"type": "place", "title": "Rupin Pass Trek", "tag": "Best time: May – Jun & Sep – Oct", "altitude": "≈ 4,650 m", "difficulty": "Difficult", "image_url": f"{P}/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "One of India's most celebrated treks, winding out of the Rohru region through hanging villages, meadows and glacial terrain — past a waterfall that bursts from beneath a snow bridge — before crossing the pass at roughly 4,650 m. A proper expedition, not a stroll.", "sort": 8},
    {"type": "food", "title": "Siddu", "tag": "Steamed · Winter staple", "image_url": f"{P}/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "Wheat dough risen by the hearth, stuffed with walnut, poppy or spiced dal, then steamed over a wood fire and served drowning in desi ghee. Every Rohru grandmother guards her own ratio. Eaten with hands, ideally while snow falls outside.", "sort": 1},
    {"type": "food", "title": "Babru", "tag": "Fried · Festive", "image_url": f"{P}/1624487/pexels-photo-1624487.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "Think kachori, mountain-style: black-gram paste whipped light, folded into wheat dough and fried till it blisters. Babru appears at weddings, fairs and any excuse in between — always with sour tamarind chutney cut with jaggery.", "sort": 2},
    {"type": "food", "title": "Madra", "tag": "Slow-cooked · Dham classic", "image_url": f"{P}/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "Chickpeas simmered for hours in yoghurt, ghee, cloves and black cardamom until the gravy turns to silk. At a village dham, the hereditary cooks stir pots wider than your arms — this is the dish the whole valley judges them by.", "sort": 3},
    {"type": "food", "title": "Chha Gosht", "tag": "For meat lovers", "image_url": f"{P}/2474689/pexels-photo-2474689.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "Mutton marinated overnight in yoghurt and roasted gram flour, then cooked low until the meat gives up pretending to resist. Rich, smoky, unapologetic — the dish that comes out when a Pabbar-side family wants to honour you.", "sort": 4},
    {"type": "food", "title": "Aktori", "tag": "Harvest-time cake", "image_url": f"{P}/3408356/pexels-photo-3408356.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "A dense buckwheat-and-wheat cake studded with walnuts and dried apricot, cooked slowly on an iron griddle and eaten warm with ghee. It tastes like the end of apple season — sweet, smoky and gone too fast.", "sort": 5},
    {"type": "food", "title": "Pabbar Trout", "tag": "Fresh from the river", "image_url": f"{P}/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "Rainbow and brown trout from the valley's own farms and cold runs, pan-fried in local butter with mountain herbs and lemon. Twenty minutes from water to plate. Order it at a riverside dhaba and thank us later.", "sort": 6},
    {"type": "culture", "title": "Jagra & Village Fairs", "tag": "Festivals", "image_url": f"{P}/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "When the drums start at dusk and the karnal horns answer from across the valley, the devta is being invoked. Jagra runs all night — masked dancers, offerings, fire circles — and every village keeps its own date on the old lunar calendar.", "sort": 1},
    {"type": "culture", "title": "Folk Music of the Valley", "tag": "Sound of the hills", "image_url": f"{P}/2577274/pexels-photo-2577274.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "Long-note ballads in Pahari carried over dhol and shehnai — songs of shepherds, feuds, rivers and weddings. You won't find them on streaming. You'll find them at a wedding in Kui at midnight, sung the same way for fifty years.", "sort": 2},
    {"type": "culture", "title": "The Mountain Way of Life", "tag": "Everyday Rohru", "image_url": f"{P}/691668/pexels-photo-691668.jpeg?auto=compress&cs=tinysrgb&w=940", "description": "Days start before the sun clears the ridge: orchard work, wood smoke, wool drying on lines, the day measured by weather rather than clocks. Apples pay the bills, the devta settles the disputes, and no guest leaves unfed.", "sort": 3},
    {"type": "culture", "title": "Temples & Local Deities", "tag": "Living tradition", "image_url": f"{P}/37839627/pexels-photo-37839627.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "description": "Carved kath-kuni temples of deodar and slate house devtas who still govern their valleys — carried in palanquins, consulted on crops and journeys, fed at every fair. Hatkoti's ancient stone temples on the Pabbar are the valley's oldest chapter.", "sort": 4},
]

SEED_EVENTS = [
    {"name": "Chanshal 4x4 Off-Road Expedition", "tag": "Off-road", "date": "14 – 16 Aug 2026", "location": "Chanshal Pass, Rohru", "price": 8500, "total_spots": 16, "available_spots": 16, "image_url": f"{P}/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=940", "cover_url": f"{P}/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=1400", "description": "Three days of high-altitude trail driving to the highest peak in Shimla district. Convoy support, recovery gear, riverside camps and local meals included.", "itinerary": ["Day 1 — Meet at Rohru by noon, convoy briefing and vehicle check, drive up through Chirgaon to Larot. Riverside camp and bonfire dinner.", "Day 2 — Dawn run to Chanshal Pass (4,520 m), photo stops at the saddle, explore the Dodra-Kwar viewpoint, back to camp by dusk.", "Day 3 — Slow breakfast, visit a nearby village, convoy back to Rohru by evening."], "packing": ["Warm layers and a windproof jacket", "Gloves and sunglasses", "Driving licence", "Power bank and torch", "Personal medication", "Camera"], "gallery": [f"{P}/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=1200", f"{P}/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1200", f"{P}/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&w=1200"], "sort": 1},
    {"name": "Pabbar Valley Riverside Camping", "tag": "Camping", "date": "4 – 6 Sep 2026", "location": "Pabbar River banks, Rohru", "price": 4500, "total_spots": 24, "available_spots": 24, "image_url": f"{P}/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&w=940", "cover_url": f"{P}/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&w=1400", "description": "A slow weekend under canvas by the river — bonfires, trout barbecue, stargazing and a sunrise walk through deodar forest.", "itinerary": ["Day 1 — Arrive in Rohru, short drive to the riverside camp, sunset chai, trout barbecue and stargazing by the fire.", "Day 2 — Sunrise deodar walk, breakfast by the river, optional fishing session, lazy afternoon in hammocks.", "Day 3 — Slow morning, group breakfast, disperse by noon."], "packing": ["Light jacket for the evening", "Comfortable shoes plus sandals", "Torch and power bank", "Towel and toiletries", "Personal medication"], "gallery": [f"{P}/2398220/pexels-photo-2398220.jpeg?auto=compress&cs=tinysrgb&w=1200", f"{P}/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=1200", f"{P}/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=1200"], "sort": 2},
    {"name": "Snow Drive: Winter Chanshal", "tag": "Snow drive", "date": "26 – 28 Dec 2026", "location": "Kharapathar – Chanshal route", "price": 9900, "total_spots": 12, "available_spots": 12, "image_url": f"{P}/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=940", "cover_url": f"{P}/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1400", "description": "Winter-special convoy drive on packed snow with experienced marshals. Chains, hot meals and heated base camp at Kharapathar.", "itinerary": ["Day 1 — Rohru briefing, snow-chain fitting practice, drive up to the heated base camp at Kharapathar.", "Day 2 — Full snow convoy day towards Chanshal with marshals, recovery drills, hot lunch on the ridge.", "Day 3 — Sunrise snow walk, group photos, return to Rohru by evening."], "packing": ["Heavy down jacket and thermals", "Waterproof boots", "Gloves plus a spare pair", "Balaclava and woollen cap", "Sunglasses (snow glare)", "Personal medication", "Power bank"], "gallery": [f"{P}/417173/pexels-photo-417173.jpeg?auto=compress&cs=tinysrgb&w=1200", f"{P}/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1200", f"{P}/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=1200"], "sort": 3},
    {"name": "Chandranahan Lake Trek", "tag": "Trek", "date": "25 – 28 Sep 2026", "location": "Chandranahan Lake (4,260 m)", "price": 6500, "total_spots": 15, "available_spots": 15, "image_url": f"{P}/1476880/pexels-photo-1476880.jpeg?auto=compress&cs=tinysrgb&w=940", "cover_url": f"{P}/1476880/pexels-photo-1476880.jpeg?auto=compress&cs=tinysrgb&w=1400", "description": "A guided four-day trek to the glacial source of the Pabbar. Alpine meadows, shepherd trails and a night beside the lake. Porters and meals included.", "itinerary": ["Day 1 — Drive Rohru to Janglikh village, trek briefing, night in a village homestay.", "Day 2 — Trek through meadows and shepherd trails to base camp.", "Day 3 — Summit push to Chandranahan Lake, night beside the lake under the stars.", "Day 4 — Descend to Janglikh and drive back to Rohru."], "packing": ["Broken-in trekking shoes", "40L backpack", "Warm layers and a rain shell", "Reusable water bottle", "Sunglasses and cap", "Headlamp", "Personal medication"], "gallery": [f"{P}/1476880/pexels-photo-1476880.jpeg?auto=compress&cs=tinysrgb&w=1200", f"{P}/933054/pexels-photo-933054.jpeg?auto=compress&cs=tinysrgb&w=1200", f"{P}/1366919/pexels-photo-1366919.jpeg?auto=compress&cs=tinysrgb&w=1200"], "sort": 4},
    {"name": "Village Culture Immersion Weekend", "tag": "Culture", "date": "9 – 11 Oct 2026", "location": "Villages around Rohru", "price": 3999, "total_spots": 20, "available_spots": 20, "image_url": f"{P}/37839627/pexels-photo-37839627.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940", "cover_url": f"{P}/37839627/pexels-photo-37839627.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=1800", "description": "Live with a local family — cook Siddu on a wood fire, join orchard work, hear folk songs at a village temple and eat at a community dham.", "itinerary": ["Day 1 — Arrive, meet your host family, evening walk through the village and temple courtyard.", "Day 2 — Orchard work in the morning, Siddu cooking on a wood fire, community dham dinner with folk songs.", "Day 3 — Morning chai with the elders, visit a kath-kuni temple, depart after lunch."], "packing": ["Comfortable walking shoes", "Modest warm clothing", "Torch", "Reusable water bottle", "Camera", "A small gift for your hosts (optional)"], "gallery": [f"{P}/37839627/pexels-photo-37839627.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200", f"{P}/32225789/pexels-photo-32225789.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=800&w=1200", f"{P}/2577274/pexels-photo-2577274.jpeg?auto=compress&cs=tinysrgb&w=1200"], "sort": 5},
]

SEED_CONTACT = {
    "key": "contact",
    "phone": "+91 98050 00000",
    "whatsapp": "+91 98050 00000",
    "email": "roamingfromrohru@gmail.com",
    "instagram": "@RoamingFromRohru",
    "youtube": "",
    "facebook": "",
    "address": "Rohru, Shimla district, Himachal Pradesh 171207",
}


@app.on_event("startup")
async def seed_data():
    try:
        await client.admin.command("ping")
        logger.info("MongoDB connection successful")
    except Exception:
        logger.exception("MongoDB connection failed. Check MONGO_URL and that the cluster is reachable.")
        return
    if await db.explore.count_documents({}) == 0:
        await db.explore.insert_many([{"id": uuid.uuid4().hex, **item} for item in SEED_EXPLORE])
    if await db.events.count_documents({}) == 0:
        await db.events.insert_many([{"id": uuid.uuid4().hex, **item} for item in SEED_EVENTS])
    if await db.settings.count_documents({"key": "contact"}) == 0:
        await db.settings.insert_one(SEED_CONTACT)


app.include_router(api_router)
app.mount("/api/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
