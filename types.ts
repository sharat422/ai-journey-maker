
export interface Step {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
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
  title: string;
  description: string;
  category: string;
  createdAt: number;
  milestones: Milestone[];
  progress: number; // 0 to 100
}

export interface UserStats {
  completedJourneys: number;
  activeJourneys: number;
  totalStepsCompleted: number;
}
