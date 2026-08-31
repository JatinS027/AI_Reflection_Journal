export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export type JournalCategory = 
  | 'reflection'
  | 'gratitude'
  | 'brainstorm'
  | 'problem_solving'
  | 'mindfulness'
  | 'career_growth';

export type JournalMood = 
  | 'calm'
  | 'inspired'
  | 'anxious'
  | 'grateful'
  | 'overwhelmed'
  | 'motivated'
  | 'reflective';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  category: JournalCategory;
  mood?: JournalMood;
  prompt: string;
  response: string;
  summary?: string;
  keyInsights?: string[];
  actionItems?: string[];
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ReflectionRequest {
  prompt: string;
  category?: JournalCategory;
  mood?: JournalMood;
  title?: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
}

export interface SummarizeRequest {
  title?: string;
  prompt: string;
  response: string;
  messages?: ChatMessage[];
}
