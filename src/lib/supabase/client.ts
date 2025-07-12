import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing environment variables. Please check your .env.local file for NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
  );
}

let supabase: SupabaseClient;

// This is a workaround for the preview environment where real credentials are not available.
// It prevents the app from crashing due to an "Invalid URL" error from the placeholder value.
if (supabaseUrl.includes('YOUR_SUPABASE_URL_HERE')) {
  // Create a mock Supabase client if placeholder values are still present.
  // This allows the app to build and run without a real database connection.
  // Note: Authentication and database features will not work with this mock client.
  console.warn('Using mock Supabase client because placeholder URL was detected.');
  supabase = {
    auth: {
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: { name: 'MockError', message: 'Mock client, sign-in disabled' } }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: { name: 'MockError', message: 'Mock client, sign-up disabled' } }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: [], error: { name: 'MockError', message: 'Mock client, insert disabled' } }),
      // Add other mock methods as needed by your components
    }),
  } as any;
} else {
  // Create the real Supabase client if proper credentials are provided.
  supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    }
  );
}

export { supabase };
