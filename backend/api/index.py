import os
import stripe
import traceback
from supabase import create_client, Client
from fastapi import Request, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from datetime import date, datetime, timedelta

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID_MONTHLY = os.getenv("STRIPE_PRICE_ID_MONTHLY")
STRIPE_PRICE_ID_YEARLY = os.getenv("STRIPE_PRICE_ID_YEARLY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
app = FastAPI()

# Enable CORS so your React app can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Local dev
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

@app.post("/api/streak/check")
async def check_streak(request: StreakCheckRequest):
    try:
        today = date.today()
        
        response = supabase_admin.table("user_streaks").select("*").eq("user_id", request.user_id).execute()
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
        
        upsert_data = {
            "user_id": request.user_id,
            "current_streak": updated_streak,
            "longest_streak": new_longest,
            "last_activity_date": today.isoformat(),
            "updated_at": datetime.now().isoformat()
        }
        
        supabase_admin.table("user_streaks").upsert(upsert_data).execute()
        
        return {
            "status": "success", 
            "current_streak": updated_streak, 
            "longest_streak": new_longest
        }
        
    except Exception as e:
        print(f"Streak Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/use-streak-freeze")
async def use_streak_freeze(request: UnlockRewardRequest):
    try:
        profile = supabase_admin.table("profiles").select("streak_freezes_available").eq("id", request.user_id).execute()
        if not profile.data or profile.data[0]['streak_freezes_available'] < 1:
            raise HTTPException(status_code=400, detail="No streak freezes available")
            
        supabase_admin.rpc("decrement_streak_freeze", {"user_uuid": request.user_id}).execute()
        
        return {"status": "success", "message": "Streak Freeze Used"}
        
    except Exception as e:
         raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id')
        mode = session.get('mode')
        
        if user_id:
            if mode == 'subscription':
                supabase_admin.table("profiles").update({"is_pro": True}).eq("id", user_id).execute()
                print(f"User {user_id} upgraded to Pro via Webhook.")
            elif mode == 'payment':
                 metadata = session.get('metadata', {})
                 purchase_type = metadata.get('type')
                 
                 if purchase_type == 'streak_freeze':
                      profile = supabase_admin.table("profiles").select("streak_freezes_available").eq("id", user_id).execute()
                      current_freezes = profile.data[0]['streak_freezes_available'] if profile.data else 0
                      supabase_admin.table("profiles").update({"streak_freezes_available": current_freezes + 1}).eq("id", user_id).execute()
                      print(f"User {user_id} purchased a Streak Freeze.")
                      
                 elif purchase_type == 'extra_goal':
                      profile = supabase_admin.table("profiles").select("extra_goal_slots").eq("id", user_id).execute()
                      current_slots = profile.data[0]['extra_goal_slots'] if profile.data else 0
                      supabase_admin.table("profiles").update({"extra_goal_slots": current_slots + 1}).eq("id", user_id).execute()
                      print(f"User {user_id} purchased an extra goal slot.")

    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        print(f"Subscription Canceled: {subscription['id']}")

    return {"status": "success"}    

@app.post("/api/create-checkout-session")
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
            'line_items': [{
                'price': price_id,
                'quantity': 1,
            }],
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
    except stripe.error.StripeError as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        print(f"critical error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
