
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
        const error = e as Error; 
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
          // Accurately capture the user state *before* it's updated by setSession/setUser below.
          // This requires `user` not to be in the dependency array of this effect.
          const previousAuthUser = user; 
          const newAuthUser = currentEventSession?.user ?? null;
          
          const isActualUserIdentityChange = newAuthUser?.id !== previousAuthUser?.id;
          const isLoginEvent = event === 'SIGNED_IN' && isActualUserIdentityChange;
          const isLogoutEvent = event === 'SIGNED_OUT';

          if (isLoginEvent || isLogoutEvent) {
            setIsAuthLoadingInternal(true);
            setIsProfileLoadingInternal(true); 
          }
          
          setSession(currentEventSession);
          setUser(newAuthUser);

          if (isLogoutEvent) {
            console.log('User signed out. Clearing profile and user-specific localStorage.');
            if (previousAuthUser?.id) { // Use the captured previousAuthUser
              try {
                localStorage.removeItem(`talkzii_chat_history_${previousAuthUser.id}`);
                localStorage.removeItem(`talkzii_ai_friend_type_${previousAuthUser.id}`);
                localStorage.removeItem(`talkzii_chat_memory_${previousAuthUser.id}`);
                localStorage.removeItem(`talkzii_memory_warning_shown_${previousAuthUser.id}`);
              } catch (e) {
                console.error("Error clearing user-specific localStorage on sign out", e);
              }
            }
            setProfile(null);
            setIsAuthLoadingInternal(false); 
            setIsProfileLoadingInternal(false);
            return; 
          }

          if (newAuthUser) {
            if (isActualUserIdentityChange || 
                (event === 'USER_UPDATED' && newAuthUser.id === previousAuthUser?.id) || 
                !profile || // Profile is null, needs fetch for current user
                (profile && profile.id !== newAuthUser.id) // Profile belongs to a different user
                ) {
              
              if (!isProfileLoadingInternal) setIsProfileLoadingInternal(true); 

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
            setProfile(null); 
            if (isProfileLoadingInternal) setIsProfileLoadingInternal(false); 
          }

          if (isLoginEvent) { 
            setIsAuthLoadingInternal(false);
          }
        } catch (error) { 
          console.error("Critical error in onAuthStateChange handler:", error instanceof Error ? error.message : String(error));
          setSession(null); setUser(null); setProfile(null);
          setIsAuthLoadingInternal(false);
          setIsProfileLoadingInternal(false);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // Ensures this effect runs only once on mount and cleans up on unmount. `user` and `profile` state used inside onAuthStateChange callback will be from the closure of that callback.

  // Effect for handling navigation based on auth state
  useEffect(() => {
    if (isAuthLoadingInternal) { 
      return; 
    }
    const isOnLoginPage = pathname === '/login';
    const isOnSignupPage = pathname === '/signup';

    if (session) { // User is logged in
      if (isOnLoginPage || isOnSignupPage) {
        router.replace('/aipersona'); 
      }
    }
  }, [session, pathname, router, isAuthLoadingInternal]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out: ", error.message || String(error));
    }
  };

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

