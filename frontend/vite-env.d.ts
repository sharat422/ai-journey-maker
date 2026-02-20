/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_BACKEND_URL: string
    readonly VITE_STRIPE_SECRET_KEY: string
    readonly VITE_STRIPE_PUBLISHABLE_KEY: string
    readonly VITE_STRIPE_PRICE_ID_MONTHLY: string
    readonly VITE_STRIPE_PRICE_ID_YEARLY: string
    readonly VITE_SUPABASE_URL: string
    readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
