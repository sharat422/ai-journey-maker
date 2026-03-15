import os
import stripe
import traceback
from supabase import create_client, Client
from fastapi import Request, FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import date, datetime, timedelta
import requests

load_dotenv()
GEMINI_API_KEY = os.getenv("VITE_GEMINI_API_KEY")
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

# Startup diagnostics
print("=== API KEY DIAGNOSTICS ===")
print(f"GEMINI_API_KEY loaded: {'YES (prefix: ' + GEMINI_API_KEY[:10] + '...)' if GEMINI_API_KEY else 'NO - MISSING'}")
print(f"VITE_SUPABASE_URL: {os.getenv('VITE_SUPABASE_URL', 'MISSING')}")
print(f"SUPABASE_SERVICE_ROLE_KEY: {'SET' if os.getenv('SUPABASE_SERVICE_ROLE_KEY') else 'MISSING'}")
print("===========================")


# Global variable to store the supabase client
_supabase_admin = None

def get_supabase_admin():
    global _supabase_admin
    if _supabase_admin is None:
        SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
        # SERVICE_ROLE_KEY is required for admin features, but we fallback to publishable if missing for basic read/write
        # Note: The 'sb_publishable_' keys might not work with the current Python SDK version.
        SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("VITE_SUPABASE_PUBLISHABLE_KEY")
        
        if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
            print("WARNING: Supabase credentials missing. Some features will be disabled.")
            return None
            
        try:
            _supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        except Exception as e:
            print(f"WARNING: Failed to initialize Supabase client: {e}")
            return None
    return _supabase_admin

app = FastAPI()
router = APIRouter(prefix="/api")

@app.get("/")
async def root():
    return {"status": "ok", "message": "PrimePro AI Backend is running on port 8001"}

# Enable CORS 
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "https://www.primepro.co",
        "https://primepro.co",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CheckoutRequest(BaseModel):
    plan: str
    user_id: str
    success_url: str
    cancel_url: str

class StreakCheckRequest(BaseModel):
    user_id: str
    timezone_offset: int = 0

class UnlockRewardRequest(BaseModel):
    user_id: str
    reward_type: str

class JourneyRequest(BaseModel):
    goal: str
    timeframe: str
    model: str = "gemini-2.0-flash"

class AnalyzeProgressRequest(BaseModel):
    journey: dict

def strip_json_fences(text: str) -> str:
    """Remove markdown code fences that Gemini sometimes wraps around JSON."""
    text = text.strip()
    if text.startswith("```"):
        # Remove opening fence (```json or ```)
        text = text[text.index("\n") + 1:] if "\n" in text else text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()

def gemini_generate(model: str, system_prompt: str, user_prompt: str, max_tokens: int = 4000) -> str:
    """Call the Gemini generateContent REST API and return the text response."""
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env")
    url = f"{GEMINI_API_BASE}/{model}:generateContent?key={GEMINI_API_KEY}"
    payload = {
        "contents": [
            {"role": "user", "parts": [{"text": user_prompt}]}
        ],
        "systemInstruction": {
            "parts": [{"text": system_prompt}]
        },
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": 0.7
        }
    }
    response = requests.post(url, json=payload, timeout=60)
    if response.status_code != 200:
        error_body = response.text
        print(f"Gemini API Error {response.status_code}: {error_body}")
        raise HTTPException(status_code=500, detail=f"Gemini API returned {response.status_code}: {error_body}")
    candidates = response.json().get("candidates", [])
    if not candidates:
        raise HTTPException(status_code=500, detail="Gemini returned no candidates")
    return strip_json_fences(candidates[0]["content"]["parts"][0]["text"])

@router.post("/generate-journey")
async def generate_journey(request: JourneyRequest):
    prompt = (
        f"Create a detailed learning roadmap for the following goal: '{request.goal}'. "
        f"The target timeframe is '{request.timeframe}'. "
        "Break it down into logical milestones with actionable steps. Be specific and practical. "
        "Return your response as a valid JSON object with keys: title, description, category, milestones. "
        "Each milestone should have: title, description, estimatedDays, steps (array of strings)."
    )
    system = "You are an expert career coach and learning strategist. Always respond with valid JSON only, no markdown fences."
    try:
        data = gemini_generate(request.model, system, prompt)
        return {"result": data}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Gemini Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Gemini API error: " + str(e))

@router.post("/analyze-progress")
async def analyze_progress(request: AnalyzeProgressRequest):
    journey = request.journey
    milestones = journey.get("milestones", [])
    completed_steps = sum(
        sum(1 for s in m.get("steps", []) if s.get("completed")) for m in milestones
    )
    total_steps = sum(len(m.get("steps", [])) for m in milestones)
    progress_data = [
        {"title": m.get("title"), "completed": sum(1 for s in m.get("steps", []) if s.get("completed")), "total": len(m.get("steps", []))}
        for m in milestones
    ]
    prompt = (
        f"Analyze this progress for the journey: \"{journey.get('title', '')}\".\n"
        f"Description: {journey.get('description', '')}\n"
        f"Overall Progress: {journey.get('progress', 0)}% ({completed_steps}/{total_steps} steps).\n"
        f"Milestone Detail: {progress_data}\n\n"
        "Provide exactly 4 structured insights:\n"
        "1. ACHIEVEMENT: Highlight something successfully done or a streak.\n"
        "2. FOCUS: Identify the exact next step or concept to master.\n"
        "3. ENCOURAGEMENT: A high-energy motivational statement specific to the goal.\n"
        "4. PREDICTION: A 'next big win' forecast based on current trajectory.\n\n"
        "Return a JSON object with key \"insights\", an array of objects with \"type\", \"text\", and \"icon\" (single emoji)."
    )
    system = "You are a motivational coach and progress analyst. Always respond with valid JSON only, no markdown fences."
    try:
        raw = gemini_generate("gemini-2.0-flash", system, prompt, max_tokens=1000)
        import json
        data = json.loads(raw)
        return data
    except HTTPException:
        raise
    except Exception as e:
        print(f"Analyze Progress Error: {e}")
        return {"insights": [
            {"type": "encouragement", "text": "Keep moving forward, every small step counts!", "icon": "🚀"},
            {"type": "focus", "text": "Review your upcoming steps to stay prepared.", "icon": "🎯"},
            {"type": "achievement", "text": "You've already started the hardest part: beginning.", "icon": "🌟"}
        ]}

@router.get("/health")
async def health():
    return {"status": "ok"}


@router.post("/streak/check")
async def check_streak(request: StreakCheckRequest):
    try:
        today = date.today()
        supabase = get_supabase_admin()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database service unavailable")
        response = supabase.table("user_streaks").select("*").eq("user_id", request.user_id).execute()
        streak_data = response.data[0] if response.data else None
        current_streak = 0
        longest_streak = 0
        last_activity = None
        if streak_data:
            current_streak = streak_data['current_streak']
            longest_streak = streak_data['longest_streak']
            last_activity = datetime.strptime(streak_data['last_activity_date'], '%Y-%m-%d').date() if streak_data['last_activity_date'] else None
        updated_streak = current_streak
        if last_activity == today:
             pass
        elif last_activity == today - timedelta(days=1):
            updated_streak += 1
        else:
            updated_streak = 1
        new_longest = max(longest_streak, updated_streak)
        supabase = get_supabase_admin()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database service unavailable")
        
        upsert_data = {
            "user_id": request.user_id,
            "current_streak": updated_streak,
            "longest_streak": new_longest,
            "last_activity_date": today.isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        supabase.table("user_streaks").upsert(upsert_data).execute()
        return {"status": "success", "current_streak": updated_streak, "longest_streak": new_longest}
    except Exception as e:
        print(f"Streak Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/use-streak-freeze")
async def use_streak_freeze(request: UnlockRewardRequest):
    try:
        supabase = get_supabase_admin()
        if not supabase:
            raise HTTPException(status_code=503, detail="Database service unavailable")
        profile = supabase.table("profiles").select("streak_freezes_available").eq("id", request.user_id).execute()
        if not profile.data or profile.data[0]['streak_freezes_available'] < 1:
            raise HTTPException(status_code=400, detail="No streak freezes available")
            
        supabase.rpc("decrement_streak_freeze", {"user_uuid": request.user_id}).execute()
        return {"status": "success", "message": "Streak Freeze Used"}
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))

@router.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        mode = session.get('mode')
        if user_id:
            supabase = get_supabase_admin()
            if not supabase:
                print("ERROR: Cannot process webhook - Supabase unavailable")
                return {"status": "error", "message": "Database error"}
            if mode == 'subscription':
                supabase.table("profiles").update({"is_pro": True}).eq("id", user_id).execute()
                print(f"User {user_id} upgraded to Pro via Webhook.")
            elif mode == 'payment':
                 metadata = session.get('metadata', {})
                 purchase_type = metadata.get('type')
                 
                 if purchase_type == 'streak_freeze':
                      profile = supabase.table("profiles").select("streak_freezes_available").eq("id", user_id).execute()
                      current_freezes = profile.data[0]['streak_freezes_available'] if profile.data else 0
                      supabase.table("profiles").update({"streak_freezes_available": current_freezes + 1}).eq("id", user_id).execute()
                      print(f"User {user_id} purchased a Streak Freeze.")
                      
                 elif purchase_type == 'extra_goal':
                      profile = supabase.table("profiles").select("extra_goal_slots").eq("id", user_id).execute()
                      current_slots = profile.data[0]['extra_goal_slots'] if profile.data else 0
                      supabase.table("profiles").update({"extra_goal_slots": current_slots + 1}).eq("id", user_id).execute()
                      print(f"User {user_id} purchased an extra goal slot.")
    return {"status": "success"}    

@router.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    try:
        price_id = None
        mode = 'subscription'
        metadata = {}
        if request.plan == 'monthly':
            price_id = STRIPE_PRICE_ID_MONTHLY
        elif request.plan == 'yearly':
            price_id = STRIPE_PRICE_ID_YEARLY
        elif request.plan == 'streak_freeze':
            price_id = os.getenv("STRIPE_PRICE_ID_FREEZE") 
            mode = 'payment'
            metadata = {'type': 'streak_freeze'}
        elif request.plan == 'extra_goal':
            price_id = os.getenv("STRIPE_PRICE_ID_GOAL")
            mode = 'payment'
            metadata = {'type': 'extra_goal'}
        if not price_id:
             raise HTTPException(status_code=400, detail="Invalid plan or missing price configuration.")
        session_args = {
            'payment_method_types': ['card'],
            'client_reference_id': request.user_id,
            'line_items': [{'price': price_id, 'quantity': 1}],
            'mode': mode,
            'success_url': request.success_url,
            'cancel_url': request.cancel_url,
            'metadata': metadata
        }
        if mode == 'subscription':
             session_args['subscription_data'] = {'trial_period_days': 7}
             session_args['payment_method_collection'] = 'always'
        session = stripe.checkout.Session.create(**session_args)
        return {"sessionId": session.id}
    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
