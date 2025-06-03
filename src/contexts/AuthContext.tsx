
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
          console.error("Error fetching initial session:", sessionError.message || JSON.stringify(sessionError));
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
            if (profileFetchError && profileFetchError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine for new users
              console.error('Initial profile fetch error:', profileFetchError.message || JSON.stringify(profileFetchError));
            }
            setProfile(userProfile as UserProfile | null);
          } else {
            setProfile(null);
          }
        }
      } catch (e: unknown) {
        const error = e as Error;
        console.error("Critical error during initial data fetch (AuthProvider):", error.message, e);
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
        console.log(`Auth Event: ${event}`, currentEventSession);

        const newAuthUser = currentEventSession?.user ?? null;
        const previousUser = user; // Get user state *before* it's updated by this event

        // Update core session and user state immediately
        setSession(currentEventSession);
        setUser(newAuthUser);

        const isActualUserIdentityChange = newAuthUser?.id !== previousUser?.id;
        const isLoginEvent = event === 'SIGNED_IN' && isActualUserIdentityChange;
        const isLogoutEvent = event === 'SIGNED_OUT';

        // Set global loading flags only for significant, disruptive changes
        if (isLoginEvent || isLogoutEvent) {
          setIsAuthLoadingInternal(true);
          setIsProfileLoadingInternal(true); // Profile will need fetch or clear
        } else if (event === 'USER_UPDATED' && newAuthUser?.id === previousUser?.id) {
          // User's own data updated (e.g., email change verified), profile needs re-fetch
          // Auth state itself might be stable, but profile data isn't.
          setIsProfileLoadingInternal(true);
        }
        // For TOKEN_REFRESHED or INITIAL_SESSION (if user is same), avoid setting global loading flags
        // to prevent UI flashing "Preparing..."

        if (isLogoutEvent) {
          console.log('User signed out. Clearing profile and localStorage.');
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
          setIsAuthLoadingInternal(false); // Reset loading flags
          setIsProfileLoadingInternal(false);
          return;
        }

        if (newAuthUser) {
          // Fetch profile if:
          // 1. User identity actually changed (isActualUserIdentityChange).
          // 2. Event is USER_UPDATED (Supabase indicates user object on their end changed).
          // 3. Profile is currently null for this newAuthUser (could be initial load for this user).
          if (isActualUserIdentityChange || (event === 'USER_UPDATED' && newAuthUser.id === previousUser?.id) || !profile || profile.id !== newAuthUser.id ) {
             // Ensure profile loading is true if we are about to fetch and it wasn't set by the more global flags
            if (!isProfileLoadingInternal && (isActualUserIdentityChange || (event === 'USER_UPDATED' && newAuthUser.id === previousUser?.id) || !profile || profile.id !== newAuthUser.id)) {
                setIsProfileLoadingInternal(true);
            }

            const { data: userProfileData, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newAuthUser.id)
              .single();
            
            if (profileError && profileError.code !== 'PGRST116') { 
              console.error('Profile fetch error on auth change:', profileError.message || JSON.stringify(profileError)); 
            }
            setProfile(userProfileData as UserProfile | null);
            setIsProfileLoadingInternal(false); // Profile fetch attempt complete
          }
        } else { // No newAuthUser
          setProfile(null);
          setIsProfileLoadingInternal(false); // No user, so profile loading is definitively false.
        }

        // Reset auth loading if it was a significant event
        if (isLoginEvent || isLogoutEvent) {
          setIsAuthLoadingInternal(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]); // Rerun this effect if the `user` state (from the provider's scope) changes.
                // This ensures `previousUser` in the callback closure is reasonably up-to-date
                // for comparison against incoming `newAuthUser`.

  // Effect for handling navigation based on auth state
  useEffect(() => {
    if (isAuthLoadingInternal) { // Only wait for the core auth check
      return; 
    }
    const isOnAuthPage = pathname === '/auth';
    if (session) { // User is logged in
      if (isOnAuthPage) {
        router.push('/aipersona');
      }
    }
  }, [session, pathname, router, isAuthLoadingInternal]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out: ", error.message || JSON.stringify(error));
    }
    // onAuthStateChange will handle setting user/session/profile to null
  };

  // isLoading exposed to consumers should consider both auth and profile if a user exists
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

