import os
import stripe
import traceback
from supabase import create_client, Client
from fastapi import Request, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
STRIPE_PRICE_ID = os.getenv("STRIPE_PRICE_ID_MONTHLY")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_PUBLISHABLE_KEY = os.getenv("SUPABASE_PUBLISHABLE_KEY") # Use Service Role for backend bypass
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
supabase_admin = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
app = FastAPI()

# Enable CORS so your React app can talk to this backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Your Vite dev URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CheckoutRequest(BaseModel):
    plan: str
    user_id: str
    success_url: str
    cancel_url: str

@app.post("/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Handle the specific event
    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        user_id = session.get('client_reference_id') # You must pass this in the initial checkout create
        if user_id:
            supabase_admin.table("profiles").update({"is_pro": True}).eq("id", user_id).execute()
        # Here you would call Supabase to set is_pro = True
        # You can use the 'client_reference_id' or 'customer_email' to find the user
        print(f"User {user_id} upgraded to Pro via Webhook.")
        # TO DO: Add Supabase Python Admin SDK call here to update the user profile
        
    elif event['type'] == 'customer.subscription.deleted':
        # Handle cancellation
        subscription = event['data']['object']
        print(f"Subscription Canceled: {subscription['id']}")
        # TO DO: Add Supabase call to set is_pro = False

    return {"status": "success"}    

@app.post("/create-checkout-session")
async def create_checkout_session(request: CheckoutRequest):
    try:
        # Define your Stripe Price IDs from your dashboard
        price_id = STRIPE_PRICE_ID if request.plan == "monthly" else "price_456_yearly"
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            client_reference_id=request.user_id,
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            subscription_data={
                'trial_period_days': 7, 
            },
            # This ensures they must enter a card to start the trial
            payment_method_collection='always',
            success_url=request.success_url,
            cancel_url=request.cancel_url,
        )
        return {"sessionId": session.id}
    except stripe.error.StripeError as e:
        # This will print the exact reason (e.g., "No such price: price_123_monthly") 
        # to your Python terminal
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        print(f"critical error: {str(e)}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))    

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)