import { Task, Habit } from "./types";

/**
 * Calculates the dynamic urgency/priority score from 1 to 10 based on the formula:
 * - Deadline Proximity (40%)
 * - User Importance (30%)
 * - Consequence Severity (20%)
 * - Dependency Factor (10%)
 */
export function calculatePriorityScore(
  deadlineStr: string,
  userPriority: "Critical" | "High" | "Medium" | "Low",
  consequence: string | number, // can be string or 1-5 scale rating
  dependencies: "Yes" | "No",
  isCompleted: boolean
): { score: number; urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" } {
  if (isCompleted) {
    return { score: 0, urgency: "LOW" };
  }

  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // 1. Proximity Score (40% weight)
  // overdue/≤12h=10, ≤24h=9.5, ≤48h=8.5, ≤72h=7.5, ≤7days=5, far=2
  let proxScore = 1;
  if (diffHours <= 12) {
    proxScore = 10; // Overdue or <=12h
  } else if (diffHours <= 24) {
    proxScore = 9.5;
  } else if (diffHours <= 48) {
    proxScore = 8.5;
  } else if (diffHours <= 72) {
    proxScore = 7.5;
  } else if (diffHours <= 168) {
    proxScore = 5.0; // <= 7 days
  } else {
    proxScore = 2.0; // Far out
  }

  // 2. User Importance Score (30% weight)
  // Critical=10, High=8, Medium=5, Low=2
  let impScore = 5;
  if (userPriority === "Critical") impScore = 10;
  else if (userPriority === "High") impScore = 8;
  else if (userPriority === "Medium") impScore = 5;
  else if (userPriority === "Low") impScore = 2;

  // 3. Consequence Severity (20% weight)
  // explicit+severe=8, implied=4, none=1
  let consScore = 1;
  if (typeof consequence === "number") {
    if (consequence >= 4) consScore = 8;
    else if (consequence >= 2) consScore = 4;
    else consScore = 1;
  } else {
    const text = (consequence || "").toLowerCase().trim();
    if (!text || text === "none" || text.includes("no explicit consequence") || text.includes("none specified")) {
      consScore = 1;
    } else if (
      text.includes("fail") || 
      text.includes("miss") || 
      text.includes("penalty") || 
      text.includes("fired") || 
      text.includes("severe") || 
      text.includes("lose") || 
      text.includes("disaster") || 
      text.includes("ruin") || 
      text.includes("grade drop")
    ) {
      consScore = 8;
    } else {
      consScore = 4;
    }
  }

  // 4. Dependency Score (10% weight)
  // Yes=10, No=2
  const depScore = dependencies === "Yes" ? 10 : 2;

  // Weighted score calculation
  const totalScore = parseFloat(
    (proxScore * 0.4 + impScore * 0.3 + consScore * 0.2 + depScore * 0.1).toFixed(1)
  );

  // Determine urgency band: 9–10=CRITICAL | 7–8=HIGH | 4–6=MEDIUM | 1–3=LOW
  let urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (totalScore >= 9.0) urgency = "CRITICAL";
  else if (totalScore >= 7.0) urgency = "HIGH";
  else if (totalScore >= 4.0) urgency = "MEDIUM";
  else urgency = "LOW";

  return { score: totalScore, urgency };
}

/**
 * Returns a friendly countdown display of remaining time
 */
export function getCountdownString(deadlineStr: string): {
  display: string;
  hoursLeft: number;
  isOverdue: boolean;
  alertLevel: "emergency" | "action" | "gentle" | "safe";
} {
  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (diffMs <= 0) {
    return {
      display: "Overdue",
      hoursLeft: diffHours,
      isOverdue: true,
      alertLevel: "emergency",
    };
  }

  const days = Math.floor(diffHours / 24);
  const hours = Math.floor(diffHours % 24);
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

  let display = "";
  if (days > 0) {
    display = `${days}d ${hours}h`;
  } else if (hours > 0) {
    display = `${hours}h ${minutes}m`;
  } else {
    display = `${minutes}m remaining`;
  }

  let alertLevel: "emergency" | "action" | "gentle" | "safe" = "safe";
  if (diffHours <= 24) alertLevel = "emergency"; // Less than 1 day
  else if (diffHours <= 72) alertLevel = "action"; // Less than 3 days
  else if (diffHours <= 168) alertLevel = "gentle"; // Less than 7 days

  return {
    display,
    hoursLeft: diffHours,
    isOverdue: false,
    alertLevel,
  };
}

/**
 * Sync status check for a broken habit streak. Provides 20-min catch-up plan.
 */
export function getHabitCatchUpPlan(habitTitle: string): string {
  return `You missed "${habitTitle}" recently. Here's a 20-minute rapid catch-up plan to get back in the zone:
1. Minute 0-5: Tiny Action - Just set up your space or open the relevant application.
2. Minute 5-15: Focus Sprint - Spend 10 minutes doing the easiest, lowest-barrier part of the habit (e.g., read 2 pages, do 1 coding puzzle).
3. Minute 15-20: Gratitude & Log - Check it off and celebrate keeping the streak alive!`;
}
