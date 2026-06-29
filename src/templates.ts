import { Task } from "./types";

export interface Template {
  name: string;
  description: string;
  category: "Academic" | "Work" | "Personal" | "Finance" | "Health" | "Projects";
  priority: "Critical" | "High" | "Medium" | "Low";
  consequence: string;
  dependencies: "Yes" | "No";
  tasks: {
    title: string;
    relativeDays: number; // Days from now
    subtasks: { title: string; duration: string; scheduledTime: string }[];
  }[];
}

export const TASK_TEMPLATES: Template[] = [
  {
    name: "Exam Week Survival Plan",
    description: "An elite roadmap to break down notes, run flashcards, and ace your upcoming exams.",
    category: "Academic",
    priority: "Critical",
    consequence: "Grade drops and potential scholarship risk.",
    dependencies: "No",
    tasks: [
      {
        title: "Review Syllabus & Study Guide",
        relativeDays: 1,
        subtasks: [
          { title: "Identify core themes and key formulas", duration: "1.5 hours", scheduledTime: "Day 1 Morning" },
          { title: "Gather lecture slides and relevant notes", duration: "1 hour", scheduledTime: "Day 1 Afternoon" }
        ]
      },
      {
        title: "Create Active Recall Flashcards",
        relativeDays: 3,
        subtasks: [
          { title: "Write Q&As for tricky definitions", duration: "2 hours", scheduledTime: "Day 2 Morning" },
          { title: "Practice first round of active recall", duration: "1.5 hours", scheduledTime: "Day 2 Evening" }
        ]
      },
      {
        title: "Complete 2 Practice Exams",
        relativeDays: 5,
        subtasks: [
          { title: "First mock exam under timed conditions", duration: "2.5 hours", scheduledTime: "Day 3 Afternoon" },
          { title: "Review errors and study weak areas", duration: "2 hours", scheduledTime: "Day 4 Morning" },
          { title: "Second mock exam to verify progress", duration: "2 hours", scheduledTime: "Day 5 Morning" }
        ]
      }
    ]
  },
  {
    name: "Hackathon Preparation",
    description: "Prepare and align details to build a killer software demo in a high-intensity weekend.",
    category: "Projects",
    priority: "High",
    consequence: "Wasted developer effort and incomplete demo.",
    dependencies: "Yes",
    tasks: [
      {
        title: "Brainstorm Ideas & Align Tech Stack",
        relativeDays: 1,
        subtasks: [
          { title: "Research APIs and available tools", duration: "2 hours", scheduledTime: "Day 1 Morning" },
          { title: "Configure project skeleton and Git repo", duration: "1 hour", scheduledTime: "Day 1 Evening" }
        ]
      },
      {
        title: "Build Core Functionality MVP",
        relativeDays: 2,
        subtasks: [
          { title: "Setup API routes and local database sync", duration: "4 hours", scheduledTime: "Day 2 Morning" },
          { title: "Connect front-end elements to state managers", duration: "3 hours", scheduledTime: "Day 2 Afternoon" }
        ]
      },
      {
        title: "Design Demo Video & Polish Presentation",
        relativeDays: 3,
        subtasks: [
          { title: "Record a 2-minute clean screen walkthrough", duration: "1.5 hours", scheduledTime: "Day 3 Morning" },
          { title: "Write concise, value-driven README", duration: "1 hour", scheduledTime: "Day 3 Afternoon" }
        ]
      }
    ]
  },
  {
    name: "Job Application Pipeline",
    description: "Optimize resume, gather referrals, and submit targeted high-quality applications.",
    category: "Work",
    priority: "High",
    consequence: "Missed recruiting cycles and career stalls.",
    dependencies: "No",
    tasks: [
      {
        title: "Tailor Resume & Portfolio",
        relativeDays: 2,
        subtasks: [
          { title: "Align action verbs with target roles", duration: "2 hours", scheduledTime: "Day 1 Morning" },
          { title: "Verify all project links function perfectly", duration: "0.5 hours", scheduledTime: "Day 1 Evening" }
        ]
      },
      {
        title: "Source Referrals & Outreach",
        relativeDays: 4,
        subtasks: [
          { title: "Identify 5 alumni at target companies", duration: "1 hour", scheduledTime: "Day 2 Afternoon" },
          { title: "Draft and send personalized cold messages", duration: "1.5 hours", scheduledTime: "Day 3 Morning" }
        ]
      },
      {
        title: "Submit Target Applications",
        relativeDays: 6,
        subtasks: [
          { title: "Submit first batch of 5 select roles", duration: "2 hours", scheduledTime: "Day 5 Morning" },
          { title: "Log contacts and responses in spreadsheet", duration: "0.5 hours", scheduledTime: "Day 5 Evening" }
        ]
      }
    ]
  },
  {
    name: "Bill Payment Cycle Tracker",
    description: "Safeguard your credit score and clear monthly dues before interest triggers.",
    category: "Finance",
    priority: "Critical",
    consequence: "Late fees and potential credit rating penalties.",
    dependencies: "No",
    tasks: [
      {
        title: "Audit Monthly Statements",
        relativeDays: 1,
        subtasks: [
          { title: "List credit card, rent, and utility balances", duration: "1 hour", scheduledTime: "Day 1 Morning" },
          { title: "Verify zero unauthorized charges exist", duration: "0.5 hours", scheduledTime: "Day 1 Evening" }
        ]
      },
      {
        title: "Schedule Dues & Setup Autopay",
        relativeDays: 2,
        subtasks: [
          { title: "Verify bank funding balances", duration: "0.5 hours", scheduledTime: "Day 2 Morning" },
          { title: "Trigger transfers for priority credit cards", duration: "0.5 hours", scheduledTime: "Day 2 Afternoon" }
        ]
      }
    ]
  },
  {
    name: "Project Launch Checklist",
    description: "Run final end-to-end tests, align server parameters, and announce to early users.",
    category: "Projects",
    priority: "Critical",
    consequence: "Buggy user onboarding and lost initial hype.",
    dependencies: "Yes",
    tasks: [
      {
        title: "Run Critical User-Path Audits",
        relativeDays: 1,
        subtasks: [
          { title: "Test signup, checkout, and state persistence", duration: "2 hours", scheduledTime: "Day 1 Morning" },
          { title: "Inspect console logs for warning errors", duration: "1 hour", scheduledTime: "Day 1 Afternoon" }
        ]
      },
      {
        title: "Harden Security & Configurations",
        relativeDays: 2,
        subtasks: [
          { title: "Deploy secure production rules and keys", duration: "1.5 hours", scheduledTime: "Day 2 Morning" },
          { title: "Configure standard analytic tracking tags", duration: "1 hour", scheduledTime: "Day 2 Afternoon" }
        ]
      },
      {
        title: "Launch & Broadcast",
        relativeDays: 3,
        subtasks: [
          { title: "Publish target announcement on socials", duration: "1.5 hours", scheduledTime: "Day 3 Morning" },
          { title: "Monitor live logs for initial user activity", duration: "2 hours", scheduledTime: "Day 3 Evening" }
        ]
      }
    ]
  },
  {
    name: "Interview Preparation Grid",
    description: "Master behavioral stories and polish key technical skills for final-stage interviews.",
    category: "Work",
    priority: "High",
    consequence: "Candidate rejection and repeating the job hunt.",
    dependencies: "No",
    tasks: [
      {
        title: "Polish 4 Core STAR Stories",
        relativeDays: 1,
        subtasks: [
          { title: "Draft Situation, Task, Action, Result", duration: "2 hours", scheduledTime: "Day 1 Morning" },
          { title: "Refine metrics of impact (e.g., % speedups)", duration: "1 hour", scheduledTime: "Day 1 Afternoon" }
        ]
      },
      {
        title: "Technical Concepts & Coding Run",
        relativeDays: 2,
        subtasks: [
          { title: "Revise high-probability algorithms / questions", duration: "3 hours", scheduledTime: "Day 2 Morning" },
          { title: "Run virtual mock interview exercises", duration: "2 hours", scheduledTime: "Day 2 Evening" }
        ]
      }
    ]
  },
  {
    name: "Research Paper Submission",
    description: "Write, review formatting compliance, edit citations, and finalize submission.",
    category: "Academic",
    priority: "High",
    consequence: "Paper rejection due to guidelines violations.",
    dependencies: "Yes",
    tasks: [
      {
        title: "Format Check & Latex Compilation",
        relativeDays: 2,
        subtasks: [
          { title: "Align paper structure with target style guide", duration: "2 hours", scheduledTime: "Day 1 Morning" },
          { title: "Verify equations render flawlessly", duration: "1 hour", scheduledTime: "Day 1 Afternoon" }
        ]
      },
      {
        title: "Review References & Citations",
        relativeDays: 3,
        subtasks: [
          { title: "Cross-reference every inline citation with bib", duration: "1.5 hours", scheduledTime: "Day 2 Afternoon" },
          { title: "Run final spell and grammar checkers", duration: "1 hour", scheduledTime: "Day 2 Evening" }
        ]
      }
    ]
  }
];
