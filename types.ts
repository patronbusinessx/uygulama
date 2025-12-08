
export interface NavItem {
  id: string;
  label: string;
  icon: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string; // Base64 string
  timestamp: number;
  isStreaming?: boolean;
}

export enum GeminiModel {
  FLASH = 'gemini-2.5-flash',
  PRO = 'gemini-3-pro-preview' // Used for complex tasks if needed
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string; // In a real app, never store plain text passwords
  avatar?: string;
  joinedDate: number;
  role: 'user' | 'admin';
  membershipTier: 'free' | 'pro'; // Added Membership Tier
  isBanned?: boolean;
  savedPostIds: string[]; // List of IDs of posts liked/saved by the user
}

export interface Post {
  id: string;
  title: string;
  description?: string;
  author: string;
  imageUrl: string;
  prompt: string;
  timestamp: number;
  authorId?: string; // Optional for backward compatibility with mocks
  likeCount: number;
}

export interface ContactMessage {
  id: string;
  userId?: string;
  userName: string;
  subject: string;
  message: string;
  timestamp: number;
  status: 'new' | 'read';
}

export interface UserReport {
  id: string;
  userId?: string;
  type: 'Bug' | 'Inappropriate Content' | 'Copyright' | 'Other';
  relatedId?: string;
  description: string;
  status: 'Pending' | 'Reviewed' | 'Resolved';
  timestamp: number;
}
