
import { createClient } from '@supabase/supabase-js/dist/common.js/dist/common.js';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("CRITICAL: Supabase credentials missing. Check VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
  throw new Error("Supabase configuration missing");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
