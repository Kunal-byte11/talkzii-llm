
"use client";

// IMPORTANT: If you see "useAuth must be used within an AuthProvider"
// AND you've confirmed AuthProvider wraps your layout:
// 1. Delete your .next folder
// 2. Restart your dev server.
// This often resolves stubborn parsing/caching issues.

import React, { useEffect, useState, useMemo, type ReactNode, useContext } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';
import type { UserProfile } from '@/types/talkzi';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean; // True if either auth state or profile is still loading
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [session, setSession] = React.useState<Session | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [isAuthLoadingInternal, setIsAuthLoadingInternal] = React.useState(true);
  const [isProfileLoadingInternal, setIsProfileLoadingInternal] = React.useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Initial data fetch on component mount
    const getInitialData = async () => {
      setIsAuthLoadingInternal(true);
      setIsProfileLoadingInternal(true);
      try {
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error("Error fetching initial session:", sessionError.message || String(sessionError));
          if (sessionError.message.includes("Invalid Refresh Token") || sessionError.message.includes("Refresh Token Not Found") || sessionError.message.includes("invalid_grant")) {
            await supabase.auth.signOut(); // Attempt to clear bad state
          }
          setSession(null); setUser(null); setProfile(null);
        } else {
          setSession(initialSession);
          const currentAuthUser = initialSession?.user ?? null;
          setUser(currentAuthUser);

          if (currentAuthUser) {
            const { data: userProfile, error: profileFetchError } = await supabase
              .from('profiles').select('*').eq('id', currentAuthUser.id).single();
            
            if (profileFetchError) {
              // PGRST116 means no rows found (profile doesn't exist yet for a new user), which is not an operational error.
              if (profileFetchError.code !== 'PGRST116') { 
                if (profileFetchError.message && (profileFetchError.message.includes("Failed to fetch") || profileFetchError.message.includes("NetworkError"))) {
                  console.warn(
                    'Initial profile fetch warning (network issue): Could not connect to Supabase to fetch profile. Please check network connectivity and Supabase service status. Details:',
                    profileFetchError.message
                  );
                } else {
                  console.error('Initial profile fetch error:', profileFetchError.message || String(profileFetchError));
                }
              }
            }
            setProfile(userProfile as UserProfile | null);
          } else {
            setProfile(null);
          }
        }
      } catch (e: unknown) {
        const error = e as Error; // Type assertion
        console.error("Critical error during initial data fetch (AuthProvider):", error.message || String(error));
        setSession(null); setUser(null); setProfile(null);
      }
      finally {
        setIsAuthLoadingInternal(false);
        setIsProfileLoadingInternal(false);
      }
    };
    getInitialData();

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, currentEventSession: Session | null) => {
        try {
          const newAuthUser = currentEventSession?.user ?? null;
          const previousUser = user; // Capture previous user state *before* updating

          const isActualUserIdentityChange = newAuthUser?.id !== previousUser?.id;
          const isLoginEvent = event === 'SIGNED_IN' && isActualUserIdentityChange;
          const isLogoutEvent = event === 'SIGNED_OUT';

          // Only set global loading states for significant user identity changes
          if (isLoginEvent || isLogoutEvent) {
            setIsAuthLoadingInternal(true);
            setIsProfileLoadingInternal(true); // Profile will need re-fetch or clearing
          }
          
          setSession(currentEventSession);
          setUser(newAuthUser);

          if (isLogoutEvent) {
            console.log('User signed out. Clearing profile and user-specific localStorage.');
            if (previousUser?.id) {
              try {
                localStorage.removeItem(`talkzii_chat_history_${previousUser.id}`);
                localStorage.removeItem(`talkzii_ai_friend_type_${previousUser.id}`);
                localStorage.removeItem(`talkzii_chat_memory_${previousUser.id}`);
                localStorage.removeItem(`talkzii_memory_warning_shown_${previousUser.id}`);
              } catch (e) {
                console.error("Error clearing user-specific localStorage on sign out", e);
              }
            }
            setProfile(null);
            // Ensure loading states are reset after logout processing
            setIsAuthLoadingInternal(false); 
            setIsProfileLoadingInternal(false);
            return; // Early exit after logout
          }

          if (newAuthUser) {
            // Fetch profile if:
            // 1. User identity actually changed.
            // 2. It's a USER_UPDATED event for the same user (their profile data might have changed server-side).
            // 3. Profile is currently null for this user (e.g., initial load after session restore).
            // 4. Current profile ID doesn't match the new user ID (sanity check).
            if (isActualUserIdentityChange || 
                (event === 'USER_UPDATED' && newAuthUser.id === previousUser?.id) || 
                !profile || 
                profile.id !== newAuthUser.id) {
              
              if (!isProfileLoadingInternal) setIsProfileLoadingInternal(true); // Set loading only if not already loading

              const { data: userProfileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', newAuthUser.id)
                .single();
              
              if (profileError && profileError.code !== 'PGRST116') { 
                 if (profileError.message && (profileError.message.includes("Failed to fetch") || profileError.message.includes("NetworkError"))) {
                    console.warn('Profile fetch warning on auth change (network issue):', profileError.message);
                 } else {
                    console.error('Profile fetch error on auth change:', profileError.message || String(profileError)); 
                 }
              }
              setProfile(userProfileData as UserProfile | null);
              setIsProfileLoadingInternal(false); 
            }
          } else { 
            setProfile(null); // No user, so no profile
            if (isProfileLoadingInternal) setIsProfileLoadingInternal(false); // Ensure profile loading is false if user becomes null
          }

          // Reset auth loading state if it was a significant change that completed
          if (isLoginEvent || isLogoutEvent) { // isLogoutEvent handled by early return, but good for clarity
            setIsAuthLoadingInternal(false);
          }
        } catch (error) { // Catch any unexpected errors within the handler
          console.error("Critical error in onAuthStateChange handler:", error instanceof Error ? error.message : String(error));
          // Reset states to a safe default on critical error
          setSession(null); setUser(null); setProfile(null);
          setIsAuthLoadingInternal(false);
          setIsProfileLoadingInternal(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Rerun if `user` state changes, to correctly capture `previousUser`

  // Effect for handling navigation based on auth state
  useEffect(() => {
    // Wait for initial auth check to complete before navigating
    if (isAuthLoadingInternal) { 
      return; 
    }
    const isOnAuthPage = pathname === '/auth';
    if (session) { // If there's a session (user is logged in)
      if (isOnAuthPage) {
        router.push('/aipersona'); // Redirect away from /auth page
      }
    }
    // No explicit redirect for logged-out users here, as pages should handle their own auth requirements.
  }, [session, pathname, router, isAuthLoadingInternal]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out: ", error.message || String(error));
    }
    // onAuthStateChange will handle clearing user, session, profile, and localStorage
  };

  // isLoading is true if either core auth state is loading OR if there's a user and their profile is still loading
  const finalIsLoading = isAuthLoadingInternal || (user ? isProfileLoadingInternal : false);

  const contextValue = useMemo(() => ({
    user,
    session,
    profile,
    isLoading: finalIsLoading,
    signOut,
  }), [user, session, profile, finalIsLoading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider. Check your component tree and ensure AuthProvider is an ancestor, especially in layout.tsx or equivalent files. If this error persists after confirming the provider setup, try deleting your .next folder and restarting the dev server to clear potential caching issues.');
  }
  return context;
};

