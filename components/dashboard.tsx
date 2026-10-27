"use client";

import {
  Bell,
  CalendarDays,
  Check,
  Circle,
  Clock3,
  Flame,
  ListTodo,
  MoonStar,
  Pencil,
  Plus,
  Palette,
  Sparkles,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import ColorThemePicker, {
  colorThemes,
  type ColorTheme,
} from "@/components/color-theme-picker";
import FocusTimer from "@/components/focus-timer";
import SleepCalendar from "@/components/sleep-calendar";
import SleepSupport from "@/components/sleep-support";
import type { SleepEntry } from "@/types/sleep";

const themeStorageKey = "dayline-color-theme";
const completionStorageKey = "dayline-task-completion-dates";
const notifiedTasksStorageKey = "dayline-notified-overdue-tasks";

const dailyQuotes = [
  "One small step still moves the day forward.",
  "You can begin before you feel fully ready.",
  "A plan is a guide, not a test.",
  "Progress can be quiet and still count.",
  "Start where you are; the next step is enough.",
  "Rest and focus can both belong in your day.",
  "Your pace can change; you can begin again.",
  "Make today workable, not perfect.",
  "Finishing one thing is a meaningful start.",
  "The plan can change when life does.",
] as const;

type PlannerTask = {
  id: string;
  title: string;
  time: string;
  dueDate: string;
  dueTime: string;
  completed: boolean;
};

type TaskFilter = "all" | "open" | "done";
type MobileView = "tasks" | "schedule";
type DashboardView = "today" | "focus" | "sleep";
type NotificationStatus = NotificationPermission | "unsupported";

const initialTasks: PlannerTask[] = [
  { id: "task-1", title: "Review project brief", time: "09:30", dueDate: "", dueTime: "", completed: true },
  { id: "task-2", title: "Finish research notes", time: "11:00", dueDate: "", dueTime: "", completed: false },
  { id: "task-3", title: "Email project partner", time: "14:30", dueDate: "", dueTime: "", completed: false },
  { id: "task-4", title: "Pick up groceries", time: "17:00", dueDate: "", dueTime: "", completed: false },
];

const hours = Array.from({ length: 13 }, (_, index) => index + 8);

function formatTime(time: string) {
  if (!time) return "No time";
  const [hour, minute] = time.split(":").map(Number);
  const suffix = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getDailyQuote(date: Date) {
  const dayNumber = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  return dailyQuotes[dayNumber % dailyQuotes.length];
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isDateKey(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsedDate = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === value
  );
}

function getBestStreak(dates: string[]) {
  const completedDays = new Set(dates);
  const sortedDays = [...completedDays].sort();
  let bestStreak = 0;
  let streak = 0;
  let previousDay = -2;

  for (const date of sortedDays) {
    const day = Date.parse(`${date}T00:00:00Z`) / 86_400_000;
    streak = day === previousDay + 1 ? streak + 1 : 1;
    bestStreak = Math.max(bestStreak, streak);
    previousDay = day;
  }

  return bestStreak;
}

function getCurrentStreak(dates: string[], today: string) {
  const completedDays = new Set(dates);
  const todayNumber = Date.parse(`${today}T00:00:00Z`) / 86_400_000;
  const yesterday = new Date((todayNumber - 1) * 86_400_000)
    .toISOString()
    .slice(0, 10);
  let day = completedDays.has(today)
    ? todayNumber
    : completedDays.has(yesterday)
      ? todayNumber - 1
      : Number.NaN;
  let streak = 0;

  while (Number.isFinite(day)) {
    const date = new Date(day * 86_400_000).toISOString().slice(0, 10);
    if (!completedDays.has(date)) break;
    streak += 1;
    day -= 1;
  }

  return streak;
}

function isTaskOverdue(task: PlannerTask, now: Date) {
  if (task.completed || !task.dueDate) return false;
  const dueAt = new Date(
    `${task.dueDate}T${task.dueTime || "23:59"}:${task.dueTime ? "00" : "59"}`,
  );
  return !Number.isNaN(dueAt.getTime()) && dueAt.getTime() < now.getTime();
}

function formatDeadline(task: PlannerTask) {
  const date = new Date(`${task.dueDate}T12:00:00`);
  const dateLabel = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
  return task.dueTime
    ? `${dateLabel} at ${formatTime(task.dueTime)}`
    : `${dateLabel} (end of day)`;
}

export default function Dashboard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [mobileView, setMobileView] = useState<MobileView>("tasks");
  const [dashboardView, setDashboardView] = useState<DashboardView>("today");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskDueTime, setTaskDueTime] = useState("");
  const [todayLabel, setTodayLabel] = useState("");
  const [now, setNow] = useState<Date | null>(null);
  const [dailyQuote, setDailyQuote] = useState<string>(dailyQuotes[0]);
  const [colorTheme, setColorTheme] = useState<ColorTheme>("forest");
  const [themeMessage, setThemeMessage] = useState("");
  const [completionDates, setCompletionDates] = useState<string[]>([]);
  const [completionDatesLoaded, setCompletionDatesLoaded] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const notifiedTaskIds = useRef(new Set<string>());
  const [notifiedTaskIdsLoaded, setNotifiedTaskIdsLoaded] = useState(false);
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationStatus>("default");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [sleepEntries, setSleepEntries] = useState<Record<string, SleepEntry>>({});
  const [sleepSelectedDate, setSleepSelectedDate] = useState("");
  const [sleepCalendarMonth, setSleepCalendarMonth] = useState("");

  useEffect(() => {
    let midnightTimeout: number | undefined;

    function updateDailyContent() {
      const now = new Date();
      setTodayLabel(formatDate(now));
      setDailyQuote(getDailyQuote(now));
      setNow(now);
      setSleepSelectedDate((current) => current || getLocalDateKey(now));
      setSleepCalendarMonth(
        (current) =>
          current ||
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
      );

      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      midnightTimeout = window.setTimeout(
        updateDailyContent,
        nextDay.getTime() - now.getTime() + 50,
      );
    }

    const frame = requestAnimationFrame(() => {
      updateDailyContent();
      setNotificationPermission(
        "Notification" in window
          ? window.Notification.permission
          : "unsupported",
      );
      try {
        const savedTheme = window.localStorage.getItem(themeStorageKey);
        const matchingTheme = colorThemes.find((theme) => theme.id === savedTheme);
        if (matchingTheme) {
          setColorTheme(matchingTheme.id);
        }
      } catch {
        setThemeMessage("Saved color preference could not be loaded.");
      }
    });
    const clockInterval = window.setInterval(() => setNow(new Date()), 30_000);

    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(clockInterval);
      if (midnightTimeout !== undefined) {
        window.clearTimeout(midnightTimeout);
      }
    };
  }, []);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const savedDates: unknown = JSON.parse(
          window.localStorage.getItem(completionStorageKey) ?? "[]",
        );
        if (
          !Array.isArray(savedDates) ||
          !savedDates.every(isDateKey)
        ) {
          throw new Error("Saved completion dates have an invalid format.");
        }
        setCompletionDates([...new Set(savedDates)]);
      } catch {
        setProgressMessage("Saved streak history could not be loaded.");
      }
      setCompletionDatesLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!completionDatesLoaded) return;
    const frame = requestAnimationFrame(() => {
      try {
        window.localStorage.setItem(completionStorageKey, JSON.stringify(completionDates));
      } catch {
        setProgressMessage("Streak progress could not be saved in this browser.");
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [completionDates, completionDatesLoaded]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const savedIds: unknown = JSON.parse(
          window.localStorage.getItem(notifiedTasksStorageKey) ?? "[]",
        );
        if (!Array.isArray(savedIds) || !savedIds.every((id) => typeof id === "string")) {
          throw new Error("Saved reminder history has an invalid format.");
        }
        notifiedTaskIds.current = new Set(savedIds);
      } catch {
        setNotificationMessage("Reminder history could not be loaded.");
      }
      setNotifiedTaskIdsLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  function changeColorTheme(theme: ColorTheme) {
    setColorTheme(theme);
    setThemeMessage("");
    try {
      window.localStorage.setItem(themeStorageKey, theme);
    } catch {
      setThemeMessage("Theme changed, but this browser could not save your preference.");
    }
  }

  async function enableBrowserNotifications() {
    if (!("Notification" in window)) {
      setNotificationPermission("unsupported");
      setNotificationMessage("Browser notifications are not supported here.");
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationMessage(
        permission === "granted"
          ? "Browser reminders are enabled while the planner is open."
          : permission === "denied"
            ? "Notifications are blocked in browser settings. In-app reminders will still appear."
            : "Browser permission was not granted. In-app reminders will still appear.",
      );
    } catch {
      setNotificationMessage(
        "Could not enable browser notifications. In-app reminders will still appear.",
      );
    }
  }

  function selectSleepDate(date: string) {
    setSleepSelectedDate(date);
    if (date) {
      setSleepCalendarMonth(date.slice(0, 7));
    }
  }

  function saveSleepEntry(entry: SleepEntry) {
    setSleepEntries((current) => ({ ...current, [entry.date]: entry }));
    selectSleepDate(entry.date);
  }

  function deleteSleepEntry(date: string) {
    setSleepEntries((current) => {
      const next = { ...current };
      delete next[date];
      return next;
    });
  }

  const completedCount = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? (completedCount / tasks.length) * 100 : 0;
  const nextTask = tasks.find((task) => !task.completed);
  const visibleTasks = tasks.filter((task) => {
    if (filter === "open") return !task.completed;
    if (filter === "done") return task.completed;
    return true;
  });
  const todayKey = now ? getLocalDateKey(now) : "";
  const currentStreak = todayKey ? getCurrentStreak(completionDates, todayKey) : 0;
  const bestStreak = getBestStreak(completionDates);
  const overdueTasks = useMemo(
    () => (now ? tasks.filter((task) => isTaskOverdue(task, now)) : []),
    [now, tasks],
  );

  useEffect(() => {
    if (
      notificationPermission !== "granted" ||
      !notifiedTaskIdsLoaded ||
      overdueTasks.length === 0
    ) {
      return;
    }

    const newNotifications = overdueTasks.filter(
      (task) => !notifiedTaskIds.current.has(task.id),
    );
    if (newNotifications.length === 0) return;

    try {
      for (const task of newNotifications) {
        new window.Notification("A task deadline has passed", {
          body: `${task.title} is still on your list. You can finish it or adjust the plan.`,
          tag: `dayline-overdue-${task.id}`,
        });
        notifiedTaskIds.current.add(task.id);
      }
      window.localStorage.setItem(
        notifiedTasksStorageKey,
        JSON.stringify([...notifiedTaskIds.current]),
      );
    } catch {
      requestAnimationFrame(() => {
        setNotificationMessage(
          "A browser reminder or its history could not be saved. The overdue task is still listed here.",
        );
      });
    }
  }, [notificationPermission, notifiedTaskIdsLoaded, overdueTasks]);

  function openNewTaskForm() {
    setMobileView("tasks");
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskTime("");
    setTaskDueDate(getLocalDateKey(new Date()));
    setTaskDueTime("");
    setIsFormOpen(true);
  }

  function openEditTaskForm(task: PlannerTask) {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskTime(task.time);
    setTaskDueDate(task.dueDate);
    setTaskDueTime(task.dueTime);
    setIsFormOpen(true);
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title || !taskDueDate) return;

    if (editingTaskId) {
      setTasks((current) => current.map((task) =>
        task.id === editingTaskId
          ? { ...task, title, time: taskTime, dueDate: taskDueDate, dueTime: taskDueTime }
          : task,
      ));
    } else {
      setTasks((current) => [...current, {
        id: `task-${Date.now()}`,
        title,
        time: taskTime,
        dueDate: taskDueDate,
        dueTime: taskDueTime,
        completed: false,
      }]);
    }

    setIsFormOpen(false);
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskTime("");
    setTaskDueDate("");
    setTaskDueTime("");
  }

  function toggleTask(taskId: string) {
    const task = tasks.find((currentTask) => currentTask.id === taskId);
    if (!task) return;
    const isCompleting = !task.completed;
    setTasks((current) => current.map((currentTask) =>
      currentTask.id === taskId
        ? { ...currentTask, completed: !currentTask.completed }
        : currentTask,
    ));
    if (isCompleting) {
      const completedToday = getLocalDateKey(new Date());
      setCompletionDates((current) =>
        current.includes(completedToday) ? current : [...current, completedToday],
      );
    }
  }

  function deleteTask(taskId: string) {
    setTasks((current) => current.filter((task) => task.id !== taskId));
  }

  return (
    <div data-theme={colorTheme} className="min-h-screen bg-[var(--dayline-ground)] text-[var(--dayline-ink)]">
      <div className="mx-auto grid min-h-screen max-w-[1680px] grid-cols-1 lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="z-20 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b border-[var(--dayline-line)] bg-white px-5 py-3 lg:sticky lg:top-0 lg:h-screen lg:flex-nowrap lg:flex-col lg:items-stretch lg:border-b-0 lg:border-r lg:px-6 lg:py-8">
          <a href="#top" className="flex items-center gap-3" aria-label="Dayline home">
            <span className="grid size-10 place-items-center rounded-xl bg-[var(--dayline-forest)] text-white">
              <CalendarDays aria-hidden="true" size={20} strokeWidth={1.8} />
            </span>
            <span className="text-[17px] font-semibold">dayline</span>
          </a>
          <nav className="order-last flex w-full items-center justify-between gap-1 lg:order-none lg:mt-14 lg:flex-col lg:items-stretch" aria-label="Main navigation">
            <a href="#top" onClick={() => { setDashboardView("today"); setMobileView("tasks"); }} aria-current={dashboardView === "today" ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm lg:px-3 ${dashboardView === "today" ? "bg-[var(--dayline-mint)] font-semibold text-[var(--dayline-forest)]" : "font-medium text-[var(--dayline-muted)] transition-colors hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)]"}`}>
              <CalendarDays aria-hidden="true" size={18} /><span className="hidden sm:inline">Today</span>
            </a>
            <a href="#tasks" onClick={() => { setDashboardView("today"); setMobileView("tasks"); }} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-[var(--dayline-muted)] transition-colors hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)] lg:px-3">
              <ListTodo aria-hidden="true" size={18} /><span className="hidden sm:inline">My tasks</span>
            </a>
            <a href="#schedule" onClick={() => { setDashboardView("today"); setMobileView("schedule"); }} className="flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm font-medium text-[var(--dayline-muted)] transition-colors hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)] lg:px-3">
              <Clock3 aria-hidden="true" size={18} /><span className="hidden sm:inline">Schedule</span>
            </a>
            <a href="#focus" onClick={() => setDashboardView("focus")} aria-current={dashboardView === "focus" ? "page" : undefined} aria-label="Focus timer" className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm lg:px-3 ${dashboardView === "focus" ? "bg-[var(--dayline-mint)] font-semibold text-[var(--dayline-forest)]" : "font-medium text-[var(--dayline-muted)] transition-colors hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)]"}`}>
              <Timer aria-hidden="true" size={18} /><span className="hidden sm:inline">Focus</span>
            </a>
            <a href="#sleep" onClick={() => setDashboardView("sleep")} aria-label="Sleep hygiene" aria-current={dashboardView === "sleep" ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm lg:px-3 ${dashboardView === "sleep" ? "bg-[var(--dayline-mint)] font-semibold text-[var(--dayline-forest)]" : "font-medium text-[var(--dayline-muted)] transition-colors hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)]"}`}>
              <MoonStar aria-hidden="true" size={18} /><span className="hidden sm:inline">Sleep hygiene</span>
            </a>
          </nav>
          <details className="group relative lg:mt-auto">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-[var(--dayline-muted)] transition-colors hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)] [&::-webkit-details-marker]:hidden lg:px-3">
              <Palette aria-hidden="true" size={16} className="text-[var(--dayline-forest)]" />
              <span className="hidden sm:inline">Colors</span>
            </summary>
            <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-[var(--dayline-line)] bg-white p-3 shadow-lg lg:right-auto lg:left-0">
              <ColorThemePicker
                value={colorTheme}
                bestStreak={bestStreak}
                onChange={changeColorTheme}
              />
              <p aria-live="polite" className="mt-2 min-h-4 text-[10px] leading-4 text-[var(--dayline-muted)]">
                {themeMessage || "Changes are saved to this browser"}
              </p>
            </div>
          </details>
        </aside>

        <main id="top" className="min-w-0 px-4 pb-12 pt-7 sm:px-7 lg:px-10 lg:pt-10">
          <header className="dashboard-enter flex flex-wrap items-end justify-between gap-4 border-b border-[var(--dayline-line)] pb-7">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[var(--dayline-muted)]">{todayLabel || "Today"}</p>
              <h1 className="mt-2 text-[28px] font-semibold leading-tight sm:text-[34px]">{dashboardView === "sleep" ? "A gentler wind-down." : "Your day, in view."}</h1>
              <p className="mt-2 text-sm text-[var(--dayline-muted)]">{dashboardView === "sleep" ? "Explore general ideas for your evening routine." : "Tasks and scheduled blocks for today."}</p>
            </div>
            <div className="flex items-center gap-3 pb-0.5">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">Alex Morgan</p>
                <p className="mt-0.5 text-xs text-[var(--dayline-muted)]">Personal plan</p>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-[var(--dayline-coral)] text-sm font-semibold text-[#3b211d]" aria-label="Alex Morgan">AM</div>
            </div>
          </header>

          <section
            className="mt-5 rounded-xl border border-[var(--dayline-line)] bg-white px-4 py-4 sm:px-5"
            aria-label="Daily motivational quote"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dayline-forest)]">
              A note for today
            </p>
            <blockquote className="mt-2 text-sm font-medium leading-6 text-[var(--dayline-ink)] sm:text-base">
              {dailyQuote}
            </blockquote>
          </section>

          <section
            className="mt-4 rounded-xl border border-[var(--dayline-line)] bg-white px-4 py-4 sm:px-5"
            aria-labelledby="streak-heading"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-[var(--dayline-mint)] text-[var(--dayline-forest)]">
                  <Flame aria-hidden="true" size={20} />
                </span>
                <div>
                  <h2 id="streak-heading" className="text-sm font-semibold">
                    {currentStreak} day{currentStreak === 1 ? "" : "s"} in a row
                  </h2>
                  <p className="mt-0.5 text-xs text-[var(--dayline-muted)]">
                    Best streak: {bestStreak} day{bestStreak === 1 ? "" : "s"} ·
                    complete one task a day
                  </p>
                </div>
              </div>
              {(() => {
                const nextReward = colorThemes.find(
                  (theme) => theme.requiredStreak > bestStreak,
                );
                if (!nextReward) {
                  return (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--dayline-mint)] px-3 py-1.5 text-xs font-semibold text-[var(--dayline-forest)]">
                      <Sparkles aria-hidden="true" size={14} />
                      All palettes unlocked
                    </span>
                  );
                }

                const previousRewardAt = nextReward.requiredStreak - 7;
                const rewardProgress =
                  ((bestStreak - previousRewardAt) / 7) * 100;
                return (
                  <div className="w-full max-w-56">
                    <p className="text-right text-[11px] font-medium text-[var(--dayline-muted)]">
                      {nextReward.requiredStreak - bestStreak} more day
                      {nextReward.requiredStreak - bestStreak === 1 ? "" : "s"} to
                      unlock {nextReward.name}
                    </p>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--dayline-ground)]">
                      <div
                        className="h-full rounded-full bg-[var(--dayline-forest)]"
                        style={{ width: `${Math.min(100, Math.max(0, rewardProgress))}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
            <p aria-live="polite" className="mt-2 text-[10px] leading-4 text-[var(--dayline-muted)]">
              {progressMessage ||
                "Streak history is saved in this browser. Earned palettes stay unlocked."}
            </p>
          </section>

          <div hidden={dashboardView === "sleep"} className="mt-5 flex items-center gap-2 rounded-lg border border-[var(--dayline-line)] bg-white px-4 py-3 text-sm">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--dayline-lime)] text-[var(--dayline-forest)]"><Check aria-hidden="true" size={15} strokeWidth={2.5} /></span>
            <p className="min-w-0 flex-1 text-[var(--dayline-ink)]">
              {nextTask ? <><span className="font-semibold">Next up:</span> {nextTask.title}{nextTask.time ? ` at ${formatTime(nextTask.time)}` : ""}</> : <span className="font-semibold">Everything on your list is complete.</span>}
            </p>
            <span className="hidden shrink-0 text-xs text-[var(--dayline-muted)] sm:inline">{completedCount} of {tasks.length} done</span>
          </div>

          <section
            hidden={dashboardView === "sleep" || overdueTasks.length === 0}
            className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4"
            aria-labelledby="overdue-heading"
            aria-live="polite"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="overdue-heading" className="text-sm font-semibold text-amber-950">
                  A deadline has passed. You can still choose a next step.
                </h2>
                <p className="mt-1 text-xs leading-5 text-amber-900">
                  No judgment—finish it, adjust the deadline, or make the task
                  smaller. Your plan can change.
                </p>
              </div>
              {notificationPermission === "granted" ? (
                <span className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white/80 px-3 text-xs font-medium text-amber-950">
                  <Bell aria-hidden="true" size={14} />
                  Browser reminders on
                </span>
              ) : (
                <button
                  type="button"
                  onClick={enableBrowserNotifications}
                  disabled={notificationPermission === "unsupported"}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-white px-3 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Bell aria-hidden="true" size={14} />
                  {notificationPermission === "denied"
                    ? "Notifications blocked"
                    : notificationPermission === "unsupported"
                      ? "Browser reminders unavailable"
                      : "Enable browser reminders"}
                </button>
              )}
            </div>
            <ul className="mt-3 divide-y divide-amber-200/80">
              {overdueTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex flex-wrap items-center justify-between gap-2 py-2 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-amber-950">
                      {task.title}
                    </p>
                    <p className="mt-0.5 text-xs text-amber-900">
                      Was due {formatDeadline(task)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => toggleTask(task.id)}
                      className="min-h-9 rounded-lg px-2.5 text-xs font-semibold text-amber-950 hover:bg-white/70"
                    >
                      Mark done
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDashboardView("today");
                        setMobileView("tasks");
                        openEditTaskForm(task);
                      }}
                      className="min-h-9 rounded-lg px-2.5 text-xs font-semibold text-amber-950 hover:bg-white/70"
                    >
                      Adjust deadline
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p aria-live="polite" className="mt-2 min-h-4 text-[10px] leading-4 text-amber-900">
              {notificationMessage || "Browser notifications require permission and only work while the planner is open."}
            </p>
          </section>

          <div hidden={dashboardView !== "today"}>
            {sleepCalendarMonth && (
              <SleepCalendar
                entries={sleepEntries}
                selectedDate={sleepSelectedDate}
                month={sleepCalendarMonth}
                onSelectDate={selectSleepDate}
                onChangeMonth={setSleepCalendarMonth}
                onLogSleep={() => setDashboardView("sleep")}
              />
            )}
          </div>

          <div hidden={dashboardView !== "today"} className="mt-5 inline-flex rounded-lg border border-[var(--dayline-line)] bg-white p-1 md:hidden" aria-label="Choose dashboard view">
            <button type="button" onClick={() => setMobileView("tasks")} aria-pressed={mobileView === "tasks"} className={`rounded-md px-4 py-2 text-sm font-medium ${mobileView === "tasks" ? "bg-[var(--dayline-forest)] text-white" : "text-[var(--dayline-muted)]"}`}>Tasks</button>
            <button type="button" onClick={() => setMobileView("schedule")} aria-pressed={mobileView === "schedule"} className={`rounded-md px-4 py-2 text-sm font-medium ${mobileView === "schedule" ? "bg-[var(--dayline-forest)] text-white" : "text-[var(--dayline-muted)]"}`}>Schedule</button>
          </div>

          <div hidden={dashboardView !== "focus"} className="mt-7">
            <FocusTimer />
          </div>
          <div id="sleep" hidden={dashboardView !== "sleep"} className="mt-7">
            <SleepSupport
              key={sleepSelectedDate || "today"}
              entries={sleepEntries}
              selectedDate={sleepSelectedDate}
              onSelectDate={selectSleepDate}
              onSaveEntry={saveSleepEntry}
              onDeleteEntry={deleteSleepEntry}
            />
          </div>
          <div hidden={dashboardView !== "today"} className="mt-7 grid items-start lg:grid-cols-[minmax(300px,0.8fr)_minmax(400px,1.2fr)]">
            <section id="tasks" className={`dashboard-enter min-w-0 pb-10 md:block lg:pr-8 ${mobileView === "tasks" ? "block" : "hidden"}`} aria-labelledby="tasks-heading">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dayline-muted)]">Your checklist</p>
                  <h2 id="tasks-heading" className="mt-1.5 text-xl font-semibold">To-do list</h2>
                </div>
                <button type="button" onClick={openNewTaskForm} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--dayline-forest)] px-3.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--dayline-forest-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]">
                  <Plus aria-hidden="true" size={17} /><span>Add task</span>
                </button>
              </div>

              <div className="mt-5 rounded-xl bg-[var(--dayline-pale-green)] px-4 py-4">
                <div className="flex items-center justify-between gap-3"><span className="text-sm font-semibold">Today&apos;s progress</span><span className="text-sm font-semibold tabular-nums">{completedCount}/{tasks.length}</span></div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/80" role="progressbar" aria-label="Tasks completed" aria-valuemin={0} aria-valuemax={tasks.length} aria-valuenow={completedCount}>
                  <div className="h-full rounded-full bg-[var(--dayline-forest)] transition-[width] duration-500" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-[var(--dayline-muted)]">{tasks.length ? `${Math.round(progress)}% of your tasks are complete` : "Add a task to start your plan."}</p>
              </div>

              <div className="mt-5 flex gap-1 border-b border-[var(--dayline-line)]" role="group" aria-label="Filter tasks">
                {([["all", "All", tasks.length], ["open", "To do", tasks.length - completedCount], ["done", "Done", completedCount]] as const).map(([value, label, count]) => (
                  <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={`relative min-h-10 px-3 text-sm transition-colors ${filter === value ? "font-semibold text-[var(--dayline-forest)] after:absolute after:inset-x-3 after:bottom-[-1px] after:h-0.5 after:bg-[var(--dayline-forest)]" : "text-[var(--dayline-muted)] hover:text-[var(--dayline-ink)]"}`}>
                    {label}<span className="ml-1.5 text-xs tabular-nums opacity-70">{count}</span>
                  </button>
                ))}
              </div>

              {isFormOpen && (
                <form onSubmit={saveTask} className="mt-4 rounded-xl border border-[var(--dayline-line)] bg-white p-4">
                  <label htmlFor="task-title" className="block text-sm font-semibold">{editingTaskId ? "Edit task" : "New task"}</label>
                  <input id="task-title" autoFocus required value={taskTitle} onChange={(event) => setTaskTitle(event.target.value)} placeholder="What needs to get done?" className="mt-2 h-11 w-full rounded-lg border border-[var(--dayline-line)] px-3 text-sm outline-none placeholder:text-[var(--dayline-muted)] focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]" />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label htmlFor="task-due-date" className="block text-xs font-medium text-[var(--dayline-muted)]">
                      Deadline date
                      <input id="task-due-date" type="date" required value={taskDueDate} onChange={(event) => setTaskDueDate(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--dayline-line)] px-3 text-sm text-[var(--dayline-ink)] outline-none focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]" />
                    </label>
                    <label htmlFor="task-due-time" className="block text-xs font-medium text-[var(--dayline-muted)]">
                      Deadline time (optional)
                      <input id="task-due-time" type="time" value={taskDueTime} onChange={(event) => setTaskDueTime(event.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-[var(--dayline-line)] px-3 text-sm text-[var(--dayline-ink)] outline-none focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]" />
                    </label>
                  </div>
                  <label htmlFor="task-time" className="mt-3 flex items-center gap-2 text-xs font-medium text-[var(--dayline-muted)]"><Clock3 aria-hidden="true" size={14} />Add to schedule (optional)</label>
                  <input id="task-time" type="time" value={taskTime} onChange={(event) => setTaskTime(event.target.value)} className="mt-1.5 h-10 rounded-lg border border-[var(--dayline-line)] px-3 text-sm outline-none focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]" />
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setIsFormOpen(false)} className="min-h-10 rounded-lg px-3 text-sm font-medium text-[var(--dayline-muted)] hover:bg-[var(--dayline-ground)]">Cancel</button>
                    <button type="submit" className="min-h-10 rounded-lg bg-[var(--dayline-forest)] px-4 text-sm font-semibold text-white hover:bg-[var(--dayline-forest-hover)]">{editingTaskId ? "Save changes" : "Add task"}</button>
                  </div>
                </form>
              )}

              <ul className="mt-2 divide-y divide-[var(--dayline-line)]">
                {visibleTasks.map((task) => (
                  <li key={task.id} className="group flex min-h-[68px] items-center gap-3 py-3">
                    <label className="flex min-w-0 flex-1 cursor-pointer items-start gap-3">
                      <input type="checkbox" checked={task.completed} onChange={() => toggleTask(task.id)} aria-label={`${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.title}`} className="mt-0.5 size-[18px] shrink-0 accent-[var(--dayline-forest)]" />
                      <span className="min-w-0">
                        <span className={`block text-sm leading-5 ${task.completed ? "text-[var(--dayline-muted)] line-through" : "font-medium text-[var(--dayline-ink)]"}`}>{task.title}</span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--dayline-muted)]">
                          <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" size={12} />{task.time ? formatTime(task.time) : "No scheduled time"}</span>
                          {task.dueDate && <span className={`inline-flex items-center gap-1 ${now && isTaskOverdue(task, now) ? "font-semibold text-red-700" : ""}`}><CalendarDays aria-hidden="true" size={12} />Due {formatDeadline(task)}</span>}
                        </span>
                      </span>
                    </label>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                      <button type="button" onClick={() => openEditTaskForm(task)} title="Edit task" aria-label={`Edit ${task.title}`} className="grid size-9 place-items-center rounded-lg text-[var(--dayline-muted)] hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)]"><Pencil aria-hidden="true" size={15} /></button>
                      <button type="button" onClick={() => deleteTask(task.id)} title="Delete task" aria-label={`Delete ${task.title}`} className="grid size-9 place-items-center rounded-lg text-[var(--dayline-muted)] hover:bg-[#fff0ed] hover:text-[#a83d2d]"><Trash2 aria-hidden="true" size={15} /></button>
                    </div>
                  </li>
                ))}
              </ul>

              {visibleTasks.length === 0 && <div className="py-10 text-center"><span className="mx-auto grid size-10 place-items-center rounded-full bg-[var(--dayline-ground)] text-[var(--dayline-forest)]"><Check aria-hidden="true" size={19} /></span><p className="mt-3 text-sm font-semibold">Nothing here right now</p><p className="mt-1 text-xs text-[var(--dayline-muted)]">Try another filter or add a task.</p></div>}
              {!isFormOpen && <button type="button" onClick={openNewTaskForm} className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-[var(--dayline-forest)] hover:bg-[var(--dayline-mint)]"><Plus aria-hidden="true" size={16} />Add another task</button>}
            </section>

            <section id="schedule" className={`dashboard-enter min-w-0 border-t border-[var(--dayline-line)] pb-10 pt-8 md:block lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 ${mobileView === "schedule" ? "block" : "hidden"}`} aria-labelledby="schedule-heading">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div><p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dayline-muted)]">Make time for it</p><h2 id="schedule-heading" className="mt-1.5 text-xl font-semibold">Today&apos;s schedule</h2></div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--dayline-blue)] px-3 py-1.5 text-xs font-semibold text-[var(--dayline-forest)]"><Circle aria-hidden="true" size={7} fill="currentColor" />Personal plan</span>
              </div>
              <div className="mt-5 flex items-center justify-between border-y border-[var(--dayline-line)] py-3">
                <div><p className="text-sm font-semibold">{todayLabel || "Today"}</p><p className="mt-0.5 text-xs text-[var(--dayline-muted)]">{tasks.filter((task) => task.time).length} scheduled tasks</p></div>
                <button type="button" onClick={openNewTaskForm} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--dayline-line)] px-3 text-xs font-semibold text-[var(--dayline-forest)] transition-colors hover:bg-[var(--dayline-ground)]"><Plus aria-hidden="true" size={15} />Add to schedule</button>
              </div>
              <div className="mt-3 overflow-hidden" aria-label="Daily schedule timeline">
                <div className="relative grid grid-cols-[58px_minmax(0,1fr)]" style={{ height: `${hours.length * 72}px` }}>
                  <div className="relative">{hours.map((hour, index) => <span key={hour} className="absolute right-3 -translate-y-1/2 text-[11px] font-medium tabular-nums text-[var(--dayline-muted)]" style={{ top: `${index * 72}px` }}>{formatTime(`${String(hour).padStart(2, "0")}:00`)}</span>)}</div>
                  <div className="relative border-l border-[var(--dayline-line)]">
                    {hours.map((hour) => <div key={hour} className="absolute inset-x-0 border-t border-[var(--dayline-line)]" style={{ top: `${(hour - 8) * 72}px` }} />)}
                    {tasks.filter((task) => task.time).map((task, index) => {
                      const [hour, minute] = task.time.split(":").map(Number);
                      const offset = ((hour - 8) * 60 + minute) * 1.2;
                      return <div key={task.id} className={`absolute left-2 right-1 flex min-h-[54px] items-center gap-2 rounded-lg border-l-[3px] px-3 py-2 shadow-[0_1px_2px_rgba(21,36,29,0.04)] ${task.completed ? "border-[var(--dayline-sage)] bg-[var(--dayline-ground)]" : index % 2 === 0 ? "border-[var(--dayline-forest)] bg-[var(--dayline-mint)]" : "border-[var(--dayline-coral)] bg-[var(--dayline-pale-coral)]"}`} style={{ top: `${offset}px` }}>
                        <button type="button" onClick={() => toggleTask(task.id)} aria-label={`${task.completed ? "Mark incomplete" : "Mark complete"}: ${task.title}`} className={`grid size-6 shrink-0 place-items-center rounded-full border ${task.completed ? "border-[var(--dayline-sage)] bg-[var(--dayline-sage)] text-white" : "border-[var(--dayline-forest)]/50 bg-white/80 text-transparent hover:text-[var(--dayline-forest)]"}`}><Check aria-hidden="true" size={13} strokeWidth={2.6} /></button>
                        <div className="min-w-0 flex-1"><p className={`truncate text-xs font-semibold ${task.completed ? "text-[var(--dayline-muted)] line-through" : "text-[var(--dayline-ink)]"}`}>{task.title}</p><p className="mt-0.5 text-[10px] text-[var(--dayline-muted)]">{formatTime(task.time)} · 1 hour</p></div>
                      </div>;
                    })}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--dayline-muted)]">Only tasks with a scheduled time appear on this timeline.</p>
            </section>
          </div>
          <p className="mt-2 border-t border-[var(--dayline-line)] pt-4 text-xs text-[var(--dayline-muted)]">Prototype · Changes are only kept while this page is open.</p>
        </main>
      </div>
    </div>
  );
}