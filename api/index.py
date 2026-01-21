import os
import stripe
import traceback
from supabase import create_client, Client
from fastapi import Request, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Environment Variables Validation
required_vars = [
    "STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_PRICE_ID_MONTHLY",
    "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"
]

missing_vars = [var for var in required_vars if not os.getenv(var)]

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID_MONTHLY = os.getenv("STRIPE_PRICE_ID_MONTHLY")
STRIPE_PRICE_ID_YEARLY = os.getenv("STRIPE_PRICE_ID_YEARLY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

# Create Client safely
supabase_admin = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    except Exception as e:
        print(f"Supabase Client Init Error: {e}")

app = FastAPI()

# Enable CORS
origins = [
    "http://localhost:5173",           # Local Vite
    "http://127.0.0.1:5173",           # Local Vite IP
    "https://ai-journey-maker-stride.vercel.app",  # Production Vercel
    os.getenv("VITE_FRONTEND_URL", "*") # Custom Env Var
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CheckoutRequest(BaseModel):
    user_id: str
    plan: str
    success_url: str
    cancel_url: str

@app.get("/api/health")
def health():
    if missing_vars:
        return {"status": "error", "missing_env_vars": missing_vars}
    return {"status": "ok", "message": "Backend is running and all env vars found"}

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    if not STRIPE_WEBHOOK_SECRET:
         raise HTTPException(status_code=500, detail="Server config error: Missing Webhook Secret")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Handle the specific event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id') 
        if user_id and supabase_admin:
            supabase_admin.table("profiles").update({"is_pro": True}).eq("id", user_id).execute()
            print(f"User {user_id} upgraded to Pro via Webhook.")
        else:
            print("Webhook Error: User ID missing or DB not connected")
        
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        print(f"Subscription Canceled: {subscription['id']}")

    return {"status": "success"}    

@app.post("/api/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    if missing_vars:
        raise HTTPException(status_code=500, detail=f"Server Configuration Error. Missing vars: {missing_vars}")

    try:
        # Define your Stripe Price IDs from your dashboard
        price_id = STRIPE_PRICE_ID_MONTHLY if request.plan == "monthly" else STRIPE_PRICE_ID_YEARLY
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            client_reference_id=request.user_id,
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            allow_promotion_codes=True,
            subscription_data={
                'trial_period_days': 7, 
            },
            payment_method_collection='always',
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )
        return {"sessionId": session.id}
    except stripe.error.StripeError as e:
        print(f"CRITICAL STRIPE ERROR: {str(e)}")
        # Return strict string detail for frontend to display
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        print(f"critical error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

