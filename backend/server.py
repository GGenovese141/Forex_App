import os
import uuid
import io
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from fastapi import FastAPI, HTTPException, Depends, File, UploadFile, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
import bcrypt
import base64
import json
from dotenv import load_dotenv

load_dotenv()

# MongoDB setup
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DB_NAME", "forex_course_db")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DATABASE_NAME]

# Security
SECRET_KEY = "your-secret-key-here-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

# App setup
app = FastAPI(title="Forex Course App", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Course pricing configuration
COURSE_PACKAGES: Dict[str, Dict] = {
    "corso_completo": {
        "name": "Corso Completo",
        "price": 79.99,
        "currency": "EUR",
        "description": "Accesso completo a tutti i contenuti del corso"
    },
    "powerpoint_strategie": {
        "name": "PowerPoint Strategie",
        "price": 10.99,
        "currency": "EUR",
        "description": "PowerPoint delle strategie di lettura del grafico"
    },
    "video_strategia": {
        "name": "Video Strategia",
        "price": 14.99,
        "currency": "EUR",
        "description": "Videolezione sulla strategia e sulla sua configurazione"
    },
    "powerpoint_nicchia": {
        "name": "PowerPoint Nicchia",
        "price": 17.99,
        "currency": "EUR",
        "description": "PowerPoint su argomenti di nicchia inerenti al macro argomento"
    }
}

# Pydantic models
class UserRegistration(BaseModel):
    email: EmailStr
    password: str
    name: str
    gdpr_consent: bool
    marketing_consent: bool

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class CourseContent(BaseModel):
    title: str
    description: str
    content_type: str  # video, powerpoint, pdf
    section: str  # apprendimento, corso_completo, premium
    chapter: Optional[str] = None
    price: Optional[float] = None
    file_content: Optional[str] = None  # base64 encoded

class BookingRequest(BaseModel):
    user_email: EmailStr
    preferred_date: str
    preferred_time: str
    notes: Optional[str] = None

class PaymentRequest(BaseModel):
    course_package: str
    user_email: EmailStr
    amount: float

class AdminConfig(BaseModel):
    paypal_client_id: Optional[str] = None
    paypal_client_secret: Optional[str] = None
    paypal_mode: Optional[str] = None
    google_calendar_credentials: Optional[str] = None

class PayPalOrderRequest(BaseModel):
    course_package: str
    user_email: EmailStr
    amount: float

# Utility functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def serialize_mongodb_doc(doc):
    """Convert MongoDB document to JSON-serializable dict."""
    if doc is None:
        return None
    
    result = {}
    for key, value in doc.items():
        if key == '_id':
            # Convert ObjectId to string
            result['id'] = str(value)
        elif isinstance(value, list):
            # Handle lists (potentially containing ObjectIds)
            result[key] = [serialize_mongodb_doc(item) if isinstance(item, dict) else str(item) if hasattr(item, '__str__') and not isinstance(item, (str, int, float, bool, type(None))) else item for item in value]
        elif isinstance(value, dict):
            # Recursively serialize nested documents
            result[key] = serialize_mongodb_doc(value)
        elif hasattr(value, '__str__') and not isinstance(value, (str, int, float, bool, type(None))):
            # Convert any other non-serializable types to string
            result[key] = str(value)
        else:
            # Keep serializable types as is
            result[key] = value
    
    return result

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        return email
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow()}

# Authentication routes
@app.post("/api/auth/register")
async def register_user(user: UserRegistration):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": user.email,
        "name": user.name,
        "password": hashed_password,
        "gdpr_consent": user.gdpr_consent,
        "marketing_consent": user.marketing_consent,
        "is_premium": False,
        "purchased_courses": [],
        "created_at": datetime.utcnow(),
        "is_admin": False
    }
    
    result = await db.users.insert_one(user_doc)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "name": user.name,
            "is_premium": False
        }
    }

@app.post("/api/auth/login")
async def login_user(user: UserLogin):
    # Find user
    db_user = await db.users.find_one({"email": user.email})
    if not db_user or not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": db_user["email"],
            "name": db_user["name"],
            "is_premium": db_user.get("is_premium", False),
            "is_admin": db_user.get("is_admin", False)
        }
    }

@app.get("/api/auth/me")
async def get_current_user_info(current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "email": user["email"],
        "name": user["name"],
        "is_premium": user.get("is_premium", False),
        "is_admin": user.get("is_admin", False),
        "purchased_courses": user.get("purchased_courses", [])
    }

# Course content routes
@app.get("/api/courses/free")
async def get_free_content():
    content = await db.course_content.find({"section": "apprendimento"}).to_list(length=None)
    return {"content": content}

@app.get("/api/courses/premium")
async def get_premium_content(current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user})
    if not user or not user.get("is_premium", False):
        raise HTTPException(status_code=403, detail="Premium access required")
    
    content = await db.course_content.find({"section": "corso_completo"}).to_list(length=None)
    return {"content": content}

@app.get("/api/courses/extra")
async def get_extra_content(current_user: str = Depends(get_current_user)):
    user = await db.users.find_one({"email": current_user})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Show all extra content but mark which ones are purchased
    content = await db.course_content.find({"section": "premium"}).to_list(length=None)
    purchased_courses = user.get("purchased_courses", [])
    
    for item in content:
        item["is_purchased"] = item["_id"] in purchased_courses
    
    return {"content": content}

# Booking routes
@app.post("/api/bookings/request")
async def request_booking(booking: BookingRequest):
    booking_doc = {
        "id": str(uuid.uuid4()),
        "user_email": booking.user_email,
        "preferred_date": booking.preferred_date,
        "preferred_time": booking.preferred_time,
        "notes": booking.notes,
        "status": "pending",
        "created_at": datetime.utcnow()
    }
    
    result = await db.bookings.insert_one(booking_doc)
    return {"message": "Booking request submitted successfully", "booking_id": booking_doc["id"]}

@app.get("/api/bookings/my")
async def get_my_bookings(current_user: str = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_email": current_user}).to_list(length=None)
    # Serialize MongoDB documents to make them JSON-serializable
    serialized_bookings = [serialize_mongodb_doc(booking) for booking in bookings]
    return {"bookings": serialized_bookings}

# PayPal Payment routes
@app.post("/api/paypal/create-order")
async def create_paypal_order(order_request: PayPalOrderRequest, current_user: str = Depends(get_current_user)):
    try:
        # Validate course package
        if order_request.course_package not in COURSE_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid course package")
        
        package = COURSE_PACKAGES[order_request.course_package]
        
        # For now, return a mock order (will be replaced with actual PayPal integration when keys are provided)
        order_id = f"MOCK_ORDER_{str(uuid.uuid4())[:8].upper()}"
        
        # Create transaction record
        transaction_id = str(uuid.uuid4())
        transaction_doc = {
            "id": transaction_id,
            "order_id": order_id,
            "user_email": current_user,
            "course_package": order_request.course_package,
            "amount": package["price"],
            "currency": package["currency"],
            "status": "pending",
            "created_at": datetime.utcnow(),
            "paypal_order_id": order_id
        }
        
        # Store in MongoDB
        await db.payment_transactions.insert_one(transaction_doc)
        
        return {
            "order_id": order_id,
            "transaction_id": transaction_id,
            "approval_url": f"https://www.sandbox.paypal.com/checkoutnow?token={order_id}",
            "message": "PayPal integration ready - configure PayPal keys in admin panel"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create PayPal order: {str(e)}")

@app.post("/api/paypal/capture-order/{order_id}")
async def capture_paypal_order(order_id: str, current_user: str = Depends(get_current_user)):
    try:
        # For now, simulate successful capture (will be replaced with actual PayPal integration)
        
        # Update transaction in database
        update_result = await db.payment_transactions.update_one(
            {"paypal_order_id": order_id},
            {
                "$set": {
                    "status": "completed",
                    "completed_at": datetime.utcnow()
                }
            }
        )
        
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Get updated transaction
        transaction = await db.payment_transactions.find_one({"paypal_order_id": order_id})
        
        # Update user premium status if purchasing main course
        if transaction["course_package"] == "corso_completo":
            await db.users.update_one(
                {"email": current_user},
                {"$set": {"is_premium": True}}
            )
        
        return {
            "status": "success",
            "transaction_id": transaction["id"],
            "capture_id": f"MOCK_CAPTURE_{str(uuid.uuid4())[:8].upper()}",
            "message": "Payment completed successfully (mock mode)"
        }
        
    except Exception as e:
        # Update transaction status to failed
        await db.payment_transactions.update_one(
            {"paypal_order_id": order_id},
            {"$set": {"status": "failed"}}
        )
        raise HTTPException(status_code=500, detail=f"Failed to capture payment: {str(e)}")

@app.get("/api/payment/packages")
async def get_payment_packages():
    return COURSE_PACKAGES

# Admin routes
@app.post("/api/admin/content/upload")
async def upload_content(
    title: str = Form(...),
    description: str = Form(...),
    content_type: str = Form(...),
    section: str = Form(...),
    chapter: str = Form(None),
    price: float = Form(None),
    file: UploadFile = File(...),
    current_user: str = Depends(get_current_user)
):
    # Check if user is admin
    user = await db.users.find_one({"email": current_user})
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Read file and encode to base64
    file_content = await file.read()
    encoded_content = base64.b64encode(file_content).decode('utf-8')
    
    content_doc = {
        "id": str(uuid.uuid4()),
        "title": title,
        "description": description,
        "content_type": content_type,
        "section": section,
        "chapter": chapter,
        "price": price,
        "file_content": encoded_content,
        "filename": file.filename,
        "created_at": datetime.utcnow(),
        "uploaded_by": current_user
    }
    
    result = await db.course_content.insert_one(content_doc)
    return {"message": "Content uploaded successfully", "content_id": content_doc["id"]}

@app.get("/api/admin/bookings")
async def get_all_bookings(current_user: str = Depends(get_current_user)):
    # Check if user is admin
    user = await db.users.find_one({"email": current_user})
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    bookings = await db.bookings.find({}).to_list(length=None)
    serialized_bookings = [serialize_mongodb_doc(booking) for booking in bookings]
    return {"bookings": serialized_bookings}

@app.post("/api/admin/config")
async def update_admin_config(config: AdminConfig, current_user: str = Depends(get_current_user)):
    # Check if user is admin
    user = await db.users.find_one({"email": current_user})
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    # Update configuration
    await db.admin_config.update_one(
        {"type": "main"},
        {"$set": config.dict(exclude_unset=True)},
        upsert=True
    )
    
    return {"message": "Configuration updated successfully"}

@app.get("/api/admin/config")
async def get_admin_config(current_user: str = Depends(get_current_user)):
    # Check if user is admin
    user = await db.users.find_one({"email": current_user})
    if not user or not user.get("is_admin", False):
        raise HTTPException(status_code=403, detail="Admin access required")
    
    config = await db.admin_config.find_one({"type": "main"})
    if not config:
        return {
            "configured": False,
            "paypal_configured": False,
            "google_calendar_configured": False
        }
    
    return {
        "configured": True,
        "paypal_configured": bool(config.get("paypal_client_id")),
        "google_calendar_configured": bool(config.get("google_calendar_credentials"))
    }

# Content serving route
@app.get("/api/content/{content_id}")
async def get_content(content_id: str, current_user: str = Depends(get_current_user)):
    content = await db.course_content.find_one({"id": content_id})
    if not content:
        raise HTTPException(status_code=404, detail="Content not found")
    
    # Check access permissions
    user = await db.users.find_one({"email": current_user})
    if content["section"] == "corso_completo" and not user.get("is_premium", False):
        raise HTTPException(status_code=403, detail="Premium access required")
    
    if content["section"] == "premium":
        purchased_courses = user.get("purchased_courses", [])
        if content["_id"] not in purchased_courses:
            raise HTTPException(status_code=403, detail="Content not purchased")
    
    # Decode file content
    file_content = base64.b64decode(content["file_content"])
    
    # Determine content type for response
    if content["content_type"] == "video":
        media_type = "video/mp4"
    elif content["content_type"] == "powerpoint":
        media_type = "application/vnd.ms-powerpoint"
    else:
        media_type = "application/octet-stream"
    
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={"Content-Disposition": f"inline; filename={content['filename']}"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)