
export type AppTheme = 'default' | 'emerald' | 'rose' | 'amber' | 'slate';

export interface Step {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
  reminderAt?: number; // Timestamp for the reminder
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  steps: Step[];
  estimatedDays: number;
}

export interface Journey {
  id: string;
  userId: string; // Linked to a specific user
  title: string;
  description: string;
  category: string;
  createdAt: number;
  milestones: Milestone[];
  progress: number; // 0 to 100
}


export interface User {
  id: string;
  email: string;
  name?: string;
  isPro: boolean;
  avatar?: string;
  createdAt: string; // ISO String
  credits?: number; // New monetization field
  extraGoalSlots?: number;
  streakFreezes?: number; // v2
}

export interface UserStreak {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string; // YYYY-MM-DD
  updated_at: string;
}

export interface UserStats {
  completedJourneys: number;
  activeJourneys: number;
  totalStepsCompleted: number;
}

export interface Blog {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorEmail: string;
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}

