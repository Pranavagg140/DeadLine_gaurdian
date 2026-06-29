import React, { useState } from "react";
import { Check, Flame, Plus, Trash2, Award, Zap, Sparkles, RefreshCw } from "lucide-react";
import { Habit } from "../types";
import { getHabitCatchUpPlan } from "../utils";

interface HabitTrackerProps {
  habits: Habit[];
  onAddHabit: (title: string) => void;
  onToggleHabit: (id: string, dateStr: string) => void;
  onDeleteHabit: (id: string) => void;
}

export function HabitTracker({ habits, onAddHabit, onToggleHabit, onDeleteHabit }: HabitTrackerProps) {
  const [newHabitName, setNewHabitName] = useState("");
  const [activeCatchUp, setActiveCatchUp] = useState<string | null>(null);

  const getTodayDateString = () => {
    const d = new Date();
    // Use local timezone format YYYY-MM-DD
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getYesterdayDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getTodayDateString();
  const yesterdayStr = getYesterdayDateString();

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;
    onAddHabit(newHabitName.trim());
    setNewHabitName("");
  };

  // Helper to determine if a streak is broken
  const isStreakBroken = (habit: Habit) => {
    // A streak is broken if they didn't complete it today AND didn't complete it yesterday
    const completedToday = habit.history[todayStr] === true;
    const completedYesterday = habit.history[yesterdayStr] === true;
    return !completedToday && !completedYesterday && habit.streak > 0;
  };

  return (
    <div className="bg-[#1C1F26] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
      {/* Decorative radial background */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 bg-emerald-950/40 border border-emerald-800/30 px-2 py-0.5 rounded-md">
            Streak Guards
          </span>
          <h3 className="text-lg font-semibold text-slate-100 tracking-tight mt-1">Goal & Habit Tracker</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-blue-400 font-mono">
          <Award className="w-4 h-4" /> Habits build systems
        </div>
      </div>

      {/* Add Habit Input */}
      <form onSubmit={handleAddSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newHabitName}
          onChange={(e) => setNewHabitName(e.target.value)}
          placeholder="e.g., DSA Practice, Gym, Meditation..."
          className="flex-1 bg-[#0F1115] border border-white/10 focus:border-blue-500/60 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none transition-all"
        />
        <button
          type="submit"
          className="p-2.5 bg-blue-600 hover:bg-blue-500 text-slate-100 rounded-xl transition-all flex items-center justify-center border border-blue-500 hover:border-blue-400 shrink-0"
        >
          <Plus className="w-4 h-4" />
        </button>
      </form>

      {/* Habit Cards */}
      {habits.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-white/10 rounded-xl">
          <p className="text-xs text-slate-500 font-mono">No active habits logged yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => {
            const completedToday = habit.history[todayStr] === true;
            const broken = isStreakBroken(habit);

            return (
              <div
                key={habit.id}
                className={`bg-[#0F1115] border rounded-xl p-4 transition-all relative ${
                  completedToday
                    ? "border-emerald-500/30 bg-[#0F1115]/40"
                    : broken
                    ? "border-amber-500/30 bg-amber-950/5"
                    : "border-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Toggle button checkmark */}
                    <button
                      onClick={() => onToggleHabit(habit.id, todayStr)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                        completedToday
                          ? "bg-emerald-500 border-emerald-400 text-emerald-950"
                          : "border-white/15 hover:border-white/30 text-transparent"
                      }`}
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div>
                      <p
                        className={`text-sm font-medium ${
                          completedToday ? "text-slate-400 line-through" : "text-slate-200"
                        }`}
                      >
                        {habit.title}
                      </p>
                      {/* Streak badge */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame
                          className={`w-3.5 h-3.5 ${
                            habit.streak > 0 ? "text-orange-500 animate-pulse" : "text-slate-600"
                          }`}
                        />
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {habit.streak} day streak
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {broken && (
                      <button
                        onClick={() =>
                          setActiveCatchUp(activeCatchUp === habit.id ? null : habit.id)
                        }
                        className="text-[10px] font-mono bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300 px-2 py-1 rounded-md transition-colors flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Catch Up Plan
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteHabit(habit.id)}
                      className="p-1 text-slate-600 hover:text-red-400 rounded-lg hover:bg-[#1C1F26] transition-colors"
                      title="Delete habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Catch up instruction panel */}
                {activeCatchUp === habit.id && broken && (
                  <div className="mt-3 bg-amber-950/20 border border-amber-900/40 rounded-lg p-3 text-xs leading-relaxed text-amber-200 animate-fade-in">
                    <div className="flex items-center gap-1 text-amber-300 font-mono uppercase tracking-wider text-[9px] mb-1.5">
                      <Sparkles className="w-3 h-3 text-orange-400 animate-pulse" /> Keep Streak Alive
                    </div>
                    <p className="whitespace-pre-line font-mono text-[11px]">
                      {getHabitCatchUpPlan(habit.title)}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
