import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, X, CheckCircle, Flame, ShieldAlert, Sparkles } from "lucide-react";
import { Task } from "../types";

interface FocusModeProps {
  task: Task;
  onClose: () => void;
  onProgressUpdate: (taskId: string, subtaskIndex?: number, completed?: boolean) => void;
}

export function FocusMode({ task, onClose, onProgressUpdate }: FocusModeProps) {
  // Timer States: WORK (25m), SHORT_BREAK (5m), LONG_BREAK (15m)
  type SessionType = "WORK" | "SHORT" | "LONG";
  const [sessionType, setSessionType] = useState<SessionType>("WORK");
  const [timeLeft, setTimeLeft] = useState(25 * 60); // in seconds
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(1);
  const [miniGoal, setMiniGoal] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [isFinished, setIsFinished] = useState(false);

  // Audio ticking or alert simulation
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Suggested mini-goal based on task
  useEffect(() => {
    if (task.subtasks && task.subtasks.length > 0) {
      const nextPending = task.subtasks.find((s) => !s.completed);
      if (nextPending) {
        setMiniGoal(`Complete subtask: "${nextPending.title}"`);
      } else {
        setMiniGoal(`Review and polish "${task.title}"`);
      }
    } else {
      setMiniGoal(`Focus on the first 10% of "${task.title}"`);
    }
  }, [task]);

  // Handle timer countdown
  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleSessionComplete();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft]);

  const handleSessionComplete = () => {
    setIsActive(false);
    setIsFinished(true);

    // Audio chime play simulator (uses web synthesis for immersive experience)
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4 note
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.5);
      osc.start();
      osc.stop(ctx.currentTime + 1.5);
    } catch (e) {
      console.log("Audio feedback skipped due to context restriction.");
    }
  };

  const handleNextSession = () => {
    setIsFinished(false);
    if (sessionType === "WORK") {
      // Completed work, trigger break
      if (sessionCount % 4 === 0) {
        setSessionType("LONG");
        setTimeLeft(15 * 60);
      } else {
        setSessionType("SHORT");
        setTimeLeft(5 * 60);
      }
    } else {
      // Completed break, back to work
      setSessionType("WORK");
      setTimeLeft(25 * 60);
      setSessionCount((prev) => prev + 1);
    }
    setIsActive(true);
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setIsFinished(false);
    if (sessionType === "WORK") setTimeLeft(25 * 60);
    else if (sessionType === "SHORT") setTimeLeft(5 * 60);
    else setTimeLeft(15 * 60);
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = ((sessionType === "WORK" ? 25 * 60 : sessionType === "SHORT" ? 5 * 60 : 15 * 60) - timeLeft) / (sessionType === "WORK" ? 25 * 60 : sessionType === "SHORT" ? 5 * 60 : 15 * 60);

  return (
    <div className="fixed inset-0 bg-slate-950/90 flex items-center justify-center z-50 p-4 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative">
        {/* Border decorative glow */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
            <h3 className="font-semibold text-slate-100 tracking-wide text-lg">Guardian Focus Zone</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1 hover:bg-slate-800 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Core Content */}
        <div className="p-8 flex flex-col items-center">
          {/* Active Task Frame */}
          <div className="text-center mb-6">
            <span className="text-xs font-mono uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full">
              {sessionType === "WORK" ? `Session #${sessionCount} Work Block` : "Rest & Buffer Space"}
            </span>
            <h2 className="text-xl font-medium text-slate-100 mt-3 max-w-sm mx-auto truncate">
              {task.title}
            </h2>
          </div>

          {/* Circle Progress Timer */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke="#1e293b"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="44"
                stroke={sessionType === "WORK" ? "#f97316" : "#22c55e"}
                strokeWidth="6"
                fill="transparent"
                strokeDasharray="276.4"
                strokeDashoffset={276.4 * (1 - progressPercent)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="text-center z-10">
              <span className="text-4xl font-mono font-bold text-slate-50 tracking-tight">
                {formatTime(timeLeft)}
              </span>
              <p className="text-xs font-mono text-slate-400 mt-1 uppercase tracking-wider">
                {sessionType === "WORK" ? "STAY FOCUS" : "BREATHE DEEP"}
              </p>
            </div>
          </div>

          {/* Mini Goal Input & suggestion */}
          {!isFinished && (
            <div className="w-full bg-[#0F1115]/40 border border-white/5 rounded-xl p-4 mb-6">
              <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Current Mini-Goal:
              </label>
              <input
                type="text"
                value={miniGoal}
                onChange={(e) => setMiniGoal(e.target.value)}
                placeholder="What small win are we securing right now?"
                className="w-full bg-[#0F1115] border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed italic">
                💡 Mini-goals create dopamine spikes. Clear this block to build momentum.
              </p>
            </div>
          )}

          {/* Interactive controls */}
          {!isFinished ? (
            <div className="flex items-center gap-4">
              <button
                onClick={resetTimer}
                className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all border border-slate-700 hover:border-slate-600"
                title="Reset session"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
              <button
                onClick={toggleTimer}
                className={`px-8 py-3.5 rounded-xl font-medium tracking-wide flex items-center gap-2 shadow-lg transition-all transform active:scale-95 ${
                  isActive
                    ? "bg-slate-100 text-slate-900 hover:bg-slate-200"
                    : "bg-orange-500 text-slate-950 hover:bg-orange-400 font-bold"
                }`}
              >
                {isActive ? (
                  <>
                    <Pause className="w-5 h-5 fill-current" /> Pause Sprint
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" /> Start Deep Work
                  </>
                )}
              </button>
            </div>
          ) : (
            // Session Complete Dashboard
            <div className="w-full text-center py-2 animate-fade-in">
              <div className="inline-flex p-3 bg-green-950/40 border border-green-800/40 rounded-full text-green-400 mb-4">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-medium text-slate-100 mb-1">
                {sessionType === "WORK" ? "Block Completed! 🔥" : "Buffer Break Finished!"}
              </h3>
              <p className="text-sm text-slate-400 mb-6">
                {sessionType === "WORK"
                  ? "Outstanding! You stayed guarded. Log your progress below to lock it in."
                  : "Ready to step back in? Let's smash the next work sprint."}
              </p>

              {sessionType === "WORK" && (
                <div className="text-left mb-6">
                  <label className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-2">
                    What did you accomplish in this block?
                  </label>
                  <textarea
                    rows={2}
                    value={sessionNotes}
                    onChange={(e) => setSessionNotes(e.target.value)}
                    placeholder="e.g., Set up project skeleton, sketched primary models"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:outline-none focus:border-green-500 transition-colors"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium border border-slate-700 transition-colors"
                >
                  Close Focus Zone
                </button>
                <button
                  onClick={handleNextSession}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-xl transition-colors shadow-lg"
                >
                  {sessionType === "WORK" ? "Start Break ☕" : "Start Next Block ⚡"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
