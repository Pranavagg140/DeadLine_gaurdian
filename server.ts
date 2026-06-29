import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
  console.log("Gemini Client successfully initialized server-side.");
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI functions will fall back to simulated state.");
}

// ----------------- Resilient Gemini SDK Generation Helper -----------------
async function generateResilientContent(ai: GoogleGenAI, config: any) {
  const modelsToTry = ["gemini-3.5-flash", "gemini-3.1-flash-lite"];
  let lastError = null;

  for (const model of modelsToTry) {
    let retries = 2;
    while (retries > 0) {
      try {
        console.log(`Attempting Gemini generation with model: ${model} (${retries} retries left)`);
        const response = await ai.models.generateContent({
          ...config,
          model: model,
        });
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`Gemini API Error with ${model}:`, err.message || err);
        retries--;
        if (retries > 0) {
          // Wait briefly before retrying
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }
  }
  throw lastError || new Error("Failed to generate content with all models");
}

// ----------------- Customized Local Fallback Generators -----------------

function generateDynamicBreakdownFallback(title: string, deadline: string, priority: string, consequence: string, dependencies: string) {
  const urgencyLevel = (priority || "Medium").toUpperCase();
  const daysDiff = Math.max(1, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
  
  let pScore = 5;
  if (urgencyLevel === "CRITICAL") pScore = 10;
  else if (urgencyLevel === "HIGH") pScore = 8;
  else if (urgencyLevel === "MEDIUM") pScore = 5;
  else if (urgencyLevel === "LOW") pScore = 3;

  if (dependencies === "Yes") pScore = Math.min(10, pScore + 1);
  if (consequence && consequence !== "None specified") pScore = Math.min(10, pScore + 1);

  return {
    taskName: title,
    deadline,
    priorityScore: pScore,
    urgencyLevel: urgencyLevel,
    estimatedHours: pScore * 1.5,
    suggestedStartTime: new Date(Date.now() + 2 * 3600000).toISOString(),
    subtasks: [
      { title: `Review objectives & gather reference files for: ${title}`, duration: "1.5 hours", scheduledTime: "Day 1 Morning" },
      { title: `Deep focus core execution & draft solution`, duration: `${Math.round(pScore * 0.8)} hours`, scheduledTime: "Day 1 Afternoon" },
      { title: `Polish, verify compliance, and secure final submission for ${title}`, duration: "1.5 hours", scheduledTime: `Day ${Math.max(2, Math.round(daysDiff / 2))} Morning` }
    ],
    procrastinationRisk: pScore >= 8 ? "HIGH" : pScore >= 5 ? "MEDIUM" : "LOW",
    aiInsight: consequence && consequence !== "None specified" 
      ? `High-stakes task! Failing this carries serious impact: "${consequence}". Take the first micro-step right now.`
      : `Let's work steadily. By breaking this down into bite-sized tasks, you prevent eleventh-hour panic.`,
    firstAction: "Write down the absolute smallest action item to gain positive momentum."
  };
}

function generateDynamicDailyPlanFallback(tasks: any[], availableHours: number, mood: string) {
  const date = new Date().toLocaleDateString();
  const limitHours = availableHours || 8;
  const moodLower = (mood || "Normal").toLowerCase();

  const activeTasks = tasks.filter(t => !t.completed);

  let productivityForecast = "Your schedule has been optimized using local Guardian heuristics.";
  let motivationalMessage = "Small, consistent steps are the key to overcoming procrastination.";

  if (moodLower === "tired" || moodLower === "stressed" || moodLower === "overwhelmed") {
    productivityForecast = "Low energy levels detected. We scaled back non-essential work to keep your stress low.";
    motivationalMessage = "Be gentle with yourself. Just aim for one small win today.";
  } else if (moodLower === "energetic" || moodLower === "focused") {
    productivityForecast = "High energy levels detected! Let's stack deep focus blocks and build great momentum.";
    motivationalMessage = "Your focus is at peak levels today. Build a safe buffer ahead of deadlines!";
  }

  const timeBlocks: any[] = [];
  let currentHour = 9;
  let currentMin = 0;

  const addTimeBlock = (taskTitle: string, durationMin: number, priority: string) => {
    const startHourStr = String(currentHour).padStart(2, "0");
    const startMinStr = String(currentMin).padStart(2, "0");

    currentMin += durationMin;
    while (currentMin >= 60) {
      currentHour += 1;
      currentMin -= 60;
    }

    const endHourStr = String(currentHour).padStart(2, "0");
    const endMinStr = String(currentMin).padStart(2, "0");

    timeBlocks.push({
      time: `${startHourStr}:${startMinStr} - ${endHourStr}:${endMinStr}`,
      task: taskTitle,
      priority: priority.toUpperCase(),
      duration: durationMin >= 60 ? `${durationMin / 60} hours` : `${durationMin} mins`
    });
  };

  const priorityOrder = { "CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1 };
  const getPriorityWeight = (p: string) => {
    const key = (p || "medium").toUpperCase();
    return (priorityOrder as any)[key] || 2;
  };

  const sortedTasks = [...activeTasks].sort((a, b) => getPriorityWeight(b.priority) - getPriorityWeight(a.priority));

  const workRatio = (moodLower === "tired" || moodLower === "stressed" || moodLower === "overwhelmed") ? 0.6 : 0.8;
  const maxWorkMinutes = Math.min(limitHours, 12) * 60 * workRatio;
  let totalScheduledMinutes = 0;

  for (const t of sortedTasks) {
    if (totalScheduledMinutes >= maxWorkMinutes) break;
    
    let duration = 90; // 1.5 hours
    if (t.priority === "Critical" || t.priority === "High") {
      duration = 120; // 2 hours
    } else if (t.priority === "Low") {
      duration = 60; // 1 hour
    }

    if (totalScheduledMinutes + duration > maxWorkMinutes) {
      duration = maxWorkMinutes - totalScheduledMinutes;
    }

    if (duration <= 15) break;

    addTimeBlock(t.title, duration, t.priority || "Medium");
    totalScheduledMinutes += duration;

    if (totalScheduledMinutes < maxWorkMinutes) {
      const breakDuration = (moodLower === "tired" || moodLower === "stressed" || moodLower === "overwhelmed") ? 15 : 10;
      addTimeBlock("Mindful breathing space & posture check", breakDuration, "LOW");
      totalScheduledMinutes += breakDuration;
    }
  }

  if (timeBlocks.length === 0) {
    addTimeBlock("Review all active project deadlines & clean workspace", 60, "HIGH");
    addTimeBlock("Stretch & hydration break", 15, "LOW");
    addTimeBlock("Execute 3 quick-win small tasks", 90, "MEDIUM");
    totalScheduledMinutes = 165;
  }

  const top3Focus = sortedTasks.slice(0, 3).map(t => t.title);
  while (top3Focus.length < 3) {
    if (top3Focus.length === 0) top3Focus.push("Identify today's single most critical milestone");
    else if (top3Focus.length === 1) top3Focus.push("Review dependent deadlines and clear blockers");
    else top3Focus.push("Keep a structured buffer for unexpected tasks");
  }

  return {
    date,
    productivityForecast,
    timeBlocks,
    top3Focus,
    totalWorkHours: Number((totalScheduledMinutes / 60).toFixed(1)),
    bufferTime: Number((limitHours - (totalScheduledMinutes / 60)).toFixed(1)),
    motivationalMessage
  };
}

function fallbackParseDeadlines(text: string) {
  const lines = text.split("\n").map(l => l.trim()).filter(l => l.length > 5);
  const extractedTasks: any[] = [];
  
  for (const line of lines) {
    const lineLower = line.toLowerCase();
    if (lineLower.includes("due") || lineLower.includes("deadline") || lineLower.includes("before") || lineLower.includes("by") || lineLower.includes("must")) {
      extractedTasks.push({
        title: line.substring(0, 80),
        deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
        category: "Projects",
        priority: "High",
        consequence: "Project milestone delay",
        hasDate: false
      });
    }
  }
  
  if (extractedTasks.length === 0 && lines.length > 0) {
    extractedTasks.push({
      title: lines[0].substring(0, 80),
      deadline: new Date(Date.now() + 86400000 * 2).toISOString(),
      category: "General",
      priority: "Medium",
      consequence: "Incomplete task from pasted text",
      hasDate: false
    });
  }
  
  return { extractedTasks };
}

// ----------------- Helper: Priority Score Calculation -----------------
function calculatePriorityScoreBackend(
  deadlineStr: string,
  userPriority: string,
  consequence: string,
  dependencies: string
): { score: number; urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" } {
  const now = new Date();
  const deadline = new Date(deadlineStr);
  const diffMs = deadline.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  // 1. Proximity Score (40% weight)
  // overdue/≤12h=10, ≤24h=9.5, ≤48h=8.5, ≤72h=7.5, ≤7days=5, far=2
  let proxScore = 1;
  if (diffHours <= 12) {
    proxScore = 10;
  } else if (diffHours <= 24) {
    proxScore = 9.5;
  } else if (diffHours <= 48) {
    proxScore = 8.5;
  } else if (diffHours <= 72) {
    proxScore = 7.5;
  } else if (diffHours <= 168) {
    proxScore = 5.0;
  } else {
    proxScore = 2.0;
  }

  // 2. User Importance Score (30% weight)
  // Critical=10, High=8, Medium=5, Low=2
  let impScore = 5;
  const pLower = (userPriority || "").toLowerCase();
  if (pLower === "critical") impScore = 10;
  else if (pLower === "high") impScore = 8;
  else if (pLower === "medium") impScore = 5;
  else if (pLower === "low") impScore = 2;

  // 3. Consequence Severity (20% weight)
  // explicit+severe=8, implied=4, none=1
  let consScore = 1;
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

  // 4. Dependency Score (10% weight)
  // Yes=10, No=2
  const depScore = (dependencies || "").toLowerCase() === "yes" ? 10 : 2;

  const totalScore = parseFloat(
    (proxScore * 0.4 + impScore * 0.3 + consScore * 0.2 + depScore * 0.1).toFixed(1)
  );

  let urgency: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (totalScore >= 9.0) urgency = "CRITICAL";
  else if (totalScore >= 7.0) urgency = "HIGH";
  else if (totalScore >= 4.0) urgency = "MEDIUM";
  else urgency = "LOW";

  return { score: totalScore, urgency };
}

// ----------------- API ROUTE: Break Down Task into Subtasks -----------------
app.post("/api/gemini/breakdown", async (req, res) => {
  const { title, deadline, category, priority, consequence, dependencies } = req.body;

  if (!title || !deadline) {
    return res.status(400).json({ error: "Missing required fields: title, deadline" });
  }

  const getFallback = () => generateDynamicBreakdownFallback(title, deadline, priority, consequence, dependencies);

  // Calculate parameters for programmatic enforcement
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const diffHours = (deadlineDate.getTime() - now.getTime()) / (3600 * 1000);

  let requiredSubtasks = 6;
  if (diffHours < 24) requiredSubtasks = 3;
  else if (diffHours <= 72) requiredSubtasks = 4;
  else if (diffHours <= 168) requiredSubtasks = 5;

  const scoreObj = calculatePriorityScoreBackend(deadline, priority, consequence, dependencies);

  if (!ai) {
    const fallbackData = getFallback();
    fallbackData.priorityScore = scoreObj.score;
    fallbackData.urgencyLevel = scoreObj.urgency;
    fallbackData.procrastinationRisk = scoreObj.score >= 8 ? "HIGH" : scoreObj.score >= 5 ? "MEDIUM" : "LOW";
    return res.json(fallbackData);
  }

  try {
    const prompt = `Break down this task into structured subtasks, score priority, and provide an action plan.
Task Title: ${title}
Deadline: ${deadline}
Category: ${category || "General"}
User Priority Level: ${priority || "Medium"}
Consequence: ${consequence || "None specified"}
Dependencies: ${dependencies || "No"}
Current Time is: ${new Date().toISOString()}

RULES TO STRICTLY ENFORCE:
- PRIORITY SCORE Formula:
  40% -> deadline proximity: overdue/<=12h=10, <=24h=9.5, <=48h=8.5, <=72h=7.5, <=7days=5, far=2
  30% -> user priority: Critical=10, High=8, Medium=5, Low=2
  20% -> consequence severity: explicit+severe=8, implied=4, none=1
  10% -> dependencies: Yes=10, No=2
  Determine urgencyLevel: 9-10=CRITICAL, 7-8=HIGH, 4-6=MEDIUM, 1-3=LOW.
- SUBTASK RULES:
  We need EXACTLY ${requiredSubtasks} subtasks based on deadline proximity of ${diffHours.toFixed(1)} hours.
  First subtask MUST be completable in <30 minutes (micro-momentum builder).
  Last subtask MUST be "Submit / Deliver / Finalize".
- PROCRASTINATION RISK:
  HIGH: score >= 8 OR deadline < 48h and no subtasks completed
  MEDIUM: score 5-7 OR deadline 2-5 days
  LOW: score < 5 AND deadline > 5 days
- AI INSIGHT:
  High risk: Use urgency, reference "${consequence}" explicitly, make it real.
  Stressed/tired: Acknowledge feelings first, then plan.
  2-4 sentences max, end with ONE concrete reassurance.
- FIRST ACTION:
  Hyper-specific action under 5 minutes to start (e.g. "Open Google Doc and paste your homework title").`;

    const response = await generateResilientContent(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are Deadline Guardian, an elite coaching companion. Never say you are an AI. Speak with firm, empathetic coaching style, referencing actual task titles, deadlines, and consequences.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            taskName: { type: Type.STRING },
            deadline: { type: Type.STRING },
            priorityScore: { type: Type.INTEGER },
            urgencyLevel: { type: Type.STRING },
            estimatedHours: { type: Type.NUMBER },
            suggestedStartTime: { type: Type.STRING },
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.STRING },
                  scheduledTime: { type: Type.STRING }
                },
                required: ["title", "duration", "scheduledTime"]
              }
            },
            procrastinationRisk: { type: Type.STRING },
            aiInsight: { type: Type.STRING },
            firstAction: { type: Type.STRING }
          },
          required: [
            "taskName", "deadline", "priorityScore", "urgencyLevel",
            "estimatedHours", "suggestedStartTime", "subtasks",
            "procrastinationRisk", "aiInsight", "firstAction"
          ]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");

    // Enforce compliance programmatically on top of Gemini
    data.priorityScore = scoreObj.score;
    data.urgencyLevel = scoreObj.urgency;
    data.procrastinationRisk = scoreObj.score >= 8 ? "HIGH" : scoreObj.score >= 5 ? "MEDIUM" : "LOW";

    if (data.subtasks && Array.isArray(data.subtasks)) {
      if (data.subtasks.length !== requiredSubtasks) {
        // Enforce subtasks count
        if (data.subtasks.length > requiredSubtasks) {
          data.subtasks = data.subtasks.slice(0, requiredSubtasks);
        } else {
          while (data.subtasks.length < requiredSubtasks) {
            data.subtasks.push({
              title: `Execution Checkpoint ${data.subtasks.length + 1}`,
              duration: "45 minutes",
              scheduledTime: "Upcoming Session"
            });
          }
        }
      }
      // First subtask under 30 min
      if (data.subtasks.length > 0) {
        data.subtasks[0].duration = "20 minutes";
        if (!data.subtasks[0].title.toLowerCase().includes("micro") && !data.subtasks[0].title.toLowerCase().includes("setup")) {
          data.subtasks[0].title = "Micro-Start: " + data.subtasks[0].title;
        }
      }
      // Last subtask Submit / Deliver / Finalize
      if (data.subtasks.length > 0) {
        data.subtasks[data.subtasks.length - 1].title = "Submit / Deliver / Finalize";
        data.subtasks[data.subtasks.length - 1].duration = "15 minutes";
      }
    }

    res.json(data);
  } catch (error: any) {
    console.warn("Task Breakdown Error (falling back to local):", error.message || error);
    const fallbackData = getFallback();
    fallbackData.priorityScore = scoreObj.score;
    fallbackData.urgencyLevel = scoreObj.urgency;
    fallbackData.procrastinationRisk = scoreObj.score >= 8 ? "HIGH" : scoreObj.score >= 5 ? "MEDIUM" : "LOW";
    res.json(fallbackData);
  }
});

// ----------------- API ROUTE: Daily Schedule Planner -----------------
app.post("/api/gemini/daily-plan", async (req, res) => {
  const { tasks, availableHours, commitments, mood } = req.body;

  if (!tasks || !Array.isArray(tasks)) {
    return res.status(400).json({ error: "Missing tasks array" });
  }

  const getFallback = () => generateDynamicDailyPlanFallback(tasks, availableHours, mood);

  if (!ai) {
    return res.json(getFallback());
  }

  try {
    const prompt = `Create a customized daily plan schedule for today based on these constraints:
Available Work Hours: ${availableHours || 8} hours
Fixed Commitments: ${commitments || "None"}
User's Mood/Energy: ${mood || "neutral"}
Pending Tasks: ${JSON.stringify(tasks, null, 2)}
Current Date: ${new Date().toLocaleDateString()}

RULES TO STRICTLY ENFORCE:
- MOOD RULES:
  * tired/stressed/overwhelmed: Use 60% of available hours. First block = easiest win (<30 min). 15-min breathing breaks. Gentle supportive tone.
  * energetic/focused: Use 85% of available hours. Stack hard tasks in morning. 90-min deep work blocks. Ambitious tone.
  * neutral: Use 75% of available hours. Alternate CRITICAL and MEDIUM tasks. Standard 90-min blocks with 10-min breaks.
- SCHEDULING RULES:
  * Never exceed 80% of availableHours (buffer rule).
  * Respect fixed commitments — skip those windows.
  * Start at 09:00 unless context says otherwise.
  * Minimum 1 break per 2 work blocks.
  * top3Focus: EXACTLY 3 items (#1=most critical, #2=second, #3=quickest win).
  * Time format: "HH:MM - HH:MM" (24h).`;

    const response = await generateResilientContent(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are Deadline Guardian. Craft actionable, highly personalized daily plans in strict JSON. Speak like a firm, empathetic coach. Never mention you are an AI.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            productivityForecast: { type: Type.STRING },
            timeBlocks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  time: { type: Type.STRING },
                  task: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  duration: { type: Type.STRING }
                },
                required: ["time", "task", "priority", "duration"]
              }
            },
            top3Focus: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            totalWorkHours: { type: Type.NUMBER },
            bufferTime: { type: Type.NUMBER },
            motivationalMessage: { type: Type.STRING }
          },
          required: [
            "date", "productivityForecast", "timeBlocks", "top3Focus",
            "totalWorkHours", "bufferTime", "motivationalMessage"
          ]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    
    // Ensure top3Focus is exactly 3 items
    if (data.top3Focus && Array.isArray(data.top3Focus)) {
      if (data.top3Focus.length > 3) data.top3Focus = data.top3Focus.slice(0, 3);
      while (data.top3Focus.length < 3) {
        data.top3Focus.push("Establish a proactive buffer block");
      }
    }

    res.json(data);
  } catch (error: any) {
    console.warn("Daily Planner Error (falling back to local):", error.message || error);
    res.json(getFallback());
  }
});

// ----------------- API ROUTE: Extract Deadlines from Text -----------------
app.post("/api/gemini/parse-deadline", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing text to parse" });
  }

  const getFallback = () => fallbackParseDeadlines(text);

  if (!ai) {
    return res.json(getFallback());
  }

  try {
    const prompt = `Review this notice, email, or message, detect any deadlines, dates, times, or tasks, and extract them into a structured task list format.
Input Text:
"""
${text}
"""
Current Local Time: ${new Date().toISOString()}

RULES TO STRICTLY ENFORCE:
- DETECT: "due", "by", "before", "submit", "deadline", "ASAP", "EOD", "this Friday", "next Monday", explicit dates like "June 30"
- Resolve relative dates to ISO using current time: ${new Date().toISOString()}
- No date found → default = currentTime + 72 hours, hasDate=false
- Extract ALL deadlines, not just first one
- Category inference:
  * assignment/exam/quiz → Academic
  * meeting/report → Work
  * payment/bill/EMI → Finance
  * doctor/medicine → Health
  * project/launch → Projects
  * default → Personal
- Priority inference:
  * "urgent/ASAP/critical" → Critical
  * "important/penalty" → High
  * "please/reminder" → Medium
  * neutral → Low
- NEVER hallucinate tasks not in the text.`;

    const response = await generateResilientContent(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are Deadline Guardian. Extract tasks and deadlines with high fidelity. Never invent details.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  consequence: { type: Type.STRING },
                  hasDate: { type: Type.BOOLEAN }
                },
                required: ["title", "deadline", "category", "priority", "consequence", "hasDate"]
              }
            }
          },
          required: ["extractedTasks"]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || '{"extractedTasks":[]}');
    res.json(data);
  } catch (error: any) {
    console.warn("Deadline Parser Error (falling back to local):", error.message || error);
    res.json(getFallback());
  }
});

// ----------------- API ROUTE: Voice Input Parser -----------------
app.post("/api/gemini/voice-parse", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Missing voice input text" });
  }

  const getFallback = () => {
    return {
      extractedTasks: [
        {
          title: text.replace(/remind me to/i, "").trim(),
          deadline: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
          category: "Personal",
          priority: "Medium",
          consequence: "Task added via voice command.",
          hasDate: false
        }
      ],
      confirmationMessage: `Understood. I have recorded your task and scheduled it for tomorrow. Let's attack it together!`
    };
  };

  if (!ai) {
    return res.json(getFallback());
  }

  try {
    const prompt = `Extract tasks and deadlines from this natural voice command:
Voice Input: "${text}"
Current Timestamp: ${new Date().toISOString()}

EXTRACT:
- task title (clean, action-oriented)
- deadline (resolve relative time to ISO using current timestamp)
- category (infer from: Academic, Work, Projects, Finance, Health, Personal)
- priority (Critical, High, Medium, Low)
- consequence (infer or use "Task added via voice command")
- confirmationMessage: friendly 1-sentence confirmation to show user. Speak like a firm, empathetic coach.`;

    const response = await generateResilientContent(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are Deadline Guardian. Convert messy voice commands into structured actionable tasks. Never say you are an AI.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            extractedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  deadline: { type: Type.STRING },
                  category: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  consequence: { type: Type.STRING },
                  hasDate: { type: Type.BOOLEAN }
                },
                required: ["title", "deadline", "category", "priority", "consequence", "hasDate"]
              }
            },
            confirmationMessage: { type: Type.STRING }
          },
          required: ["extractedTasks", "confirmationMessage"]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (error: any) {
    console.warn("Voice Parse Error (falling back to local):", error.message || error);
    res.json(getFallback());
  }
});

// ----------------- API ROUTE: Weekly Performance Report -----------------
app.post("/api/gemini/weekly-report", async (req, res) => {
  const { completedTasks, missedTasks, habits, productivityScores, topCategory } = req.body;

  const getFallback = () => {
    const completedCount = completedTasks?.length || 0;
    const missedCount = missedTasks?.length || 0;
    const total = completedCount + missedCount;
    const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    let grade: "A" | "B" | "C" | "D" | "F" = "F";
    if (completionRate >= 90) grade = "A";
    else if (completionRate >= 75) grade = "B";
    else if (completionRate >= 60) grade = "C";
    else if (completionRate >= 45) grade = "D";

    return {
      weekOf: new Date().toLocaleDateString(undefined, { month: "long", day: "numeric" }),
      completionRate,
      missedCount,
      mostProductiveDay: "Wednesday",
      biggestProcrastinationPattern: "Delaying high-impact tasks to the last 24 hours.",
      habitHighlight: habits && habits.length > 0 ? habits[0].title : "Hydration and posture",
      streakAtRisk: habits && habits.length > 0 ? habits[habits.length - 1].title : "Breathing space",
      nextWeekPrediction: "Several core tasks are on the horizon. Secure a 48-hour buffer to prevent panic.",
      improvementTip: "Schedule a 20-minute Micro-Start block 2 days before actual deadline.",
      weeklyGrade: grade,
      motivationalClosing: "The struggle is part of the growth. Next week, we start early and win decisively. Ready?"
    };
  };

  if (!ai) {
    return res.json(getFallback());
  }

  try {
    const prompt = `Generate a structured Weekly Performance Report based on these metrics:
Completed Tasks this week: ${JSON.stringify(completedTasks || [])}
Missed Overdue Tasks: ${JSON.stringify(missedTasks || [])}
Habit Streaks: ${JSON.stringify(habits || [])}
Productivity Scores (past 7 days): ${JSON.stringify(productivityScores || [])}
Top Category: ${topCategory || "General"}

STRICT METRIC CALCULATIONS:
- completionRate: (completed / total) × 100, rounded
- missedCount: count of overdue missed tasks
- weeklyGrade:
  * A = 90%+ completionRate
  * B = 75%+ completionRate
  * C = 60%+ completionRate
  * D = 45%+ completionRate
  * F = below 45% completionRate

TONE: Honest but encouraging. Acknowledge struggle. End with ONE actionable change to make next week. Never mention being an AI.`;

    const response = await generateResilientContent(ai, {
      contents: prompt,
      config: {
        systemInstruction: "You are Deadline Guardian, an elite action coach. Speak directly, firmly, and constructively. Never say you are an AI.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weekOf: { type: Type.STRING },
            completionRate: { type: Type.NUMBER },
            missedCount: { type: Type.NUMBER },
            mostProductiveDay: { type: Type.STRING },
            biggestProcrastinationPattern: { type: Type.STRING },
            habitHighlight: { type: Type.STRING },
            streakAtRisk: { type: Type.STRING },
            nextWeekPrediction: { type: Type.STRING },
            improvementTip: { type: Type.STRING },
            weeklyGrade: { type: Type.STRING },
            motivationalClosing: { type: Type.STRING }
          },
          required: [
            "weekOf", "completionRate", "missedCount", "mostProductiveDay",
            "biggestProcrastinationPattern", "habitHighlight", "streakAtRisk",
            "nextWeekPrediction", "improvementTip", "weeklyGrade", "motivationalClosing"
          ]
        }
      }
    });

    const data = JSON.parse(response.text?.trim() || "{}");
    res.json(data);
  } catch (error: any) {
    console.warn("Weekly Report Error (falling back to local):", error.message || error);
    res.json(getFallback());
  }
});

// ----------------- API ROUTE: Interactive Chat Assistant -----------------
app.post("/api/gemini/chat-assistant", async (req, res) => {
  const { messages, mood, currentTasks } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Missing messages history" });
  }

  const getFallback = () => {
    return {
      message: `I am currently running in Guardian Safe Mode. 

Based on your current mood (${mood || "neutral"}) and tasks, my best advice is to stay calm and pick just ONE small task to focus on for 20 minutes. 

What task would you like to make progress on right now?`,
    };
  };

  if (!ai) {
    return res.json(getFallback());
  }

  try {
    // Prepare history
    const geminiHistory = messages.map((m: any) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }]
    }));

    // Add immediate context to last message
    const lastUserMessage = geminiHistory[geminiHistory.length - 1]?.parts[0]?.text || "Hello";
    const enhancedPrompt = `Context: User's Current Mood: ${mood || "neutral"}. Current Pending Tasks: ${JSON.stringify(currentTasks || [])}.
User input: ${lastUserMessage}`;

    if (geminiHistory.length > 0) {
      geminiHistory[geminiHistory.length - 1].parts = [{ text: enhancedPrompt }];
    }

    const response = await generateResilientContent(ai, {
      contents: geminiHistory,
      config: {
        systemInstruction: `You are Deadline Guardian, an elite action-oriented, empathetic productivity coach who defeats procrastination and drives real action.
IDENTITY RULES:
- Never say "I'm just an AI" or "as an AI" under any circumstances.
- Speak like a firm, empathetic coach who knows the user's exact situation.
- Always be hyper-specific — generic advice is useless. Reference actual task titles, deadlines, and consequences from the user's list in every response.
- Use "we" language: "Let's tackle this together".
- Bullet points for lists, **bold** for key actions.
- Max 150 words unless a detailed plan is requested.
- Max 2 emojis per response.
- End EVERY response with "**Next step:** [specific immediate action]".

EMOTIONAL COPING RULES:
- Acknowledge feelings FIRST if the user is tired, stressed, or overwhelmed (1 sentence). Do not jump immediately to tasks when the user is emotionally struggling.
- Zero blame. Zero guilt-tripping if they procrastinated.

TRIGGER RESPONSES:
- If user asks "what should I do today?" or "plan my day": List the top 3 tasks by priority score and tell them to click the "Plan My Day" button for their full hourly schedule.
- If user says "I'm overwhelmed" or "too many tasks": Say "Breathe. Ignore everything else for now." Pick the single highest-score task from the list and say: "Just do THIS for 25 minutes: [firstAction]".
- If user says "I'm tired" or "low energy": Pick 1 subtask under 20 minutes from their active tasks. Say: "Small progress beats no progress. Just do: [easiest subtask]".
- If user says "I procrastinated" or "I'm behind": Be completely non-judgmental. Offer: "Okay, here's what we can still realistically finish: [emergency plan with 1-2 high impact tasks]".
- If 3+ tasks are CRITICAL: Trigger "Crisis Mode": "🚨 Crisis Mode: You have [N] critical deadlines. Here's your emergency 48-hour survival plan: [ordered list with firstAction for each]".
- If a task is completed: "That's a W! 🔥 [Task] is locked in." Immediately surface next priority: "Next up: [task title]. Start with: [firstAction]".`,
      }
    });

    res.json({ message: response.text });
  } catch (error: any) {
    console.warn("Assistant Chat Error (falling back to local):", error.message || error);
    res.json(getFallback());
  }
});

// ----------------- Vite Integration & Asset Serving -----------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development middleware integrated.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Static production assets mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Deadline Guardian full-stack server running on http://localhost:${PORT}`);
  });
}

startServer();
