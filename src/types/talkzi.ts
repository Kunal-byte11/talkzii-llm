
// This UserProfile type is for Supabase user profiles.
// Gender is stored in the 'profiles' table.
export interface UserProfile {
  id: string; // Matches Supabase auth.users.id
  username?: string | null;
  email?: string; // Usually from auth.users table, can be denormalized here
  gender?: 'male' | 'female' | 'prefer_not_to_say' | string; // From 'profiles' table
  created_at?: string;
  updated_at?: string;
  // Add any other fields from your Supabase 'profiles' table
}


export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: number;
  isLoading?: boolean;
  isCrisis?: boolean;
  feedback?: 'liked' | 'disliked' | null; 
  userPromptText?: string; 
  personaImage?: string;
  aiBubbleColor?: string; // For persona-specific AI bubble background
  aiTextColor?: string; // For persona-specific AI bubble text
}

// No Clerk-specific UserPublicMetadata needed now.
