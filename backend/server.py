"""AST Smart Analyzer — FastAPI backend."""
import logging
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Optional

import bcrypt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field
from starlette.middleware.cors import CORSMiddleware

from ai_layer import interpret as ai_interpret
from antibiotics_data import ANTIBIOTICS_BY_CATEGORY, SAMPLE_TYPES, default_breakpoints

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRE_MINUTES", "10080"))

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="AST Smart Analyzer")
api = APIRouter(prefix="/api")
bearer = HTTPBearer(auto_error=False)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger("ast")


# ---------- Models ----------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    token: str
    user: dict


class UserOut(BaseModel):
    id: str
    email: str
    name: Optional[str] = None


class InterpretIn(BaseModel):
    zone_mm: float
    antibiotic: str
    antibiotic_category: str
    sample_type: str


class ScanCreate(BaseModel):
    zone_mm: float
    sample_type: str
    antibiotic: str
    antibiotic_category: str
    interpretation: str
    estimated_mic_range: str = ""
    possible_organisms: list[dict] = []
    explanation: str = ""
    confidence_score: float = 0.0
    image_base64: Optional[str] = None      # original
    annotated_base64: Optional[str] = None  # with overlay
    detection_mode: str = "manual"          # always manual now


class ScanOut(BaseModel):
    id: str
    user_id: str
    zone_mm: float
    sample_type: str
    antibiotic: str
    antibiotic_category: str
    interpretation: str
    estimated_mic_range: str
    possible_organisms: list[dict]
    explanation: str
    confidence_score: float
    detection_mode: str
    image_base64: Optional[str] = None
    annotated_base64: Optional[str] = None
    timestamp: str


# ---------- Auth helpers ----------
def _hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _verify_password(pw: str, pw_hash: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), pw_hash.encode("utf-8"))
    except Exception:  # noqa: BLE001
        return False


def _make_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=JWT_EXPIRE_MINUTES),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def current_user(creds: HTTPAuthorizationCredentials = Depends(bearer)) -> dict:
    if creds is None or not creds.credentials:
        raise HTTPException(status_code=401, detail="Missing auth token")
    try:
        data = jwt.decode(creds.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=401, detail=f"Invalid token: {exc}") from exc
    user_id = data.get("sub")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------- Meta ----------
@api.get("/")
async def root() -> dict[str, str]:
    return {"service": "ast-smart-analyzer", "status": "ok"}


@api.get("/meta/antibiotics")
async def get_antibiotics() -> dict[str, Any]:
    return {"categories": ANTIBIOTICS_BY_CATEGORY}


@api.get("/meta/sample-types")
async def get_sample_types() -> dict[str, Any]:
    return {"sample_types": SAMPLE_TYPES}


# ---------- Auth ----------
@api.post("/auth/register", response_model=AuthOut)
async def register(body: RegisterIn) -> AuthOut:
    existing = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": body.email.lower(),
        "name": body.name or body.email.split("@")[0],
        "password_hash": _hash_password(body.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = _make_token(user_id, user_doc["email"])
    return AuthOut(
        token=token,
        user={"id": user_id, "email": user_doc["email"], "name": user_doc["name"]},
    )


@api.post("/auth/login", response_model=AuthOut)
async def login(body: LoginIn) -> AuthOut:
    user = await db.users.find_one({"email": body.email.lower()}, {"_id": 0})
    if not user or not _verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = _make_token(user["id"], user["email"])
    return AuthOut(
        token=token,
        user={"id": user["id"], "email": user["email"], "name": user.get("name")},
    )


@api.get("/auth/me", response_model=UserOut)
async def me(user: dict = Depends(current_user)) -> UserOut:
    return UserOut(id=user["id"], email=user["email"], name=user.get("name"))


@api.post("/interpret")
async def interpret_endpoint(body: InterpretIn, user: dict = Depends(current_user)) -> dict[str, Any]:
    return ai_interpret(
        zone_mm=body.zone_mm,
        antibiotic=body.antibiotic,
        antibiotic_category=body.antibiotic_category,
        sample_type=body.sample_type,
    )


# ---------- Scans ----------
@api.post("/scans", response_model=ScanOut)
async def create_scan(body: ScanCreate, user: dict = Depends(current_user)) -> ScanOut:
    scan_id = str(uuid.uuid4())
    doc = body.model_dump()
    doc.update(
        id=scan_id,
        user_id=user["id"],
        timestamp=datetime.now(timezone.utc).isoformat(),
    )
    await db.scans_collection.insert_one(doc)
    # return without _id
    doc.pop("_id", None)
    return ScanOut(**doc)


@api.get("/scans", response_model=list[ScanOut])
async def list_scans(user: dict = Depends(current_user)) -> list[ScanOut]:
    cursor = db.scans_collection.find(
        {"user_id": user["id"]},
        {"_id": 0, "image_base64": 0, "annotated_base64": 0},
    ).sort("timestamp", -1).limit(200)
    rows = await cursor.to_list(200)
    return [ScanOut(**{**r, "image_base64": None, "annotated_base64": None}) for r in rows]


@api.get("/scans/{scan_id}", response_model=ScanOut)
async def get_scan(scan_id: str, user: dict = Depends(current_user)) -> ScanOut:
    doc = await db.scans_collection.find_one(
        {"id": scan_id, "user_id": user["id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Scan not found")
    return ScanOut(**doc)


@api.delete("/scans/{scan_id}")
async def delete_scan(scan_id: str, user: dict = Depends(current_user)) -> dict[str, Any]:
    res = await db.scans_collection.delete_one({"id": scan_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Scan not found")
    return {"deleted": True}


@api.delete("/scans")
async def clear_scans(user: dict = Depends(current_user)) -> dict[str, Any]:
    res = await db.scans_collection.delete_many({"user_id": user["id"]})
    return {"deleted": res.deleted_count}


# ---------- Register router + middleware ----------
app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup() -> None:
    await db.users.create_index("email", unique=True)
    await db.scans_collection.create_index([("user_id", 1), ("timestamp", -1)])
    log.info("AST Smart Analyzer backend ready")


@app.on_event("shutdown")
async def _shutdown() -> None:
    client.close()
