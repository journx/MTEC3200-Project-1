"use client";

import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";

type TimerPhase = "focus" | "break";

type TimerSettings = {
  focusMinutes: number;
  breakMinutes: number;
};

const initialSettings: TimerSettings = {
  focusMinutes: 50,
  breakMinutes: 10,
};

const circumference = 2 * Math.PI * 90;

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

export default function FocusTimer() {
  const [settings, setSettings] = useState(initialSettings);
  const [focusMinutesInput, setFocusMinutesInput] = useState(String(initialSettings.focusMinutes));
  const [breakMinutesInput, setBreakMinutesInput] = useState(String(initialSettings.breakMinutes));
  const [phase, setPhase] = useState<TimerPhase>("focus");
  const [phaseDurationSeconds, setPhaseDurationSeconds] = useState(initialSettings.focusMinutes * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSettings.focusMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [focusLabel, setFocusLabel] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");

  useEffect(() => {
    if (!isRunning || endsAt === null) return;

    const intervalId = window.setInterval(() => {
      const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);

      if (secondsLeft === 0) {
        setIsRunning(false);
        setIsComplete(true);
        setEndsAt(null);
      }
    }, 250);

    return () => window.clearInterval(intervalId);
  }, [endsAt, isRunning]);

  const progress = phaseDurationSeconds > 0
    ? Math.min(1, Math.max(0, 1 - remainingSeconds / phaseDurationSeconds))
    : 0;
  const isFocusPhase = phase === "focus";
  const phaseLabel = isFocusPhase ? "Focus session" : "Break time";
  const completionMessage = isFocusPhase
    ? "Focus session complete. Take a break when you’re ready."
    : "Break complete. Start another focus session when you’re ready.";

  function startTimer() {
    if (remainingSeconds <= 0) return;
    setEndsAt(Date.now() + remainingSeconds * 1000);
    setIsRunning(true);
    setSettingsMessage("");
  }

  function pauseTimer() {
    if (endsAt !== null) {
      const secondsLeft = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemainingSeconds(secondsLeft);
      if (secondsLeft === 0) setIsComplete(true);
    }

    setIsRunning(false);
    setEndsAt(null);
  }

  function resetTimer() {
    const durationSeconds = (isFocusPhase ? settings.focusMinutes : settings.breakMinutes) * 60;
    setIsRunning(false);
    setIsComplete(false);
    setEndsAt(null);
    setPhaseDurationSeconds(durationSeconds);
    setRemainingSeconds(durationSeconds);
    setSettingsMessage("");
  }

  function startNextPhase() {
    const nextPhase: TimerPhase = isFocusPhase ? "break" : "focus";
    const durationSeconds = (nextPhase === "focus" ? settings.focusMinutes : settings.breakMinutes) * 60;

    setPhase(nextPhase);
    setPhaseDurationSeconds(durationSeconds);
    setRemainingSeconds(durationSeconds);
    setIsComplete(false);
    setEndsAt(Date.now() + durationSeconds * 1000);
    setIsRunning(true);
    setSettingsMessage("");
  }

  function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const focusMinutes = Number(focusMinutesInput);
    const breakMinutes = Number(breakMinutesInput);

    if (!Number.isInteger(focusMinutes) || focusMinutes < 5 || focusMinutes > 240) {
      setSettingsMessage("Choose a focus length between 5 and 240 minutes.");
      return;
    }

    if (!Number.isInteger(breakMinutes) || breakMinutes < 1 || breakMinutes > 60) {
      setSettingsMessage("Choose a break length between 1 and 60 minutes.");
      return;
    }

    const nextSettings = { focusMinutes, breakMinutes };
    setSettings(nextSettings);
    setSettingsMessage(isRunning
      ? "Settings saved for your next session. Your current timer is unchanged."
      : "Settings saved. Your timer is ready.");

    if (!isRunning) {
      const durationSeconds = (isFocusPhase ? focusMinutes : breakMinutes) * 60;
      setPhaseDurationSeconds(durationSeconds);
      setRemainingSeconds(durationSeconds);
      setIsComplete(false);
    }
  }

  return (
    <section id="focus" className="mx-auto max-w-3xl" aria-labelledby="focus-heading">
      <div className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dayline-muted)]">Make time for longer tasks</p>
        <h2 id="focus-heading" className="mt-1.5 text-2xl font-semibold">Focus timer</h2>
        <p className="mt-2 text-sm text-[var(--dayline-muted)]">Set a focus block, then take a break at your pace.</p>
      </div>

      <div className="rounded-2xl border border-[var(--dayline-line)] bg-white p-5 shadow-[0_8px_24px_rgba(27,42,35,0.04)] sm:p-8">
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 rounded-full bg-[var(--dayline-mint)] px-3 py-1.5 text-xs font-semibold text-[var(--dayline-forest)]">
            <Timer aria-hidden="true" size={15} />
            {isFocusPhase ? "FOCUS" : "BREAK"}
          </div>

          <div className="relative mt-5 grid size-64 place-items-center sm:size-72">
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 200 200" aria-hidden="true">
              <circle cx="100" cy="100" r="90" fill="none" stroke="var(--dayline-line)" strokeWidth="5" />
              <circle
                cx="100"
                cy="100"
                r="90"
                fill="none"
                stroke={isFocusPhase ? "var(--dayline-forest)" : "var(--dayline-coral)"}
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                strokeWidth="5"
                className="transition-[stroke-dashoffset] duration-300"
              />
            </svg>
            <div className="text-center">
              <p className="text-sm font-medium text-[var(--dayline-muted)]">{phaseLabel}</p>
              <p role="timer" className="mt-2 font-mono text-5xl font-semibold tracking-tight tabular-nums text-[var(--dayline-ink)] sm:text-6xl">
                {formatDuration(remainingSeconds)}
              </p>
              {focusLabel.trim() && isFocusPhase && (
                <p className="mx-auto mt-3 max-w-52 truncate text-sm font-medium text-[var(--dayline-forest)]">{focusLabel.trim()}</p>
              )}
            </div>
          </div>

          <p aria-live="polite" className="mt-2 min-h-6 text-center text-sm text-[var(--dayline-muted)]">
            {isComplete ? completionMessage : isRunning ? "Timer running" : remainingSeconds < phaseDurationSeconds ? "Timer paused" : "Ready when you are"}
          </p>

          <div className="mt-4 flex w-full flex-wrap justify-center gap-3">
            {isRunning ? (
              <button type="button" onClick={pauseTimer} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--dayline-forest)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--dayline-forest-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]">
                <Pause aria-hidden="true" size={17} />Pause
              </button>
            ) : isComplete ? (
              <button type="button" onClick={startNextPhase} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--dayline-forest)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--dayline-forest-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]">
                <Play aria-hidden="true" size={17} />{isFocusPhase ? "Start break" : "Start next focus"}
              </button>
            ) : (
              <button type="button" onClick={startTimer} className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-[var(--dayline-forest)] px-5 text-sm font-semibold text-white transition-colors hover:bg-[var(--dayline-forest-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]">
                <Play aria-hidden="true" size={17} />{remainingSeconds < phaseDurationSeconds ? "Resume" : `Start ${isFocusPhase ? "focus" : "break"}`}
              </button>
            )}
            <button type="button" onClick={resetTimer} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[var(--dayline-line)] px-4 text-sm font-semibold text-[var(--dayline-ink)] transition-colors hover:bg-[var(--dayline-ground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]">
              <RotateCcw aria-hidden="true" size={16} />Reset
            </button>
          </div>
        </div>

        <div className="mt-8 border-t border-[var(--dayline-line)] pt-6">
          <label htmlFor="focus-label" className="block text-sm font-semibold">What are you working on?</label>
          <input
            id="focus-label"
            type="text"
            maxLength={80}
            value={focusLabel}
            onChange={(event) => setFocusLabel(event.target.value)}
            placeholder="Add a task or focus for this session"
            className="mt-2 h-11 w-full rounded-lg border border-[var(--dayline-line)] px-3 text-sm outline-none placeholder:text-[var(--dayline-muted)] focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]"
          />

          <form onSubmit={saveSettings} className="mt-6">
            <h3 className="text-sm font-semibold">Customize your timer</h3>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="focus-minutes" className="block text-xs font-medium text-[var(--dayline-muted)]">Focus length (5–240 minutes)</label>
                <input
                  id="focus-minutes"
                  type="number"
                  min={5}
                  max={240}
                  step={1}
                  required
                  value={focusMinutesInput}
                  onChange={(event) => setFocusMinutesInput(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[var(--dayline-line)] px-3 text-sm outline-none focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]"
                />
              </div>
              <div>
                <label htmlFor="break-minutes" className="block text-xs font-medium text-[var(--dayline-muted)]">Break length (1–60 minutes)</label>
                <input
                  id="break-minutes"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  required
                  value={breakMinutesInput}
                  onChange={(event) => setBreakMinutesInput(event.target.value)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-[var(--dayline-line)] px-3 text-sm outline-none focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]"
                />
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p aria-live="polite" className="text-xs text-[var(--dayline-muted)]">{settingsMessage || "You can change these lengths whenever you need."}</p>
              <button type="submit" className="min-h-10 rounded-lg border border-[var(--dayline-line)] px-4 text-sm font-semibold text-[var(--dayline-forest)] transition-colors hover:bg-[var(--dayline-mint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]">Save settings</button>
            </div>
          </form>
        </div>
      </div>

      <p className="mt-4 text-center text-xs leading-5 text-[var(--dayline-muted)]">This in-app timer does not block other apps and ends if you close this page.</p>
    </section>
  );
}
