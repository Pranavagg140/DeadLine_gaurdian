export interface Subtask {
  title: string;
  duration: string;
  scheduledTime: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  deadline: string; // ISO string
  category: "Academic" | "Work" | "Personal" | "Finance" | "Health" | "Projects";
  priority: "Critical" | "High" | "Medium" | "Low";
  consequence: string;
  dependencies: "Yes" | "No";
  completed: boolean;
  createdAt: string;

  // Calculated and AI fields
  priorityScore: number; // 1 to 10
  urgencyLevel: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  estimatedHours?: number;
  suggestedStartTime?: string;
  subtasks: Subtask[];
  procrastinationRisk?: "HIGH" | "MEDIUM" | "LOW";
  aiInsight?: string;
  firstAction?: string;
  isAiBrokenDown?: boolean;
}

export interface Habit {
  id: string;
  title: string;
  streak: number;
  history: { [dateStr: string]: boolean }; // YYYY-MM-DD -> completed (true/false)
  lastCompletedDate?: string; // YYYY-MM-DD
}

export interface DailyPlan {
  date: string;
  productivityForecast: string;
  timeBlocks: {
    time: string;
    task: string;
    priority: string;
    duration: string;
  }[];
  top3Focus: string[];
  totalWorkHours: number;
  bufferTime: number;
  motivationalMessage: string;
}

export interface UserProfile {
  name: string;
  availableHours: number;
  commitments: string;
  mood: "tired" | "stressed" | "overwhelmed" | "energetic" | "focused" | "neutral";
  isPremiumAgentMode: boolean;
}
