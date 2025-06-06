
"use client";

import { useState, type FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/talkzi/Logo';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, UserPlus } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/talkzi/LoadingSpinner';

export default function SignupPage() {
  const router = useRouter();
  const { session, isLoading: isAuthLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!isAuthLoading && session) {
      router.replace('/aipersona');
    }
  }, [session, isAuthLoading, router]);

  const handleSignup = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      toast({ title: "Signup Error", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      toast({ title: "Signup Error", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // options: { data: { full_name: 'Optional Name', gender: 'prefer_not_to_say' } } // Example of metadata, if needed
    });

    setIsLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      toast({
        title: "Signup Failed",
        description: signUpError.message,
        variant: "destructive",
      });
    } else if (data.user && data.user.identities && data.user.identities.length === 0) {
      // This case handles if user exists but is unconfirmed (e.g., social sign-in started but not completed)
      // Or if email confirmation is required but the user already exists with that email.
      setError("This email address is already in use or requires confirmation. Try logging in or check your email for a confirmation link.");
      toast({
        title: "Signup Info",
        description: "This email address is already in use or requires confirmation.",
        variant: "destructive", // Or default
      });
    }
     else if (data.session === null && data.user) {
        setSuccessMessage("Please check your email to confirm your account!");
         toast({
            title: "Confirmation Email Sent!",
            description: "Please check your email to confirm your account and complete signup.",
        });
    } else if (data.user) {
      // User is created and session might be active (depends on Supabase settings e.g. auto-confirm)
      toast({
        title: "Signup Successful!",
        description: "Welcome to Talkzii!",
      });
      // AuthProvider's onAuthStateChange will handle profile creation and redirect
    }
  };

  if (isAuthLoading || (!isAuthLoading && session)) {
    return <LoadingSpinner message="Checking authentication..." />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <Link href="/" passHref className="inline-block">
            <Logo className="h-12 w-auto mb-6 mx-auto" />
          </Link>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground">
            Join Talkzii and find your AI Dost!
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {successMessage && !error && (
          <Alert variant="default" className="bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-300">
            <UserPlus className="h-4 w-4 !text-green-700 dark:!text-green-300" />
            <AlertTitle>Success</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSignup} className="space-y-6 bg-card p-8 rounded-xl shadow-xl neumorphic-shadow-soft">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="neumorphic-shadow-inset-soft"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password (min. 6 characters)"
              required
              className="neumorphic-shadow-inset-soft"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              className="neumorphic-shadow-inset-soft"
            />
          </div>
          <Button type="submit" disabled={isLoading} className="w-full gradient-button text-lg py-3 rounded-lg">
            {isLoading ? 'Signing Up...' : 'Sign Up'}
          </Button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
