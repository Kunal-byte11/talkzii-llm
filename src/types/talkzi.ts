
// This UserProfile type is now less central as Clerk manages its own user object.
// It can be used if you fetch and structure additional data from Clerk's publicMetadata
// or if you decide to sync Clerk users to your own database (e.g., Supabase 'profiles' table).
// For now, gender will be accessed from user.publicMetadata.gender directly.
export interface UserProfile {
  id: string; // Clerk User ID
  username?: string | null; // From Clerk: user.username
  email?: string; // From Clerk: user.primaryEmailAddress.emailAddress
  gender?: 'male' | 'female' | 'prefer_not_to_say' | string; // From Clerk: user.publicMetadata.gender
  // Clerk's user object has more fields like firstName, lastName, imageUrl, etc.
  // You can extend this interface or access them directly from the Clerk user object.
  created_at?: string; // Clerk: user.createdAt (Date object)
  updated_at?: string; // Clerk: user.updatedAt (Date object)
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

// Define how gender is expected in Clerk's public metadata
declare global {
  interface UserPublicMetadata {
    gender?: 'male' | 'female' | 'prefer_not_to_say' | string;
  }
}
