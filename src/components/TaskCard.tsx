import React, { useState, useEffect } from "react";
import {
  Clock,
  Sparkles,
  CheckSquare,
  Square,
  Calendar,
  Zap,
  Trash2,
  ChevronDown,
  ChevronUp,
  Brain,
  ShieldAlert,
  CalendarCheck
} from "lucide-react";
import { Task } from "../types";
import { getCountdownString } from "../utils";

interface TaskCardProps {
  key?: string;
  task: Task;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onTriggerBreakdown: (id: string) => void;
  onToggleSubtask: (taskId: string, subtaskIndex: number) => void;
  onLaunchFocus: (task: Task) => void;
  onGoogleSync: (task: Task) => void;
  isSyncingToCalendar?: boolean;
}

export function TaskCard({
  task,
  onToggleComplete,
  onDelete,
  onTriggerBreakdown,
  onToggleSubtask,
  onLaunchFocus,
  onGoogleSync,
  isSyncingToCalendar
}: TaskCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [countdown, setCountdown] = useState(getCountdownString(task.deadline));

  // Update countdown live every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdownString(task.deadline));
    }, 60000);
    return () => clearInterval(interval);
  }, [task.deadline]);

  const { display: timeRemainingStr, hoursLeft, isOverdue, alertLevel } = countdown;

  // Determine Priority Color
  const getPriorityColor = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "text-rose-500 border-rose-900/50 bg-rose-950/20";
      case "HIGH":
        return "text-orange-500 border-orange-900/50 bg-orange-950/20";
      case "MEDIUM":
        return "text-yellow-500 border-yellow-900/50 bg-yellow-950/20";
      default:
        return "text-emerald-500 border-emerald-900/50 bg-emerald-950/20";
    }
  };

  const getPriorityBg = (urgency: string) => {
    switch (urgency) {
      case "CRITICAL":
        return "bg-rose-500";
      case "HIGH":
        return "bg-orange-500";
      case "MEDIUM":
        return "bg-yellow-500";
      default:
        return "bg-emerald-500";
    }
  };

  // Determine Escalation Level advice based on hours remaining
  const getEscalationAdvice = () => {
    if (task.completed) return null;

    if (isOverdue) {
      return {
        label: "🚨 DAMAGE CONTROL MODE",
        style: "border-red-900/40 bg-red-950/10 text-red-300",
        message: "This deadline has passed. Do not panic — salvaging partial credit or requesting a strategic extension is your best immediate step.",
        action: "Action: Submit draft immediately OR send the preset AI Extension Email Request."
      };
    }

    if (hoursLeft <= 24) {
      return {
        label: "⚠️ EMERGENCY MODE",
        style: "border-rose-900/40 bg-rose-950/20 text-rose-300 animate-pulse",
        message: "Due in less than 24 hours! We are running on hourly time-blocks. Drop all low-priority items.",
        action: "Next 60 mins: Lock down and spend exactly 45 minutes on: " + (task.firstAction || "starting the core MVP.")
      };
    }

    if (hoursLeft <= 72) {
      return {
        label: "🟠 ACTION PLAN TRIGGERED",
        style: "border-orange-900/40 bg-orange-950/10 text-orange-300",
        message: "Due in under 3 days. Procrastination risk increases now. Let's secure our intermediate milestones.",
        action: "Today's goal: Check off the first subtask to build momentum."
      };
    }

    if (hoursLeft <= 168) {
      return {
        label: "🟢 GENTLE REMINDER",
        style: "border-emerald-900/40 bg-emerald-950/10 text-emerald-300",
        message: "Due in under 7 days. Excellent window to start planning. Staggering 30 minutes today saves you hours later.",
        action: "Recommended: Click 'AI Breakdown' below to review the subtask structure."
      };
    }

    return null;
  };

  const escalation = getEscalationAdvice();

  // Subtask Progress
  const totalSubtasks = task.subtasks.length;
  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const subtaskProgressPercent = totalSubtasks > 0 ? (completedSubtasks / totalSubtasks) * 100 : 0;

  return (
    <div
      className={`bg-[#1C1F26] border rounded-2xl p-5 transition-all shadow-lg hover:shadow-black/50 ${
        task.completed
          ? "border-white/5 bg-[#1C1F26]/60 opacity-80"
          : isOverdue
          ? "border-red-500/40 bg-gradient-to-br from-[#1C1F26] via-[#1C1F26] to-red-500/5 shadow-[0_0_12px_rgba(239,68,68,0.1)]"
          : hoursLeft <= 24
          ? "border-red-500/40 bg-gradient-to-br from-[#1C1F26] via-[#1C1F26] to-red-500/5 animate-pulse"
          : "border-white/5 hover:border-white/15"
      }`}
    >
      {/* Top row Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          {/* Category Chip */}
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#0F1115] border border-white/10 text-gray-400">
            {task.category}
          </span>

          {/* Priority Score badge */}
          <span
            className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getPriorityColor(
              task.urgencyLevel
            )}`}
          >
            Priority: {task.priorityScore} / 10
          </span>
        </div>

        {/* Live Countdown Badge */}
        <div className="flex items-center gap-1 text-xs font-mono text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span
            className={`${
              isOverdue
                ? "text-red-500 font-bold"
                : hoursLeft <= 24
                ? "text-rose-500 font-bold animate-pulse"
                : hoursLeft <= 72
                ? "text-orange-400 font-bold"
                : "text-slate-300"
            }`}
          >
            {timeRemainingStr}
          </span>
        </div>
      </div>

      {/* Main title and Complete Switch */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            onClick={() => onToggleComplete(task.id)}
            className="mt-1 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            title={task.completed ? "Mark incomplete" : "Mark completed"}
          >
            {task.completed ? (
              <CheckSquare className="w-5 h-5 text-emerald-500 fill-emerald-950/50" />
            ) : (
              <Square className="w-5 h-5" />
            )}
          </button>
          <div className="min-w-0 flex-1">
            <h4
              className={`text-base font-semibold tracking-tight truncate ${
                task.completed ? "text-slate-500 line-through" : "text-slate-100"
              }`}
            >
              {task.title}
            </h4>
            {task.consequence && !task.completed && (
              <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                Consequence if missed: <span className="text-slate-300">{task.consequence}</span>
              </p>
            )}
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onGoogleSync(task)}
            disabled={isSyncingToCalendar}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-slate-950/60 transition-colors ${
              isSyncingToCalendar ? "opacity-50" : ""
            }`}
            title="Sync with Google Calendar"
          >
            <CalendarCheck className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(task.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-950/60 transition-colors"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Escalation alert box */}
      {escalation && (
        <div className={`mt-4 border rounded-xl p-3 text-xs leading-relaxed ${escalation.style}`}>
          <div className="font-mono font-bold tracking-wide uppercase text-[9px] mb-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {escalation.label}
          </div>
          <p className="mb-2 font-mono text-slate-300 text-[11px]">{escalation.message}</p>
          <p className="font-medium bg-slate-950/40 p-1.5 rounded-lg border border-white/5 text-[11px]">
            ⚡ {escalation.action}
          </p>
        </div>
      )}

      {/* Subtask micro progress bar if broken down */}
      {task.isAiBrokenDown && totalSubtasks > 0 && (
        <div className="mt-4">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 mb-1.5">
            <span>AI SUBTASK PROGRESS</span>
            <span>
              {completedSubtasks} of {totalSubtasks} ({Math.round(subtaskProgressPercent)}%)
            </span>
          </div>
          <div className="w-full h-1 bg-[#0F1115] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${getPriorityBg(task.urgencyLevel)}`}
              style={{ width: `${subtaskProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer Controls & Expand toggle */}
      <div className="mt-5 pt-3 border-t border-slate-800/40 flex items-center justify-between">
        <div className="flex gap-2">
          {/* Launch Focus button */}
          {!task.completed && (
            <button
              onClick={() => onLaunchFocus(task)}
              className="text-xs font-mono font-bold text-orange-400 hover:text-orange-300 bg-orange-950/30 hover:bg-orange-950/50 border border-orange-900/40 hover:border-orange-800 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3 h-3 text-orange-500 animate-pulse fill-orange-500" /> Focus Session
            </button>
          )}

          {/* AI Breakdown triggers */}
          {!task.isAiBrokenDown && !task.completed && (
            <button
              onClick={() => onTriggerBreakdown(task.id)}
              className="text-xs font-mono font-bold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 hover:border-blue-500/40 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
            >
              <Brain className="w-3 h-3 text-blue-400" /> AI Breakdown
            </button>
          )}
        </div>

        {/* Collapsible toggle */}
        {(task.isAiBrokenDown || task.aiInsight) && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1 p-1 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <>
                Hide Details <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Show Subtasks ({totalSubtasks}) <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        )}
      </div>

      {/* Expanded subtask & details drawer */}
      {isExpanded && (task.isAiBrokenDown || task.aiInsight) && (
        <div className="mt-4 pt-4 border-t border-white/5 animate-fade-in space-y-4">
          {/* AI Insight */}
          {task.aiInsight && (
            <div className="bg-[#0F1115]/40 border border-white/5 p-3 rounded-xl">
              <span className="text-[9px] font-mono text-blue-400 tracking-wider uppercase block mb-1">
                Guardian Insight:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-300 font-mono">
                💡 {task.aiInsight}
              </p>
            </div>
          )}

          {/* Subtasks checklist */}
          {totalSubtasks > 0 && (
            <div>
              <span className="text-[9px] font-mono text-slate-500 tracking-wider uppercase block mb-2">
                Action-Item Breakdown:
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {task.subtasks.map((sub, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start justify-between gap-3 p-2 border rounded-xl text-xs transition-colors ${
                      sub.completed
                        ? "bg-[#0F1115]/20 border-white/5 text-gray-500"
                        : "bg-[#0F1115]/60 border-white/5 text-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => onToggleSubtask(task.id, idx)}
                        className="mt-0.5 text-slate-500 hover:text-slate-300 shrink-0"
                      >
                        {sub.completed ? (
                          <CheckSquare className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                      </button>
                      <span className={`truncate ${sub.completed ? "line-through" : ""}`}>
                        {sub.title}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono shrink-0 flex flex-col items-end">
                      <span>{sub.duration}</span>
                      <span className="text-[8px] text-slate-600">{sub.scheduledTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* First actions tip */}
          {task.firstAction && !task.completed && (
            <div className="border border-dashed border-orange-900/20 bg-orange-950/5 p-3 rounded-xl flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <span className="text-[9px] font-mono text-orange-400 uppercase tracking-wider block">
                  Kickstart action (Start Procrastination Defeating):
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                  {task.firstAction}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
