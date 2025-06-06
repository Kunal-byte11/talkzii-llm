
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// This is the primary Supabase client initialization for the application.
// It is used by AuthContext and other parts of the app that need to interact with Supabase.

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true, // Persist session in localStorage
      autoRefreshToken: true, // Automatically refresh token
      // detectSessionInUrl: true, // Useful for password recovery, email confirmation links
    }
  }
);
