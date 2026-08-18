from dotenv import load_dotenv
load_dotenv()

import os
import re
import uuid
import logging
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Optional, List
from urllib.parse import quote

import bcrypt
import jwt
import httpx
import bleach
from bleach.css_sanitizer import CSSSanitizer
from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import certifi
from pydantic import BaseModel, EmailStr

ROOT_DIR = Path(__file__).parent
SEED_DATA_DIR = ROOT_DIR / "seed_data"


def load_seed_json(name: str):
    import json
    path = SEED_DATA_DIR / f"{name}.json"
    if not path.exists():
        return []
    return json.loads(path.read_text())


# ---------- Rich text sanitization ----------
# Content fields edited through the CMS's WYSIWYG editor are stored as HTML.
# Sanitize on every write so nothing unsafe (script tags, event handlers,
# javascript: links, etc.) ever reaches the database or the public site.

RICH_TEXT_TAGS = [
    "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "span", "a",
    "ul", "ol", "li", "h1", "h2", "h3", "h4", "blockquote", "sub", "sup", "hr",
]
RICH_TEXT_ATTRS = {
    "*": ["style", "class"],
    "a": ["href", "target", "rel"],
}
RICH_TEXT_CSS_PROPERTIES = [
    "color", "background-color", "font-family", "font-size",
    "text-align", "text-decoration", "font-weight", "font-style",
]
_rich_text_cleaner = bleach.Cleaner(
    tags=RICH_TEXT_TAGS,
    attributes=RICH_TEXT_ATTRS,
    css_sanitizer=CSSSanitizer(allowed_css_properties=RICH_TEXT_CSS_PROPERTIES),
    protocols=["http", "https", "mailto"],
    strip=True,
)


def sanitize_rich_html(value: str) -> str:
    if not value:
        return value
    return _rich_text_cleaner.clean(value)


def sanitize_fields(doc: dict, fields: list) -> dict:
    for f in fields:
        if doc.get(f):
            doc[f] = sanitize_rich_html(doc[f])
    return doc


logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url, tlsCAFile=certifi.where())
db = client[os.environ["DB_NAME"]]

EMAIL_BASE_URL = "https://integrations.emergentagent.com"
EMAIL_KEY = os.environ.get("EMERGENT_EMAIL_KEY")
EMAIL_FROM_NAME = os.environ.get("EMAIL_FROM_NAME", "MarKendrick")
OWNER_EMAIL = os.environ.get("OWNER_EMAIL", os.environ.get("ADMIN_EMAIL"))

JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")


# ---------- Email ----------

async def send_email(to: str, subject: str, html: str, reply_to: Optional[str] = None):
    if not EMAIL_KEY:
        logger.warning("EMERGENT_EMAIL_KEY missing; skipping email to %s", to)
        return None
    payload = {"to": [to], "subject": subject, "html": html, "from_name": EMAIL_FROM_NAME}
    if reply_to:
        payload["contact_email"] = reply_to
    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(
                f"{EMAIL_BASE_URL}/api/v1/email/send",
                headers={"X-Email-Key": EMAIL_KEY},
                json=payload,
            )
        resp.raise_for_status()
        return resp.json().get("id")
    except Exception as e:
        logger.error("Email send failed to %s: %s", to, e)
        return None


def email_shell(title: str, body: str, unsubscribe_url: str = None) -> str:
    footer_extra = f' <a href="{unsubscribe_url}" style="color:#8a8a8a;text-decoration:underline;">Unsubscribe</a>' if unsubscribe_url else ""
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F5F3;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
      <tr><td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e5e0da;">
          <tr><td style="padding:28px 32px;border-bottom:3px solid #E0923D;">
            <span style="font-size:22px;font-weight:800;color:#1E3245;letter-spacing:-0.5px;">Mar<span style="color:#E0923D;">Kendrick</span></span>
          </td></tr>
          <tr><td style="padding:32px;color:#2a2a2a;font-size:15px;line-height:1.7;">
            <h1 style="margin:0 0 16px;font-size:22px;color:#1E3245;">{title}</h1>
            {body}
          </td></tr>
          <tr><td style="padding:20px 32px;border-top:1px solid #e5e0da;color:#8a8a8a;font-size:12px;">
            MarKendrick - Insights that Inform. Strategies that Perform. Lahore, Pakistan.{footer_extra}
          </td></tr>
        </table>
      </td></tr>
    </table>"""


def api_base_url(request: Request) -> str:
    return os.environ.get("BACKEND_URL", "").rstrip("/") or str(request.base_url).rstrip("/")


# ---------- Auth ----------

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=30), "type": "access"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)


def set_auth_cookies(response: Response, user_id: str, email: str):
    response.set_cookie("access_token", create_access_token(user_id, email), httponly=True, secure=True, samesite="none", max_age=1800, path="/")
    response.set_cookie("refresh_token", create_refresh_token(user_id), httponly=True, secure=True, samesite="none", max_age=604800, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload["email"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@api_router.post("/auth/login")
async def login(body: LoginRequest, request: Request, response: Response):
    email = body.email.lower()
    identifier = f"{request.client.host}:{email}"
    attempts = await db.login_attempts.find_one({"identifier": identifier})
    if attempts and attempts.get("count", 0) >= 5:
        locked_at = attempts.get("last_attempt")
        if locked_at and datetime.now(timezone.utc) - datetime.fromisoformat(locked_at) < timedelta(minutes=15):
            raise HTTPException(status_code=429, detail="Too many failed attempts. Try again in 15 minutes.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc).isoformat()}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    set_auth_cookies(response, user["id"], email)
    return {"id": user["id"], "email": email, "name": user.get("name", "Admin"), "role": user.get("role", "admin")}


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"status": "logged_out"}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/refresh")
async def refresh(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = await db.users.find_one({"id": payload["sub"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    response.set_cookie("access_token", create_access_token(user["id"], user["email"]), httponly=True, secure=True, samesite="none", max_age=1800, path="/")
    return {"status": "refreshed"}


# ---------- Blog ----------

def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or uuid.uuid4().hex[:8]


class PostIn(BaseModel):
    title: str
    category: str = "Strategy"
    excerpt: str = ""
    body: str = ""
    author: str = "MarKendrick Team"
    tags: List[str] = []
    cover: str = ""
    read_time: str = "5 min read"
    published: bool = True


@api_router.get("/posts")
async def list_posts(category: Optional[str] = None, q: Optional[str] = None):
    query = {"published": True}
    if category and category != "All":
        query["category"] = category
    if q:
        query["$or"] = [{"title": {"$regex": q, "$options": "i"}}, {"excerpt": {"$regex": q, "$options": "i"}}, {"body": {"$regex": q, "$options": "i"}}]
    return await db.posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.get("/posts/{slug}")
async def get_post(slug: str):
    post = await db.posts.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    related = await db.posts.find({"category": post["category"], "slug": {"$ne": slug}, "published": True}, {"_id": 0}).limit(3).to_list(3)
    post["related"] = related
    return post


@api_router.get("/admin/posts")
async def admin_list_posts(user: dict = Depends(get_current_user)):
    return await db.posts.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/admin/posts")
async def admin_create_post(body: PostIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    sanitize_fields(doc, ["body"])
    doc["id"] = uuid.uuid4().hex
    slug = slugify(doc["title"])
    if await db.posts.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"
    doc["slug"] = slug
    now = datetime.now(timezone.utc).isoformat()
    doc["created_at"] = now
    doc["updated_at"] = now
    await db.posts.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/posts/{post_id}")
async def admin_update_post(post_id: str, body: PostIn, user: dict = Depends(get_current_user)):
    update = body.model_dump()
    sanitize_fields(update, ["body"])
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.posts.update_one({"id": post_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return await db.posts.find_one({"id": post_id}, {"_id": 0})


@api_router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, user: dict = Depends(get_current_user)):
    result = await db.posts.delete_one({"id": post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"status": "deleted"}


# ---------- Case Studies ----------

class CaseStudyIn(BaseModel):
    client: str
    title: str
    industry: str = "General"
    services: List[str] = []
    summary: str = ""
    challenge: str = ""
    approach: str = ""
    results: List[dict] = []
    quote: str = ""
    quote_author: str = ""
    cover: str = ""
    published: bool = True


@api_router.get("/case-studies")
async def list_case_studies():
    return await db.case_studies.find({"published": True}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.get("/case-studies/{slug}")
async def get_case_study(slug: str):
    cs = await db.case_studies.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not cs:
        raise HTTPException(status_code=404, detail="Case study not found")
    return cs


@api_router.get("/admin/case-studies")
async def admin_list_case_studies(user: dict = Depends(get_current_user)):
    return await db.case_studies.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/admin/case-studies")
async def admin_create_case_study(body: CaseStudyIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    sanitize_fields(doc, ["challenge", "approach"])
    doc["id"] = uuid.uuid4().hex
    slug = slugify(f"{doc['client']}-{doc['title']}")
    if await db.case_studies.find_one({"slug": slug}):
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"
    doc["slug"] = slug
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.case_studies.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/case-studies/{cs_id}")
async def admin_update_case_study(cs_id: str, body: CaseStudyIn, user: dict = Depends(get_current_user)):
    update = sanitize_fields(body.model_dump(), ["challenge", "approach"])
    result = await db.case_studies.update_one({"id": cs_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    return await db.case_studies.find_one({"id": cs_id}, {"_id": 0})


@api_router.delete("/admin/case-studies/{cs_id}")
async def admin_delete_case_study(cs_id: str, user: dict = Depends(get_current_user)):
    result = await db.case_studies.delete_one({"id": cs_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Case study not found")
    return {"status": "deleted"}


# ---------- Leads / Newsletter / Bookings ----------

class LeadIn(BaseModel):
    name: str
    email: EmailStr
    company: str = ""
    service: str = ""
    budget: str = ""
    timeline: str = ""
    message: str = ""
    source: str = "contact"


@api_router.post("/leads")
async def create_lead(body: LeadIn):
    doc = body.model_dump()
    doc["id"] = uuid.uuid4().hex
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.leads.insert_one(doc)
    owner_html = email_shell(
        "New lead received",
        f"""<p><strong>Name:</strong> {doc['name']}<br/><strong>Email:</strong> {doc['email']}<br/>
        <strong>Company:</strong> {doc['company'] or '-'}<br/><strong>Service:</strong> {doc['service'] or '-'}<br/>
        <strong>Budget:</strong> {doc['budget'] or '-'}<br/><strong>Timeline:</strong> {doc['timeline'] or '-'}<br/>
        <strong>Source:</strong> {doc['source']}</p><p>{doc['message'] or ''}</p>""",
    )
    await send_email(OWNER_EMAIL, f"New MarKendrick lead: {doc['name']}", owner_html, reply_to=doc["email"])
    confirm_html = email_shell(
        f"Thanks, {doc['name'].split()[0]} - we've got your brief.",
        """<p>Your enquiry just landed with our strategy team. A senior consultant - never a bot -
        will reply within one business day with next steps.</p>
        <p style="color:#8a8a8a;">Meanwhile, explore our latest thinking on the Insights hub.</p>""",
    )
    await send_email(doc["email"], "We received your brief - MarKendrick", confirm_html)
    return {"status": "received", "id": doc["id"]}


class NewsletterIn(BaseModel):
    email: EmailStr


@api_router.post("/newsletter")
async def subscribe(body: NewsletterIn, request: Request):
    email = body.email.lower()
    existing = await db.subscribers.find_one({"email": email})
    if existing:
        return {"status": "already_subscribed"}
    await db.subscribers.insert_one({"id": uuid.uuid4().hex, "email": email, "created_at": datetime.now(timezone.utc).isoformat()})
    unsubscribe_url = f"{api_base_url(request)}/api/newsletter/unsubscribe?email={quote(email)}"
    html = email_shell(
        "You're on The Signal list.",
        """<p>Welcome to <strong>The Signal</strong> - MarKendrick's monthly briefing.</p>
        <p>Once a month, you'll get one real campaign teardown, one consumer psychology principle you can apply,
        and one performance-marketing tactic worth stealing. That's it - no daily noise, no filler, no spam.</p>""",
        unsubscribe_url=unsubscribe_url,
    )
    await send_email(email, "Welcome to The Signal - MarKendrick", html)
    return {"status": "subscribed"}


@api_router.get("/newsletter/unsubscribe")
async def unsubscribe(email: str):
    await db.subscribers.delete_one({"email": email.lower().strip()})
    return Response(
        content=f"""<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Unsubscribed - MarKendrick</title></head>
        <body style="margin:0;background:#F7F5F3;font-family:Arial,Helvetica,sans-serif;color:#1E3245;">
          <div style="max-width:480px;margin:80px auto;padding:40px;background:#ffffff;border:1px solid #e5e0da;text-align:center;">
            <p style="font-size:20px;font-weight:800;margin:0 0 20px;">Mar<span style="color:#E0923D;">Kendrick</span></p>
            <h1 style="font-size:20px;margin:0 0 12px;">You've been unsubscribed.</h1>
            <p style="color:#5a5a5a;font-size:14px;line-height:1.6;">{email} will no longer receive The Signal. You can resubscribe anytime from markendrick.com.</p>
          </div>
        </body></html>""",
        media_type="text/html",
    )


class BookingIn(BaseModel):
    name: str
    email: EmailStr
    company: str = ""
    service: str = ""
    date: str
    slot: str
    notes: str = ""


@api_router.post("/bookings")
async def create_booking(body: BookingIn):
    doc = body.model_dump()
    doc["id"] = uuid.uuid4().hex
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.bookings.insert_one(doc)
    confirm_html = email_shell(
        "Consultation request received",
        f"""<p><strong>{doc['date']} at {doc['slot']} (PKT)</strong> - {doc['service'] or 'General consultation'}.</p>
        <p>Our team will confirm your slot by email within a few hours and share a video-call link.</p>""",
    )
    await send_email(doc["email"], f"Consultation requested for {doc['date']} - MarKendrick", confirm_html)
    owner_html = email_shell(
        "New consultation booking",
        f"""<p><strong>{doc['name']}</strong> ({doc['email']}, {doc['company'] or '-'})<br/>
        <strong>When:</strong> {doc['date']} at {doc['slot']}<br/><strong>Service:</strong> {doc['service'] or '-'}<br/>
        <strong>Notes:</strong> {doc['notes'] or '-'}</p>""",
    )
    await send_email(OWNER_EMAIL, f"Booking: {doc['name']} - {doc['date']} {doc['slot']}", owner_html, reply_to=doc["email"])
    return {"status": "booked", "id": doc["id"]}


@api_router.get("/admin/leads")
async def admin_list_leads(user: dict = Depends(get_current_user)):
    return await db.leads.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.delete("/admin/leads/{lead_id}")
async def admin_delete_lead(lead_id: str, user: dict = Depends(get_current_user)):
    result = await db.leads.delete_one({"id": lead_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Lead not found")
    return {"status": "deleted"}


@api_router.get("/admin/bookings")
async def admin_list_bookings(user: dict = Depends(get_current_user)):
    return await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.delete("/admin/bookings/{booking_id}")
async def admin_delete_booking(booking_id: str, user: dict = Depends(get_current_user)):
    result = await db.bookings.delete_one({"id": booking_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"status": "deleted"}


@api_router.get("/admin/subscribers")
async def admin_list_subscribers(user: dict = Depends(get_current_user)):
    return await db.subscribers.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.delete("/admin/subscribers/{sub_id}")
async def admin_delete_subscriber(sub_id: str, user: dict = Depends(get_current_user)):
    result = await db.subscribers.delete_one({"id": sub_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Subscriber not found")
    return {"status": "deleted"}


# ---------- Search ----------

@api_router.get("/search")
async def search(q: str = ""):
    if len(q.strip()) < 2:
        return {"posts": [], "case_studies": []}
    rx = {"$regex": q.strip(), "$options": "i"}
    posts = await db.posts.find({"published": True, "$or": [{"title": rx}, {"excerpt": rx}, {"tags": rx}]}, {"_id": 0, "body": 0}).limit(6).to_list(6)
    studies = await db.case_studies.find({"published": True, "$or": [{"title": rx}, {"client": rx}, {"summary": rx}, {"industry": rx}]}, {"_id": 0}).limit(4).to_list(4)
    return {"posts": posts, "case_studies": studies}


# ---------- Whitepapers (gated, CMS-managed) ----------

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", ROOT_DIR / "uploads"))
UPLOAD_DIR.mkdir(exist_ok=True, parents=True)

SEED_WHITEPAPERS = [
    {
        "id": "pakistan-consumer-report-2026",
        "title": "The Pakistan Consumer Report 2026",
        "category": "Research Report",
        "description": "Five structural shifts in how Pakistan's shoppers discover, decide and buy - with implications for every consumer brand.",
        "pages": "8 pages",
        "file": "pakistan-consumer-report-2026.pdf",
    },
    {
        "id": "neuromarketing-shelf-field-guide",
        "title": "Neuromarketing at the Shelf",
        "category": "Field Guide",
        "description": "How the shopper brain actually chooses - and how to design packaging, pricing and placement for it.",
        "pages": "8 pages",
        "file": "neuromarketing-shelf-field-guide.pdf",
    },
    {
        "id": "cmo-diagnostic-toolkit",
        "title": "The CMO's Diagnostic Toolkit",
        "category": "Strategy Toolkit",
        "description": "Five frameworks to find your real growth bottleneck - before spending another rupee on the wrong fix.",
        "pages": "8 pages",
        "file": "cmo-diagnostic-toolkit.pdf",
    },
]


@api_router.get("/uploads/{filename}")
async def serve_upload(filename: str):
    from fastapi.responses import FileResponse
    safe = Path(filename).name
    path = UPLOAD_DIR / safe
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, media_type="application/pdf")


@api_router.get("/whitepapers")
async def list_whitepapers():
    return await db.whitepapers.find({"published": True}, {"_id": 0, "file_url": 0}).sort("created_at", 1).to_list(100)


class WhitepaperDownloadIn(BaseModel):
    whitepaper_id: str
    name: str
    email: EmailStr


@api_router.post("/whitepaper-download")
async def whitepaper_download(body: WhitepaperDownloadIn, request: Request):
    wp = await db.whitepapers.find_one({"id": body.whitepaper_id, "published": True}, {"_id": 0})
    if not wp:
        raise HTTPException(status_code=404, detail="Whitepaper not found")
    email = body.email.lower()
    download_url = wp["file_url"]
    await db.leads.insert_one({
        "id": uuid.uuid4().hex,
        "name": body.name,
        "email": email,
        "company": "",
        "service": "",
        "budget": "",
        "timeline": "",
        "message": f"Downloaded whitepaper: {wp['title']}",
        "source": "whitepaper",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    if not await db.subscribers.find_one({"email": email}):
        await db.subscribers.insert_one({"id": uuid.uuid4().hex, "email": email, "created_at": datetime.now(timezone.utc).isoformat()})
    unsubscribe_url = f"{api_base_url(request)}/api/newsletter/unsubscribe?email={quote(email)}"
    html = email_shell(
        f"Your copy of {wp['title']}",
        f"""<p>Thanks, {body.name.split()[0]} - your report is ready:</p>
        <p><a href="{download_url}" style="color:#E0923D;font-weight:bold;">Download {wp['title']} (PDF)</a></p>
        <p style="color:#8a8a8a;">You're also on The Signal list - one insight briefing a month, zero fluff.</p>""",
        unsubscribe_url=unsubscribe_url,
    )
    await send_email(email, f"{wp['title']} - your download", html)
    owner_html = email_shell(
        "Whitepaper download",
        f"<p><strong>{body.name}</strong> ({email}) downloaded <strong>{wp['title']}</strong>.</p>",
    )
    await send_email(OWNER_EMAIL, f"Whitepaper lead: {body.name} - {wp['title']}", owner_html, reply_to=email)
    return {"status": "unlocked", "download_url": download_url}


@api_router.get("/admin/whitepapers")
async def admin_list_whitepapers(user: dict = Depends(get_current_user)):
    return await db.whitepapers.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)


@api_router.post("/admin/whitepapers")
async def admin_create_whitepaper(
    request: Request,
    user: dict = Depends(get_current_user),
):
    from fastapi import UploadFile
    form = await request.form()
    file = form.get("file")
    if file is None or not getattr(file, "filename", ""):
        raise HTTPException(status_code=400, detail="PDF file is required")
    content = await file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 25 MB)")
    stored = f"{uuid.uuid4().hex}.pdf"
    (UPLOAD_DIR / stored).write_bytes(content)
    file_url = f"{os.environ.get('FRONTEND_URL', '').rstrip('/')}/api/uploads/{stored}"
    doc = {
        "id": uuid.uuid4().hex[:12],
        "title": form.get("title", "Untitled Report"),
        "category": form.get("category", "Report"),
        "description": form.get("description", ""),
        "pages": form.get("pages", ""),
        "file_url": file_url,
        "stored_file": stored,
        "published": form.get("published", "true") == "true",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.whitepapers.insert_one(doc)
    doc.pop("_id", None)
    return doc


class WhitepaperMetaIn(BaseModel):
    title: str
    category: str = "Report"
    description: str = ""
    pages: str = ""
    published: bool = True


@api_router.put("/admin/whitepapers/{wp_id}")
async def admin_update_whitepaper(wp_id: str, body: WhitepaperMetaIn, user: dict = Depends(get_current_user)):
    result = await db.whitepapers.update_one({"id": wp_id}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Whitepaper not found")
    return await db.whitepapers.find_one({"id": wp_id}, {"_id": 0})


@api_router.delete("/admin/whitepapers/{wp_id}")
async def admin_delete_whitepaper(wp_id: str, user: dict = Depends(get_current_user)):
    wp = await db.whitepapers.find_one({"id": wp_id})
    if not wp:
        raise HTTPException(status_code=404, detail="Whitepaper not found")
    stored = wp.get("stored_file")
    if stored:
        try:
            (UPLOAD_DIR / stored).unlink(missing_ok=True)
        except Exception:
            pass
    await db.whitepapers.delete_one({"id": wp_id})
    return {"status": "deleted"}


# ---------- Testimonials ----------

class TestimonialIn(BaseModel):
    quote: str
    name: str
    role: str = ""
    company: str = ""
    industry: str = ""
    metric: str = ""
    video_url: str = ""
    published: bool = True


@api_router.get("/testimonials")
async def list_testimonials():
    return await db.testimonials.find({"published": True}, {"_id": 0}).sort("created_at", 1).to_list(50)


@api_router.get("/admin/testimonials")
async def admin_list_testimonials(user: dict = Depends(get_current_user)):
    return await db.testimonials.find({}, {"_id": 0}).sort("created_at", -1).to_list(100)


@api_router.post("/admin/testimonials")
async def admin_create_testimonial(body: TestimonialIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    doc["id"] = uuid.uuid4().hex[:12]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.testimonials.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/testimonials/{t_id}")
async def admin_update_testimonial(t_id: str, body: TestimonialIn, user: dict = Depends(get_current_user)):
    result = await db.testimonials.update_one({"id": t_id}, {"$set": body.model_dump()})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return await db.testimonials.find_one({"id": t_id}, {"_id": 0})


@api_router.delete("/admin/testimonials/{t_id}")
async def admin_delete_testimonial(t_id: str, user: dict = Depends(get_current_user)):
    result = await db.testimonials.delete_one({"id": t_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Testimonial not found")
    return {"status": "deleted"}


class TestimonialSubmitIn(BaseModel):
    name: str
    role: str = ""
    company: str = ""
    quote: str
    metric: str = ""
    email: Optional[EmailStr] = None


@api_router.post("/testimonials/submit")
async def submit_testimonial(body: TestimonialSubmitIn):
    name = body.name.strip()
    quote = body.quote.strip()
    if not name:
        raise HTTPException(status_code=422, detail="Please tell us your name.")
    if len(quote) < 20:
        raise HTTPException(status_code=422, detail="Please share a bit more detail - a sentence or two.")
    if len(quote) > 2000:
        raise HTTPException(status_code=422, detail="That's a bit long - please keep it under 2000 characters.")

    doc = {
        "id": uuid.uuid4().hex[:12],
        "quote": quote,
        "name": name,
        "role": body.role.strip(),
        "company": body.company.strip(),
        "industry": "",
        "metric": body.metric.strip(),
        "video_url": "",
        "published": False,
        "source": "client_submission",
        "submitter_email": body.email or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.testimonials.insert_one(doc)

    contact_line = f"<strong>Contact:</strong> {doc['submitter_email']}<br/>" if doc["submitter_email"] else ""
    metric_line = f"<strong>Result:</strong> {doc['metric']}<br/>" if doc["metric"] else ""
    owner_html = email_shell(
        "New testimonial submitted",
        f"""<p><strong>Name:</strong> {doc['name']}<br/>
        <strong>Role / Company:</strong> {doc['role']}{', ' + doc['company'] if doc['company'] else ''}<br/>
        {contact_line}{metric_line}</p>
        <blockquote style="border-left:3px solid #E0923D;padding-left:16px;margin:16px 0;color:#2a2a2a;">{doc['quote']}</blockquote>
        <p style="color:#8a8a8a;font-size:13px;">Saved as a draft - review and publish it from the Testimonials tab in your admin dashboard.</p>""",
    )
    await send_email(OWNER_EMAIL, f"New testimonial from {doc['name']}", owner_html, reply_to=doc["submitter_email"] or None)
    return {"status": "received"}


# ---------- Services ----------

class ServiceIn(BaseModel):
    slug: str
    name: str
    short: str = ""
    icon: str = "Search"
    metaTitle: str = ""
    metaDesc: str = ""
    hero: str = ""
    body: str = ""
    deliverables: List[str] = []
    group: str = "Other"
    order: int = 0
    published: bool = True


@api_router.get("/services")
async def list_services():
    return await db.services.find({"published": True}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.get("/services/{slug}")
async def get_service(slug: str):
    doc = await db.services.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Service not found")
    return doc


@api_router.get("/admin/services")
async def admin_list_services(user: dict = Depends(get_current_user)):
    return await db.services.find({}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.post("/admin/services")
async def admin_create_service(body: ServiceIn, user: dict = Depends(get_current_user)):
    if await db.services.find_one({"slug": body.slug}):
        raise HTTPException(status_code=400, detail="A service with this slug already exists")
    doc = body.model_dump()
    sanitize_fields(doc, ["body"])
    doc["id"] = body.slug
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.services.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/services/{svc_id}")
async def admin_update_service(svc_id: str, body: ServiceIn, user: dict = Depends(get_current_user)):
    update = sanitize_fields(body.model_dump(), ["body"])
    result = await db.services.update_one({"id": svc_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return await db.services.find_one({"id": svc_id}, {"_id": 0})


@api_router.delete("/admin/services/{svc_id}")
async def admin_delete_service(svc_id: str, user: dict = Depends(get_current_user)):
    result = await db.services.delete_one({"id": svc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"status": "deleted"}


# ---------- Industries ----------

class IndustryIn(BaseModel):
    slug: str
    name: str
    tagline: str = ""
    intro: str = ""
    challenges: List[str] = []
    services: List[str] = []
    metaTitle: str = ""
    metaDesc: str = ""
    order: int = 0
    published: bool = True


@api_router.get("/industries")
async def list_industries():
    return await db.industries.find({"published": True}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.get("/industries/{slug}")
async def get_industry(slug: str):
    doc = await db.industries.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Industry not found")
    return doc


@api_router.get("/admin/industries")
async def admin_list_industries(user: dict = Depends(get_current_user)):
    return await db.industries.find({}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.post("/admin/industries")
async def admin_create_industry(body: IndustryIn, user: dict = Depends(get_current_user)):
    if await db.industries.find_one({"slug": body.slug}):
        raise HTTPException(status_code=400, detail="An industry with this slug already exists")
    doc = body.model_dump()
    sanitize_fields(doc, ["intro"])
    doc["id"] = body.slug
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.industries.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/industries/{ind_id}")
async def admin_update_industry(ind_id: str, body: IndustryIn, user: dict = Depends(get_current_user)):
    update = sanitize_fields(body.model_dump(), ["intro"])
    result = await db.industries.update_one({"id": ind_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Industry not found")
    return await db.industries.find_one({"id": ind_id}, {"_id": 0})


@api_router.delete("/admin/industries/{ind_id}")
async def admin_delete_industry(ind_id: str, user: dict = Depends(get_current_user)):
    result = await db.industries.delete_one({"id": ind_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Industry not found")
    return {"status": "deleted"}


# ---------- Locations ----------

class LocationIn(BaseModel):
    slug: str
    name: str
    eyebrow: str = ""
    h1: str = ""
    intro: str = ""
    body2: str = ""
    points: List[str] = []
    metaTitle: str = ""
    metaDesc: str = ""
    order: int = 0
    published: bool = True


@api_router.get("/locations")
async def list_locations():
    return await db.locations.find({"published": True}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.get("/locations/{slug}")
async def get_location(slug: str):
    doc = await db.locations.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Location not found")
    return doc


@api_router.get("/admin/locations")
async def admin_list_locations(user: dict = Depends(get_current_user)):
    return await db.locations.find({}, {"_id": 0}).sort("order", 1).to_list(200)


@api_router.post("/admin/locations")
async def admin_create_location(body: LocationIn, user: dict = Depends(get_current_user)):
    if await db.locations.find_one({"slug": body.slug}):
        raise HTTPException(status_code=400, detail="A location with this slug already exists")
    doc = body.model_dump()
    sanitize_fields(doc, ["intro", "body2"])
    doc["id"] = body.slug
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.locations.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/locations/{loc_id}")
async def admin_update_location(loc_id: str, body: LocationIn, user: dict = Depends(get_current_user)):
    update = sanitize_fields(body.model_dump(), ["intro", "body2"])
    result = await db.locations.update_one({"id": loc_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return await db.locations.find_one({"id": loc_id}, {"_id": 0})


@api_router.delete("/admin/locations/{loc_id}")
async def admin_delete_location(loc_id: str, user: dict = Depends(get_current_user)):
    result = await db.locations.delete_one({"id": loc_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Location not found")
    return {"status": "deleted"}


# ---------- FAQ ----------

class FaqIn(BaseModel):
    group: str = "General"
    question: str
    answer: str = ""
    order: int = 0
    published: bool = True


@api_router.get("/faqs")
async def list_faqs():
    return await db.faqs.find({"published": True}, {"_id": 0}).sort("order", 1).to_list(300)


@api_router.get("/admin/faqs")
async def admin_list_faqs(user: dict = Depends(get_current_user)):
    return await db.faqs.find({}, {"_id": 0}).sort("order", 1).to_list(300)


@api_router.post("/admin/faqs")
async def admin_create_faq(body: FaqIn, user: dict = Depends(get_current_user)):
    doc = body.model_dump()
    sanitize_fields(doc, ["answer"])
    doc["id"] = uuid.uuid4().hex[:12]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.faqs.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/admin/faqs/{faq_id}")
async def admin_update_faq(faq_id: str, body: FaqIn, user: dict = Depends(get_current_user)):
    update = sanitize_fields(body.model_dump(), ["answer"])
    result = await db.faqs.update_one({"id": faq_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return await db.faqs.find_one({"id": faq_id}, {"_id": 0})


@api_router.delete("/admin/faqs/{faq_id}")
async def admin_delete_faq(faq_id: str, user: dict = Depends(get_current_user)):
    result = await db.faqs.delete_one({"id": faq_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="FAQ not found")
    return {"status": "deleted"}


# ---------- Legal pages ----------

class LegalSection(BaseModel):
    h: str
    p: str = ""


class LegalPageIn(BaseModel):
    slug: str
    title: str
    updated: str = ""
    metaDesc: str = ""
    sections: List[LegalSection] = []
    published: bool = True


@api_router.get("/legal-pages/{slug}")
async def get_legal_page(slug: str):
    doc = await db.legal_pages.find_one({"slug": slug, "published": True}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Page not found")
    return doc


@api_router.get("/admin/legal-pages")
async def admin_list_legal_pages(user: dict = Depends(get_current_user)):
    return await db.legal_pages.find({}, {"_id": 0}).sort("slug", 1).to_list(50)


@api_router.put("/admin/legal-pages/{slug}")
async def admin_update_legal_page(slug: str, body: LegalPageIn, user: dict = Depends(get_current_user)):
    data = body.model_dump()
    data["id"] = slug
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.legal_pages.update_one({"slug": slug}, {"$set": data}, upsert=True)
    data.pop("_id", None)
    return data


# ---------- Media library ----------

MEDIA_MIME_TYPES = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".svg": "image/svg+xml",
}


@api_router.get("/media/{filename}")
async def serve_media(filename: str):
    from fastapi.responses import FileResponse
    safe = Path(filename).name
    path = UPLOAD_DIR / "media" / safe
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    mime = MEDIA_MIME_TYPES.get(path.suffix.lower(), "application/octet-stream")
    return FileResponse(path, media_type=mime, headers={"Cache-Control": "public, max-age=31536000, immutable"})


@api_router.get("/admin/media")
async def admin_list_media(user: dict = Depends(get_current_user)):
    return await db.media.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.post("/admin/media")
async def admin_upload_media(request: Request, user: dict = Depends(get_current_user)):
    form = await request.form()
    file = form.get("file")
    if file is None or not getattr(file, "filename", ""):
        raise HTTPException(status_code=400, detail="Image file is required")
    ext = Path(file.filename).suffix.lower()
    if ext not in MEDIA_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Unsupported file type. Use PNG, JPG, GIF, WEBP or SVG.")
    content = await file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 10 MB)")
    media_dir = UPLOAD_DIR / "media"
    media_dir.mkdir(exist_ok=True, parents=True)
    stored = f"{uuid.uuid4().hex}{ext}"
    (media_dir / stored).write_bytes(content)
    url = f"{api_base_url(request)}/api/media/{stored}"
    doc = {
        "id": uuid.uuid4().hex[:12],
        "filename": file.filename,
        "stored_file": stored,
        "url": url,
        "size": len(content),
        "source": "upload",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.media.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/admin/media/import-existing")
async def admin_import_existing_media(user: dict = Depends(get_current_user)):
    """Registers image URLs already used across site content (case study covers, post covers,
    industry/location images) into the media library so they're visible and reusable in the CMS,
    even though the files themselves aren't stored in our own uploads directory."""
    existing_urls = {m["url"] async for m in db.media.find({}, {"url": 1})}
    to_insert = []

    async for cs in db.case_studies.find({}, {"cover": 1, "client": 1, "title": 1}):
        url = (cs.get("cover") or "").strip()
        if url and url not in existing_urls:
            existing_urls.add(url)
            to_insert.append({
                "id": uuid.uuid4().hex[:12],
                "filename": f"Case study: {cs.get('client', 'Untitled')}",
                "stored_file": None,
                "url": url,
                "size": None,
                "source": "case_study",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    async for p in db.posts.find({}, {"cover": 1, "title": 1}):
        url = (p.get("cover") or "").strip()
        if url and url not in existing_urls:
            existing_urls.add(url)
            to_insert.append({
                "id": uuid.uuid4().hex[:12],
                "filename": f"Post cover: {p.get('title', 'Untitled')}",
                "stored_file": None,
                "url": url,
                "size": None,
                "source": "post",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    if to_insert:
        await db.media.insert_many(to_insert)
    return {"imported": len(to_insert)}


@api_router.delete("/admin/media/{media_id}")
async def admin_delete_media(media_id: str, user: dict = Depends(get_current_user)):
    m = await db.media.find_one({"id": media_id})
    if not m:
        raise HTTPException(status_code=404, detail="Media not found")
    stored = m.get("stored_file")
    if stored:
        try:
            (UPLOAD_DIR / "media" / stored).unlink(missing_ok=True)
        except Exception:
            pass
    await db.media.delete_one({"id": media_id})
    return {"status": "deleted"}


# ---------- Site settings ----------

DEFAULT_SETTINGS = {
    "logo_url": "/media/brand/logo-color-mark.png",
    "footer_newsletter_title": "One email a month. Zero fluff.",
    "footer_newsletter_desc": "Consumer psychology, performance media, brand science. Unsubscribe anytime.",
    "footer_copyright": "MarKendrick. Insights that Inform. Strategies that Perform.",
    "office_address": "Gulberg III, Lahore, Punjab, Pakistan",
    "office_email": "hello@markendrick.com",
    "office_hours": "Mon–Fri, 9:00–18:00 PKT",
    "office_whatsapp": "923339395444",
    "studio_video_url": "/media/studio-session.mp4",
    "about_office_photo_url": "/media/office/office-1.jpg",
    "home_showreel_poster_url": "/media/office/office-2.jpg",
    "typography_heading_font": "Sora",
    "typography_body_font": "DM Sans",
    "typography_base_size": "16",
    "typography_heading_color": "",
    "typography_body_color": "",
    "typography_link_color": "",
}


class SiteSettingsIn(BaseModel):
    logo_url: str = DEFAULT_SETTINGS["logo_url"]
    footer_newsletter_title: str = DEFAULT_SETTINGS["footer_newsletter_title"]
    footer_newsletter_desc: str = DEFAULT_SETTINGS["footer_newsletter_desc"]
    footer_copyright: str = DEFAULT_SETTINGS["footer_copyright"]
    office_address: str = DEFAULT_SETTINGS["office_address"]
    office_email: str = DEFAULT_SETTINGS["office_email"]
    office_hours: str = DEFAULT_SETTINGS["office_hours"]
    office_whatsapp: str = DEFAULT_SETTINGS["office_whatsapp"]
    studio_video_url: str = DEFAULT_SETTINGS["studio_video_url"]
    about_office_photo_url: str = DEFAULT_SETTINGS["about_office_photo_url"]
    home_showreel_poster_url: str = DEFAULT_SETTINGS["home_showreel_poster_url"]
    typography_heading_font: str = DEFAULT_SETTINGS["typography_heading_font"]
    typography_body_font: str = DEFAULT_SETTINGS["typography_body_font"]
    typography_base_size: str = DEFAULT_SETTINGS["typography_base_size"]
    typography_heading_color: str = DEFAULT_SETTINGS["typography_heading_color"]
    typography_body_color: str = DEFAULT_SETTINGS["typography_body_color"]
    typography_link_color: str = DEFAULT_SETTINGS["typography_link_color"]


@api_router.get("/settings")
async def get_settings():
    doc = await db.site_settings.find_one({"id": "singleton"}, {"_id": 0})
    merged = dict(DEFAULT_SETTINGS)
    if doc:
        doc.pop("id", None)
        merged.update({k: v for k, v in doc.items() if v})
    return merged


@api_router.get("/admin/settings")
async def admin_get_settings(user: dict = Depends(get_current_user)):
    doc = await db.site_settings.find_one({"id": "singleton"}, {"_id": 0})
    merged = dict(DEFAULT_SETTINGS)
    if doc:
        doc.pop("id", None)
        merged.update(doc)
    return merged


@api_router.put("/admin/settings")
async def admin_update_settings(body: SiteSettingsIn, user: dict = Depends(get_current_user)):
    data = body.model_dump()
    data["id"] = "singleton"
    data["updated_at"] = datetime.now(timezone.utc).isoformat()
    await db.site_settings.update_one({"id": "singleton"}, {"$set": data}, upsert=True)
    data.pop("id", None)
    return data


# ---------- Maturity Quiz ----------

class MaturityIn(BaseModel):
    name: str
    email: EmailStr
    score: int
    grade: str
    weakest: List[str] = []


@api_router.post("/maturity-report")
async def maturity_report(body: MaturityIn, request: Request):
    email = body.email.lower()
    await db.leads.insert_one({
        "id": uuid.uuid4().hex,
        "name": body.name,
        "email": email,
        "company": "",
        "service": "Marketing Maturity Assessment",
        "budget": "",
        "timeline": "",
        "message": f"Scored {body.score}/16 (Grade {body.grade}). Weakest areas: {', '.join(body.weakest) or '-'}",
        "source": "maturity-quiz",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    if not await db.subscribers.find_one({"email": email}):
        await db.subscribers.insert_one({"id": uuid.uuid4().hex, "email": email, "created_at": datetime.now(timezone.utc).isoformat()})
    weakest_html = "".join(f"<li style='margin-bottom:8px;'>{w}</li>" for w in body.weakest) or "<li>None - strong across the board.</li>"
    unsubscribe_url = f"{api_base_url(request)}/api/newsletter/unsubscribe?email={quote(email)}"
    html = email_shell(
        f"Your Marketing Maturity Grade: {body.grade}",
        f"""<p>You scored <strong>{body.score}/16</strong> - Grade <strong style="color:#E0923D;">{body.grade}</strong>.</p>
        <p>Your three biggest opportunities:</p>
        <ul style="padding-left:18px;">{weakest_html}</ul>
        <p style="color:#8a8a8a;">The fastest way to fix them? A Diagnostic Audit - a 1–2 week deep-dive with a prioritised fix-list. Book a free call at markendrick.com to discuss your result.</p>""",
        unsubscribe_url=unsubscribe_url,
    )
    await send_email(email, f"Your Marketing Maturity Report - Grade {body.grade}", html)
    owner_html = email_shell(
        "Maturity quiz completed",
        f"<p><strong>{body.name}</strong> ({email}) scored <strong>{body.score}/16</strong> - Grade <strong>{body.grade}</strong>.<br/>Weakest: {', '.join(body.weakest) or '-'}</p>",
    )
    await send_email(OWNER_EMAIL, f"Maturity lead: {body.name} - Grade {body.grade}", owner_html, reply_to=email)
    return {"status": "sent"}


# ---------- Newsletter (The Signal) ----------

class NewsletterSendIn(BaseModel):
    post_id: str


@api_router.post("/admin/newsletter/send")
async def admin_send_newsletter(body: NewsletterSendIn, request: Request, user: dict = Depends(get_current_user)):
    post = await db.posts.find_one({"id": body.post_id}, {"_id": 0})
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    subs = await db.subscribers.find({}, {"_id": 0, "email": 1}).to_list(10000)
    if not subs:
        raise HTTPException(status_code=400, detail="No subscribers yet")
    frontend = os.environ.get("FRONTEND_URL", "").rstrip("/")
    url = f"{frontend}/insights/{post['slug']}"
    base = api_base_url(request)
    sent = 0
    for s in subs:
        unsubscribe_url = f"{base}/api/newsletter/unsubscribe?email={quote(s['email'])}"
        html = email_shell(
            post["title"],
            f"""<p>{post.get('excerpt', '')}</p>
            <p style="margin:24px 0;"><a href="{url}" style="background:#E0923D;color:#ffffff;padding:12px 28px;text-decoration:none;font-weight:bold;border-radius:999px;">Read the full article</a></p>
            <p style="color:#8a8a8a;font-size:13px;">{post.get('category', '')} · {post.get('read_time', '')} · by {post.get('author', 'MarKendrick')}</p>""",
            unsubscribe_url=unsubscribe_url,
        )
        result = await send_email(s["email"], f"The Signal: {post['title']}", html)
        if result:
            sent += 1
    await db.newsletter_log.insert_one({
        "id": uuid.uuid4().hex,
        "post_id": post["id"],
        "post_title": post["title"],
        "sent_count": sent,
        "total_subscribers": len(subs),
        "sent_at": datetime.now(timezone.utc).isoformat(),
        "sent_by": user["email"],
    })
    return {"status": "sent", "sent": sent, "total": len(subs)}


@api_router.get("/admin/newsletter/log")
async def admin_newsletter_log(user: dict = Depends(get_current_user)):
    return await db.newsletter_log.find({}, {"_id": 0}).sort("sent_at", -1).to_list(100)


# ---------- Sitemap ----------

SITEMAP_STATIC = [
    "/", "/about", "/services", "/industries", "/work", "/insights", "/contact",
    "/book-consultation", "/faq", "/quiz", "/whitepapers", "/roi-calculator", "/maturity-quiz",
    "/privacy-policy", "/terms-of-service", "/cookie-policy",
]
SITEMAP_SERVICES = [
    "market-research", "consumer-behaviour-insights", "neuromarketing", "digital-marketing",
    "seo", "sem-ppc", "social-media-marketing", "content-marketing", "advertising",
    "branding-identity", "sales-decline-diagnosis", "mystery-shopping",
    "marketing-strategy-consulting", "performance-marketing", "influencer-marketing",
    "email-marketing-automation", "marketing-analytics-reporting", "b2b-marketing", "ecommerce-marketing",
]
SITEMAP_INDUSTRIES = [
    "real-estate-property-development", "education-edtech", "finance-banking-fintech",
    "ecommerce-d2c-retail", "healthcare-pharmaceuticals", "textile-apparel-fashion",
    "food-beverage-restaurants", "automotive-auto-services", "travel-tourism-hospitality",
    "it-software-tech-startups", "fmcg-consumer-goods", "weddings-events-entertainment",
    "ngos-development-sector",
]
SITEMAP_LOCATIONS = [
    "marketing-agency-lahore", "marketing-agency-pakistan", "middle-east",
    "united-kingdom", "united-states", "europe",
]


@api_router.get("/sitemap.xml")
async def sitemap():
    from fastapi.responses import Response
    base = os.environ.get("FRONTEND_URL", "").rstrip("/")
    urls = list(SITEMAP_STATIC)
    urls += [f"/services/{s}" for s in SITEMAP_SERVICES]
    urls += [f"/industries/{s}" for s in SITEMAP_INDUSTRIES]
    urls += [f"/locations/{s}" for s in SITEMAP_LOCATIONS]
    posts = await db.posts.find({"published": True}, {"_id": 0, "slug": 1, "updated_at": 1}).to_list(500)
    studies = await db.case_studies.find({"published": True}, {"_id": 0, "slug": 1}).to_list(200)
    urls += [f"/insights/{p['slug']}" for p in posts]
    urls += [f"/work/{c['slug']}" for c in studies]
    today = datetime.now(timezone.utc).date().isoformat()
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        priority = "1.0" if u == "/" else ("0.8" if u.count("/") <= 1 else "0.6")
        xml += f"  <url><loc>{base}{u}</loc><lastmod>{today}</lastmod><priority>{priority}</priority></url>\n"
    xml += "</urlset>"
    return Response(content=xml, media_type="application/xml")


# ---------- Seed ----------

SEED_COVERS = [
    "https://images.unsplash.com/photo-1674027444485-cec3da58eef4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDR8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMG5ldXJhbCUyMG5ldHdvcmslMjBicmFpbiUyMGRhdGF8ZW58MHx8fHwxNzg2MjE4Mzg3fDA&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1608222351212-18fe0ec7b13b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1NzV8MHwxfHNlYXJjaHwyfHxwcmVtaXVtJTIwbWFya2V0aW5nJTIwYW5hbHl0aWNzJTIwZGFzaGJvYXJkfGVufDB8fHx8MTc4NjIxODM4N3ww&ixlib=rb-4.1.0&q=85",
    "https://images.unsplash.com/photo-1572021335469-31706a17aaef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2ODh8MHwxfHNlYXJjaHwzfHxtb2Rlcm4lMjBjcmVhdGl2ZSUyMGFnZW5jeSUyMG9mZmljZSUyMHBlb3BsZXxlbnwwfHx8fDE3ODYyMTgzODd8MA&ixlib=rb-4.1.0&q=85",
]

SEED_POSTS = [
    {
        "title": "Why Most Market Research Fails Before It Begins",
        "category": "Research",
        "excerpt": "Bad questions produce confident, wrong answers. The failure point of most research is not the sample size - it is the brief.",
        "body": "Every year, brands commission studies that cost six figures and change nothing. The deck arrives, the room nods, and the strategy stays exactly where it was. The failure rarely happens in the fieldwork. It happens in the first meeting, when nobody asks what decision this research is supposed to make.\n\nResearch that performs starts from the decision, not the questionnaire. If the answer cannot change your pricing, your positioning or your media plan, you are buying expensive reassurance. At MarKendrick we write the decision statement before we write a single question: 'If we learn X, we will do Y.'\n\nThe second failure point is asking people what they will do. Humans are terrible predictors of their own behaviour. Stated intent overstates purchase by 30 to 60 percent in most categories. Behavioural observation, in-context interviews and implicit testing consistently outperform the focus group monologue.\n\nThird: sampling theatre. A perfectly balanced national sample means little if your category is driven by 12 percent of buyers. Heavy buyers, lapsed buyers and rejectors each need their own lens - averaging them into one 'consumer' erases the signal you paid to find.\n\nThe fix is unglamorous: sharper briefs, behavioural methods, and analysis that ends in a recommendation, not a chart. Insight is not what people said. It is what you now know that your competitor does not.",
        "author": "Ayesha Rahman",
        "tags": ["market research", "methodology", "consumer insight"],
        "read_time": "6 min read",
    },
    {
        "title": "The Neuromarketing Playbook for FMCG Brands",
        "category": "Research",
        "excerpt": "Shelf decisions happen in under two seconds, mostly below conscious awareness. Here is how to design for the brain that is actually shopping.",
        "body": "The average supermarket carries 30,000 SKUs. Your shopper is not comparing them - their brain is filtering them, using shortcuts built long before your brand existed. Neuromarketing is the discipline of designing for those shortcuts instead of against them.\n\nStart with attention. Eye-tracking studies show that pack placement within the first visual sweep - roughly the top-left to centre path on a shelf - captures 70 percent of initial fixations. If your packaging blends into category codes, you are paying shelf fees to be invisible.\n\nSecond, fluency beats novelty at shelf. The brain rewards what it can process quickly. Familiar structures with one distinctive disruption - a colour break, a shape, a face - outperform radical redesigns in almost every repeat-purchase category. Revolution is for launch campaigns; evolution is for packs.\n\nThird, price is a perception, not a number. Anchoring, decoy options and unit framing routinely move willingness-to-pay by double digits without changing the product at all. We have watched a premium tier lift total category revenue simply by making the mid tier feel sensible.\n\nThe playbook: measure attention before recall, test packs in shelf context not isolation, and treat every touchpoint as a nudge. The subconscious is not a mystery to fear. It is a design brief.",
        "author": "Marcus Wynne",
        "tags": ["neuromarketing", "FMCG", "packaging", "behavioural science"],
        "read_time": "7 min read",
    },
    {
        "title": "Performance Marketing in 2026: Signal Over Noise",
        "category": "Trends",
        "excerpt": "Privacy shifts killed lazy targeting. The winners now compete on creative velocity, first-party data and measurement discipline.",
        "body": "The golden age of duct-taped attribution is over. Between signal loss, consent frameworks and platform black boxes, the media buyer who wins in 2026 is not the one with the cleverest audience hack - it is the one with the strongest inputs.\n\nInput one: creative. Platforms now optimise delivery better than any human. What they cannot do is make people care. Accounts running 15 to 20 creative variants per month consistently see 25 to 40 percent lower CPAs than accounts resting three ads per quarter. Creative is the new targeting.\n\nInput two: first-party data. Your CRM, your purchase history, your churned users - this is the fuel algorithms learn from. Brands feeding clean conversion signals back into platforms outperform those optimising toward a pixel by every meaningful margin.\n\nInput three: measurement you can defend. Last-click flatters the bottom of the funnel and starves the top. Triangulate: platform reporting for direction, geo-experiments for truth, and a simple MMM for budget allocation. Perfect attribution is dead; confident incrementality is the replacement.\n\nThe agencies still selling dashboard screenshots are selling noise. Performance in 2026 is a system: signal in, creative out, incrementality checked. Build the system and the platforms work for you.",
        "author": "Sana Qureshi",
        "tags": ["performance marketing", "paid media", "measurement"],
        "read_time": "5 min read",
    },
    {
        "title": "The Founder's Guide to Brand Positioning",
        "category": "Guides",
        "excerpt": "Positioning is not your tagline. It is the single decision about who you are for and why you win - and it compounds like capital.",
        "body": "Ask ten founders what their positioning is and eight will recite their mission statement. Mission is what you tell yourself. Positioning is what the market believes when you are not in the room.\n\nA working positioning answers three questions in plain language: Who is this for, specifically? What do they use it for? Why you instead of the alternative - including the alternative of doing nothing? If any answer is 'everyone', 'everything' or 'because we care more', you have a slogan, not a position.\n\nThe test we run with clients is brutal and simple: the enemy test. Strong positioning has a visible enemy - the bloated incumbent, the spreadsheet workflow, the category's dirty secret. If no one would ever disagree with your positioning, it carries no information.\n\nPositioning also compounds. Every campaign, sales deck and product decision either reinforces the position or spends it. Brands that hold one position for three years build memory structures; brands that reposition every quarter rent attention.\n\nStart with the segment you can dominate, not the market you dream of. Own a narrow hill completely. Expansion is a strategy; dilution is a panic.",
        "author": "Ayesha Rahman",
        "tags": ["positioning", "brand strategy", "founders"],
        "read_time": "6 min read",
    },
    {
        "title": "Diagnosing a Sales Decline: A 5-Step Framework",
        "category": "Strategy",
        "excerpt": "When revenue slides, teams cut spend or blame the market. The right first move is a structured diagnosis, not a reaction.",
        "body": "Sales declines are medical, not moral. Panic cost-cutting and motivational off-sites treat the mood; they do not treat the cause. Here is the framework we run before recommending a single rupee of spend.\n\nStep one: decompose the number. Revenue is traffic times conversion times value. A 20 percent decline with stable traffic is a conversion problem. Stable conversion with falling traffic is a distribution problem. The decomposition tells you which building to enter.\n\nStep two: segment the fall. Aggregate curves hide the truth. Is the decline uniform, or concentrated in one region, channel or cohort? Most 'company-wide' declines are one broken engine dragging the average.\n\nStep three: listen to the market, not the meeting. Win-loss interviews, review mining, sales call recordings. When we ran this for a retail client, the board believed price was the issue; the calls said availability. The shelf was empty, not the wallet.\n\nStep four: stress-test the basics - pricing integrity, distribution coverage, share of search. Boring metrics, but declines are boring problems wearing dramatic costumes.\n\nStep five: one hypothesis, one intervention, one measurement window. Recovery plans with twelve initiatives credit nothing and teach less. Diagnose narrowly, act decisively, measure honestly.",
        "author": "Marcus Wynne",
        "tags": ["sales recovery", "diagnosis", "strategy"],
        "read_time": "6 min read",
    },
    {
        "title": "Consumer Behaviour Shifts Reshaping South Asian Retail",
        "category": "Trends",
        "excerpt": "From sachet economics to social commerce, five structural shifts every brand selling in South Asia must design for.",
        "body": "South Asia is not one market, but its shoppers are moving in shared directions. Five shifts keep surfacing in our fieldwork across Pakistan and the wider region.\n\nOne: the basket is fragmenting. Households are trading bulk trips for frequent small baskets, pressuring pack architecture. Brands that win own the small-format occasion instead of discounting the big one.\n\nTwo: discovery has moved to the feed. For under-35 urban shoppers, the first aisle is TikTok and Instagram, not the shelf. The implication is not 'do social media' - it is that packaging and point-of-sale must now photograph well enough to survive a repost.\n\nThree: trust is the real currency. Counterfeits and inconsistent quality have made verification behaviour routine - checking seals, asking the shopkeeper, scanning QR codes. Visible quality signals convert better than claims.\n\nFour: social commerce is infrastructure. WhatsApp ordering and COD logistics are not a workaround; for millions of shoppers they are the preferred channel. Meeting that behaviour beats trying to retrain it.\n\nFive: value is being redefined. Shoppers are not buying the cheapest option; they are buying the option that best justifies its price to the household. Brands that arm buyers with that justification - per-use cost, durability, status - defend margin.\n\nThe brands that treat these as structural, not seasonal, will take the decade.",
        "author": "Sana Qureshi",
        "tags": ["consumer behaviour", "South Asia", "retail"],
        "read_time": "7 min read",
    },
]

SEED_CASE_STUDIES = [
    {
        "client": "Velora Beauty",
        "title": "Turning a leaking ad account into a 212% ROAS engine",
        "industry": "E-commerce",
        "services": ["Performance Marketing", "Marketing Analytics"],
        "summary": "A direct-to-consumer skincare brand was scaling spend and shrinking profit. We rebuilt creative, feed signals and measurement - and made every rupee accountable.",
        "challenge": "Velora Beauty had grown fast on paid social, but by the time they reached us, CAC had doubled in nine months and the founder could no longer tell which campaigns were actually profitable. Attribution disagreed with the bank account.",
        "approach": "We ran a full-funnel audit, killed 60 percent of legacy campaigns, and rebuilt the account around creative velocity: 18 new ad concepts per month, structured testing, and server-side conversion signals fed back to the platforms. A simple incrementality framework replaced last-click dashboards, and landing pages were rebuilt around the objections we mined from reviews.",
        "results": [
            {"metric": "+212%", "label": "Return on ad spend in 6 months"},
            {"metric": "-38%", "label": "Customer acquisition cost"},
            {"metric": "3.1x", "label": "Creative testing velocity"},
        ],
        "quote": "For the first time, our marketing numbers and our bank statement tell the same story.",
        "quote_author": "Founder, Velora Beauty",
        "cover": SEED_COVERS[1],
    },
    {
        "client": "NimbusPay",
        "title": "Building a B2B pipeline engine for a fintech challenger",
        "industry": "SaaS / Fintech",
        "services": ["B2B Marketing", "Content Marketing", "Marketing Strategy"],
        "summary": "A payments startup with a great product and an empty funnel. Twelve months later: a compounding pipeline machine the sales team actually trusts.",
        "challenge": "NimbusPay's sales team was closing everything marketing produced - the problem was that marketing produced almost nothing. No defined ICP, no content engine, and paid spend scattered across five channels with no shared definition of a qualified lead.",
        "approach": "We started with win-loss research to sharpen the ICP down to two verticals, then built a narrative: the hidden cost of payment friction for mid-market finance teams. Around that narrative we launched a monthly insight report, targeted LinkedIn and search programs, and a lead-scoring model agreed jointly with sales - so 'qualified' finally meant the same thing to everyone.",
        "results": [
            {"metric": "3.4x", "label": "Qualified pipeline in 12 months"},
            {"metric": "-47%", "label": "Cost per qualified opportunity"},
            {"metric": "62%", "label": "Of pipeline from owned content"},
        ],
        "quote": "Marketing stopped being a cost centre debate. It is now the first slide in our board deck.",
        "quote_author": "CEO, NimbusPay",
        "cover": SEED_COVERS[0],
    },
    {
        "client": "Khaas Foods",
        "title": "Repositioning a heritage FMCG brand for a new generation",
        "industry": "FMCG",
        "services": ["Branding & Identity", "Neuromarketing", "Market Research"],
        "summary": "A beloved food brand was ageing with its audience. Behavioural research and a shelf-first redesign brought a new generation to the table - without losing the old one.",
        "challenge": "Khaas Foods owned the hearts of buyers over 45 and was invisible to buyers under 30. Category share was eroding a point a year, and a previous rebrand attempt had spooked loyalists. The brief: modernise without detonating brand equity.",
        "approach": "We mapped the brand's memory structures through implicit association testing, identified which assets were untouchable (the name device, the red) and which were invisible (everything else). Shelf-context eye-tracking drove an evolutionary pack redesign, and a new campaign rebuilt the brand's story around the modern family table rather than nostalgia alone.",
        "results": [
            {"metric": "+61%", "label": "Unaided brand recall, under-30 segment"},
            {"metric": "+27%", "label": "Value share in two quarters"},
            {"metric": "2 sec", "label": "Shelf identification time, down from 4.5"},
        ],
        "quote": "They protected what our customers loved and fixed what shoppers never saw.",
        "quote_author": "CMO, Khaas Foods",
        "cover": SEED_COVERS[2],
    },
]


SEED_TESTIMONIALS = [
    {
        "quote": "For the first time, our marketing numbers and our bank statement tell the same story. MarKendrick found the leaks in our ad account within two weeks - and fixed them.",
        "name": "Maira Siddiqui",
        "role": "Founder",
        "company": "Velora Beauty",
        "industry": "E-commerce",
        "metric": "+212% ROAS in 6 months",
    },
    {
        "quote": "Marketing stopped being a cost-centre debate in our board meetings. It is now the first slide in our deck. The pipeline engine they built keeps compounding.",
        "name": "Hamza Qureshi",
        "role": "CEO",
        "company": "NimbusPay",
        "industry": "Fintech",
        "metric": "3.4x qualified pipeline",
    },
    {
        "quote": "They protected what our customers loved and fixed what shoppers never saw. Our under-30 buyers are finally growing - and our loyalists never noticed a disruption.",
        "name": "Rabia Chaudhry",
        "role": "Chief Marketing Officer",
        "company": "Khaas Foods",
        "industry": "FMCG",
        "metric": "+61% unaided recall",
    },
]

async def seed_admin():
    admin_email = os.environ.get("ADMIN_EMAIL", "admin@example.com").lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "id": uuid.uuid4().hex,
            "email": admin_email,
            "password_hash": hash_password(admin_password),
            "name": "MarKendrick Admin",
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Seeded admin user %s", admin_email)
    elif not verify_password(admin_password, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_password)}})
        logger.info("Updated admin password hash")


async def seed_content():
    if await db.posts.count_documents({}) == 0:
        now = datetime.now(timezone.utc)
        for i, p in enumerate(SEED_POSTS):
            doc = dict(p)
            doc["id"] = uuid.uuid4().hex
            doc["slug"] = slugify(p["title"])
            doc["cover"] = SEED_COVERS[i % len(SEED_COVERS)]
            doc["published"] = True
            doc["created_at"] = (now - timedelta(days=(len(SEED_POSTS) - i) * 9)).isoformat()
            doc["updated_at"] = doc["created_at"]
            await db.posts.insert_one(doc)
        logger.info("Seeded %d posts", len(SEED_POSTS))
    if await db.case_studies.count_documents({}) == 0:
        now = datetime.now(timezone.utc)
        for i, cs in enumerate(SEED_CASE_STUDIES):
            doc = dict(cs)
            doc["id"] = uuid.uuid4().hex
            doc["slug"] = slugify(f"{cs['client']}-{cs['title']}")
            doc["published"] = True
            doc["created_at"] = (now - timedelta(days=(len(SEED_CASE_STUDIES) - i) * 21)).isoformat()
            await db.case_studies.insert_one(doc)
        logger.info("Seeded %d case studies", len(SEED_CASE_STUDIES))
    if await db.whitepapers.count_documents({}) == 0:
        frontend = os.environ.get("FRONTEND_URL", "").rstrip("/")
        for w in SEED_WHITEPAPERS:
            doc = {k: v for k, v in w.items() if k != "file"}
            doc["file_url"] = f"{frontend}/media/{w['file']}"
            doc["stored_file"] = None
            doc["published"] = True
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.whitepapers.insert_one(doc)
        logger.info("Seeded %d whitepapers", len(SEED_WHITEPAPERS))
    if await db.testimonials.count_documents({}) == 0:
        for t in SEED_TESTIMONIALS:
            doc = dict(t)
            doc["id"] = uuid.uuid4().hex[:12]
            doc["video_url"] = ""
            doc["published"] = True
            doc["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.testimonials.insert_one(doc)
        logger.info("Seeded %d testimonials", len(SEED_TESTIMONIALS))
    if await db.services.count_documents({}) == 0:
        items = load_seed_json("services")
        if items:
            for it in items:
                it["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.services.insert_many(items)
            logger.info("Seeded %d services", len(items))
    if await db.industries.count_documents({}) == 0:
        items = load_seed_json("industries")
        if items:
            for it in items:
                it["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.industries.insert_many(items)
            logger.info("Seeded %d industries", len(items))
    if await db.locations.count_documents({}) == 0:
        items = load_seed_json("locations")
        if items:
            for it in items:
                it["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.locations.insert_many(items)
            logger.info("Seeded %d locations", len(items))
    if await db.faqs.count_documents({}) == 0:
        items = load_seed_json("faqs")
        if items:
            for it in items:
                it["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.faqs.insert_many(items)
            logger.info("Seeded %d faqs", len(items))
    if await db.legal_pages.count_documents({}) == 0:
        items = load_seed_json("legal")
        if items:
            for it in items:
                it["created_at"] = datetime.now(timezone.utc).isoformat()
            await db.legal_pages.insert_many(items)
            logger.info("Seeded %d legal pages", len(items))


def _strip_em_dashes(value):
    """Recursively replace em dashes ('—') with plain hyphens in strings,
    lists and dicts, leaving every other value untouched."""
    if isinstance(value, str):
        return value.replace("—", "-")
    if isinstance(value, list):
        return [_strip_em_dashes(v) for v in value]
    if isinstance(value, dict):
        return {k: _strip_em_dashes(v) for k, v in value.items()}
    return value


async def migrate_em_dashes():
    """One-time (idempotent, safe to re-run) content fix: replace every
    em dash already stored in the database with a plain hyphen, across all
    text-bearing collections. Source/seed files were already fixed in code;
    this covers content inserted before that fix, or edited later via the
    admin CMS."""
    collections = [
        "posts", "case_studies", "testimonials", "services", "industries",
        "locations", "faqs", "legal_pages", "whitepapers", "site_settings",
    ]
    updated = 0
    for name in collections:
        coll = db[name]
        async for doc in coll.find({}):
            _id = doc.pop("_id", None)
            new_doc = _strip_em_dashes(doc)
            if new_doc != doc:
                await coll.update_one({"_id": _id}, {"$set": new_doc})
                updated += 1
    if updated:
        logger.info("Em-dash migration: cleaned %d document(s)", updated)


LOCATION_CONTENT_V1 = {
    "marketing-agency-lahore": {
        "intro": "If you have searched for a 'digital marketing agency in Lahore' or a 'branding agency near Gulberg', you have probably found a long list of agencies promising the same three things: reels, reach and 'growth'. MarKendrick is different by design. We are headquartered in Gulberg III, and this city is our laboratory - every research method, positioning framework and performance model we sell to clients from Dubai to Chicago was pressure-tested first against Lahore's shoppers, its noisiest bazaars and its fastest-moving feeds. We work with retail brands on MM Alam Road, textile exporters near Sundar Industrial Estate, restaurant groups scaling past their first three outlets, and D2C founders shipping out of DHA warehouses - businesses that need evidence before spend, not vibes.",
        "body2": "Most Lahore businesses hire a second or third marketing agency, not a first - usually because the last one could not explain why a campaign worked or didn't. We start every engagement with a Diagnostic Audit: a structured look at your positioning, your funnel and your actual buyer behaviour, delivered by senior consultants who sit fifteen minutes from your office, not a WhatsApp group managed by a fresh graduate. From there we build whatever the diagnosis calls for - SEO and content, performance media, brand identity, or full-funnel demand generation - with the same discipline whether the client is a Liberty Market retailer or a Karachi-headquartered enterprise using our Lahore team.",
        "points": [
            "Face-to-face strategy sessions at our Gulberg III studio - no relationship managed entirely over WhatsApp",
            "Deep networks across Lahore's retail, media, production and influencer landscape",
            "Mystery shopping and field research executed city-wide, from Liberty to DHA Phase 6",
            "SEO, branding and performance marketing under one senior team, not outsourced to freelancers",
            "Diagnostic Audits from PKR 60,000, with findings delivered in 1-2 weeks",
        ],
        "metaTitle": "Digital Marketing Agency in Lahore | Gulberg III - MarKendrick",
        "metaDesc": "Lahore's research-led digital marketing agency, based in Gulberg III. Diagnostic audits, SEO, branding and performance marketing. Book a free consultation.",
    },
    "marketing-agency-pakistan": {
        "intro": "Businesses searching for a 'marketing agency in Pakistan' are usually trying to solve a specific problem: their current setup only understands one city. A Lahore-only agency misreads Karachi's price sensitivity. A Karachi agency underestimates how relationship-driven Peshawar and Multan buying decisions are. We built MarKendrick to work across all of them, because the research discipline we apply does not change by postcode - only the findings do. From Karachi's corporate towers and DHA retail belt, to Islamabad's startup and embassy-adjacent audiences, to Faisalabad and Sialkot's export-driven textile houses, we run the same structured process: understand the buyer before we touch the budget.",
        "body2": "Delivery is remote-first with on-ground research capability, so a brand in Multan gets the same senior strategist and the same rigour as a client fifteen minutes from our Gulberg office. We run bilingual Urdu and English campaigns, because most Pakistani purchase decisions happen in a mix of both, and a campaign that only sounds right in English usually underperforms outside the metro core. Whether you need a national FMCG launch, a fintech's first paid-acquisition engine, or a textile exporter's LinkedIn presence rebuilt for international buyers, we plan media and messaging city by city, not as one undifferentiated 'Pakistan' campaign.",
        "points": [
            "Field research and mystery shopping across Karachi, Lahore, Islamabad, Faisalabad and beyond",
            "Bilingual Urdu and English campaign planning and copywriting",
            "National media relationships across TV, print, outdoor and digital",
            "City-by-city media planning instead of one blanket national campaign",
            "Monthly retainers from PKR 150,000, with no long lock-in contracts",
        ],
        "metaTitle": "Marketing Agency in Pakistan | Karachi, Lahore & Islamabad - MarKendrick",
        "metaDesc": "A research-led marketing agency serving Karachi, Lahore, Islamabad and all of Pakistan. Strategy, branding, digital and performance marketing.",
    },
    "middle-east": {
        "intro": "Brands searching for a 'marketing agency in Dubai' or a 'GCC marketing agency' are often really looking for something Dubai's saturated, expensive market makes hard to find: senior strategists who will actually own the thinking, at a price that does not eat half the media budget. The Gulf's consumers are among the most researched in the world - and, because of that saturation, among the most fatigued by generic campaigns. We help brands across the UAE, Saudi Arabia and the wider GCC build consumer insight, brand strategy and performance campaigns that respect how differently a Riyadh household and a Dubai expat household actually decide to buy.",
        "body2": "Our Lahore base is not a limitation for Gulf clients, it is the advantage: a senior, insight-led team at a fraction of typical Dubai or Riyadh agency rates, with a timezone overlap tight enough that same-day collaboration is normal, not a stretch. We plan around Ramadan and regional seasonal spikes as a default, not an afterthought, and every brand engagement includes cultural fluency review before anything ships in Arabic-market work, so messaging that tests well in a deck does not misfire in market.",
        "points": [
            "Consumer research and message testing across UAE, Saudi Arabia and wider GCC markets",
            "Ramadan and regional seasonal campaign planning built in from day one",
            "Arabic-market cultural fluency review on every piece of brand and campaign work",
            "Timezone-aligned delivery with Gulf-hours availability for reviews and approvals",
            "Senior strategist access at a fraction of typical Dubai or Riyadh agency rates",
        ],
        "metaTitle": "Marketing Agency for the Middle East | UAE & GCC - MarKendrick",
        "metaDesc": "Research-led marketing for UAE, Saudi and GCC brands: consumer insight, brand strategy and performance campaigns from MarKendrick.",
    },
    "united-kingdom": {
        "intro": "UK businesses searching for a 'marketing agency for UK brands' or comparing offshore options are usually weighing the same trade-off: can a partner outside the UK actually understand a British buyer, or will it just be cheaper and worse? We built MarKendrick to remove that trade-off. UK clients get a research-led partner that thinks in evidence, not opinion: insight studies, brand strategy, SEO and performance programs run by senior strategists who have studied UK search behaviour and buying psychology directly, not junior account handlers reading a template.",
        "body2": "We work UK-hours overlap as standard, report in the formats UK marketing and finance teams expect, and price in a way that makes an incumbent agency's retainer difficult to defend once you have seen the comparison. Most UK boutique agencies do not have in-house research or neuromarketing capability - we do, and it changes how confidently a campaign can be greenlit before spend goes live. For SEO specifically, competitive UK search results reward exactly the kind of structured, evidence-first content strategy that is our starting point on every engagement, not an add-on.",
        "points": [
            "UK-hours collaboration with weekly, senior-led reporting - not a monthly PDF",
            "SEO and content programs built for competitive UK search results",
            "In-house research and neuromarketing capability most UK boutique agencies lack",
            "Senior strategist access, typically 40-60% below comparable UK agency fees",
            "Transparent, evidence-based reporting your UK finance team will actually trust",
        ],
        "metaTitle": "Marketing Agency for UK Brands | Offshore Senior Strategy - MarKendrick",
        "metaDesc": "Research-led marketing partner for UK businesses: insight, brand strategy, SEO and performance marketing at offshore economics.",
    },
    "united-states": {
        "intro": "US founders and marketing leads searching for an 'offshore marketing agency' or a fractional-CMO alternative are usually past the point of wanting more freelancers. They want senior thinking without a senior agency's overhead. That is exactly the gap MarKendrick fills: market research, positioning, B2B pipeline programs and performance marketing delivered by a team that treats a client's budget like its own, because in a market where every dollar of CAC gets scrutinised, sloppy spend is the fastest way to lose a client.",
        "body2": "The timezone gap between Lahore and the US is not a problem we work around, it is a feature we use: async-friendly delivery with structured weekly syncs means research runs, campaigns get built and reporting gets prepared while a US team sleeps, so Monday morning starts with decisions ready to make instead of a backlog to review. For funded startups, that means positioning and messaging sprints that move at startup speed. For established B2B brands, it means ABM and pipeline programs measured on revenue influence, not vanity reach.",
        "points": [
            "B2B pipeline and account-based marketing programs built for US sales cycles",
            "Positioning and messaging sprints for funded startups moving at speed",
            "Performance marketing measured with incrementality-first testing, not last-click vanity metrics",
            "Async-friendly delivery - work progresses overnight, ready for Monday morning review",
            "Senior strategist access without US agency-market overhead pricing",
        ],
        "metaTitle": "Marketing Agency for US Brands | Offshore Senior Strategy - MarKendrick",
        "metaDesc": "Offshore, senior-led marketing for US startups and brands: research, positioning, B2B pipeline and performance marketing.",
    },
    "europe": {
        "intro": "European brands searching for a marketing partner outside their home market are usually balancing two concerns most agencies handle badly: genuine language and cultural fluency, and strict data compliance. MarKendrick treats both as non-negotiable, not a checkbox. We deliver insight studies, brand strategy and digital campaigns for European markets with GDPR-aware data practices built into research design from the first questionnaire, and the cultural sensitivity that multilingual, multi-market European audiences actually require - because a campaign that works in Berlin rarely translates directly to Madrid or Milan.",
        "body2": "From D2C brands scaling out of Germany to hospitality groups across Spain and Italy, we bring the same diagnostic method to every engagement, adapted to the target market's language, regulatory environment and buyer psychology rather than a single template stretched across borders. Consent-first campaign design, CET-friendly collaboration hours, and researchers who can run and interpret studies across multiple European languages mean the insight you get is genuinely local, even when the team producing it is not sitting in the same city as your customers.",
        "points": [
            "GDPR-compliant data handling and consent-first campaign design from the first brief",
            "Multi-market consumer research capability across major European languages",
            "Brand and content work adapted per market, not stretched across one template",
            "CET-friendly collaboration hours for smooth day-to-day project management",
            "Diagnostic method adapted to each market's regulatory environment and buyer psychology",
        ],
        "metaTitle": "Marketing Agency for Europe | GDPR-Aware Strategy - MarKendrick",
        "metaDesc": "GDPR-aware, research-led marketing for European brands: insight, brand strategy and digital campaigns from MarKendrick.",
    },
}


async def expand_location_content():
    """One-time migration: replaces thin (sub-120-word) location page copy with
    substantially expanded, keyword-researched content. Guarded by a marker in
    the migrations collection so it runs exactly once and never overwrites
    content an admin edits later via the CMS."""
    marker = await db.migrations.find_one({"_id": "expand_location_content_v1"})
    if marker:
        return
    updated = 0
    for slug, content in LOCATION_CONTENT_V1.items():
        result = await db.locations.update_one({"slug": slug}, {"$set": content})
        if result.matched_count:
            updated += 1
    await db.migrations.insert_one({"_id": "expand_location_content_v1", "applied_at": datetime.now(timezone.utc).isoformat(), "updated": updated})
    if updated:
        logger.info("Location content expansion: updated %d document(s)", updated)


async def expand_industry_content():
    """One-time migration: replaces thin industry page copy with expanded,
    keyword-researched intro/challenges content from seed_data/industries.json.
    Guarded the same way as expand_location_content - runs once, never
    clobbers later admin CMS edits."""
    marker = await db.migrations.find_one({"_id": "expand_industry_content_v1"})
    if marker:
        return
    path = SEED_DATA_DIR / "industries.json"
    if not path.exists():
        return
    with open(path) as f:
        industries = json.load(f)
    updated = 0
    for ind in industries:
        content = {
            "intro": ind.get("intro", ""),
            "challenges": ind.get("challenges", []),
            "metaTitle": ind.get("metaTitle", ""),
            "metaDesc": ind.get("metaDesc", ""),
        }
        result = await db.industries.update_one({"slug": ind["slug"]}, {"$set": content})
        if result.matched_count:
            updated += 1
    await db.migrations.insert_one({"_id": "expand_industry_content_v1", "applied_at": datetime.now(timezone.utc).isoformat(), "updated": updated})
    if updated:
        logger.info("Industry content expansion: updated %d document(s)", updated)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.login_attempts.create_index("identifier")
    await db.posts.create_index("slug", unique=True)
    await db.case_studies.create_index("slug", unique=True)
    await db.services.create_index("slug", unique=True)
    await db.industries.create_index("slug", unique=True)
    await db.locations.create_index("slug", unique=True)
    await db.legal_pages.create_index("slug", unique=True)
    await seed_admin()
    await seed_content()
    await migrate_em_dashes()
    await expand_location_content()
    await expand_industry_content()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ.get("FRONTEND_URL", "http://localhost:3000"), "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
