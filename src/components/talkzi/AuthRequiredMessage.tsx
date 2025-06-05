import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Note: While Clerk is now handling authentication, you might still use Supabase for other database operations.
// If Supabase is ONLY used for auth and profiles previously, and Clerk replaces that entirely,
// you might not need this client anymore, or you might reconfigure it for non-auth database tasks.
// For now, we'll keep it in case it's used for `message_feedback` or other tables.

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error(
    'Missing environment variables. Please check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

export const supabase: SupabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    // If Clerk is the primary auth, Supabase's session persistence might not be strictly necessary
    // unless you are using RLS policies that depend on a Supabase JWT.
    // For simplicity, keeping auth config, but it might be removable if Clerk fully gates DB access.
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);