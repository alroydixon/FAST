import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Pull directly using your matching .env.local string key
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing public Supabase keys in environment settings (.env.local)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
