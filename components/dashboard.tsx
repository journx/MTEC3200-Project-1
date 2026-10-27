"use client";

import {
  CalendarDays,
  Check,
  Circle,
  Clock3,
  ListTodo,
  Pencil,
  Plus,
  Palette,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import ColorThemePicker, {
  colorThemes,
  type ColorTheme,
} from "@/components/color-theme-picker";
import FocusTimer from "@/components/focus-timer";

const themeStorageKey = "dayline-color-theme";

type PlannerTask = {
  id: string;
  title: string;
  time: string;
  completed: boolean;
};

type TaskFilter = "all" | "open" | "done";
type MobileView = "tasks" | "schedule";
type DashboardView = "today" | "focus";

const initialTasks: PlannerTask[] = [
  { id: "task-1", title: "Review project brief", time: "09:30", completed: true },
  { id: "task-2", title: "Finish research notes", time: "11:00", completed: false },
  { id: "task-3", title: "Email project partner", time: "14:30", completed: false },
  { id: "task-4", title: "Pick up groceries", time: "17:00", completed: false },
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

export default function Dashboard() {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<TaskFilter>("all");
  const [mobileView, setMobileView] = useState<MobileView>("tasks");
  const [dashboardView, setDashboardView] = useState<DashboardView>("today");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskTime, setTaskTime] = useState("");
  const [todayLabel, setTodayLabel] = useState("");
  const [colorTheme, setColorTheme] = useState<ColorTheme>("forest");
  const [themeMessage, setThemeMessage] = useState("");

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setTodayLabel(formatDate(new Date()));
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

  const completedCount = tasks.filter((task) => task.completed).length;
  const progress = tasks.length ? (completedCount / tasks.length) * 100 : 0;
  const nextTask = tasks.find((task) => !task.completed);
  const visibleTasks = tasks.filter((task) => {
    if (filter === "open") return !task.completed;
    if (filter === "done") return task.completed;
    return true;
  });

  function openNewTaskForm() {
    setMobileView("tasks");
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskTime("");
    setIsFormOpen(true);
  }

  function openEditTaskForm(task: PlannerTask) {
    setEditingTaskId(task.id);
    setTaskTitle(task.title);
    setTaskTime(task.time);
    setIsFormOpen(true);
  }

  function saveTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();
    if (!title) return;

    if (editingTaskId) {
      setTasks((current) => current.map((task) =>
        task.id === editingTaskId ? { ...task, title, time: taskTime } : task,
      ));
    } else {
      setTasks((current) => [...current, {
        id: `task-${Date.now()}`,
        title,
        time: taskTime,
        completed: false,
      }]);
    }

    setIsFormOpen(false);
    setEditingTaskId(null);
    setTaskTitle("");
    setTaskTime("");
  }

  function toggleTask(taskId: string) {
    setTasks((current) => current.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task,
    ));
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
          </nav>
          <details className="group relative lg:mt-auto">
            <summary className="flex min-h-10 cursor-pointer list-none items-center gap-2 rounded-lg px-2.5 text-sm font-medium text-[var(--dayline-muted)] transition-colors hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)] [&::-webkit-details-marker]:hidden lg:px-3">
              <Palette aria-hidden="true" size={16} className="text-[var(--dayline-forest)]" />
              <span className="hidden sm:inline">Colors</span>
            </summary>
            <div className="absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-[var(--dayline-line)] bg-white p-3 shadow-lg lg:right-auto lg:left-0">
              <ColorThemePicker value={colorTheme} onChange={changeColorTheme} />
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
              <h1 className="mt-2 text-[28px] font-semibold leading-tight sm:text-[34px]">Your day, in view.</h1>
              <p className="mt-2 text-sm text-[var(--dayline-muted)]">Tasks and scheduled blocks for today.</p>
            </div>
            <div className="flex items-center gap-3 pb-0.5">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold">Alex Morgan</p>
                <p className="mt-0.5 text-xs text-[var(--dayline-muted)]">Personal plan</p>
              </div>
              <div className="grid size-10 place-items-center rounded-full bg-[var(--dayline-coral)] text-sm font-semibold text-[#3b211d]" aria-label="Alex Morgan">AM</div>
            </div>
          </header>

          <div className="mt-5 flex items-center gap-2 rounded-lg border border-[var(--dayline-line)] bg-white px-4 py-3 text-sm">
            <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[var(--dayline-lime)] text-[var(--dayline-forest)]"><Check aria-hidden="true" size={15} strokeWidth={2.5} /></span>
            <p className="min-w-0 flex-1 text-[var(--dayline-ink)]">
              {nextTask ? <><span className="font-semibold">Next up:</span> {nextTask.title}{nextTask.time ? ` at ${formatTime(nextTask.time)}` : ""}</> : <span className="font-semibold">Everything on your list is complete.</span>}
            </p>
            <span className="hidden shrink-0 text-xs text-[var(--dayline-muted)] sm:inline">{completedCount} of {tasks.length} done</span>
          </div>

          <div hidden={dashboardView !== "today"} className="mt-5 inline-flex rounded-lg border border-[var(--dayline-line)] bg-white p-1 md:hidden" aria-label="Choose dashboard view">
            <button type="button" onClick={() => setMobileView("tasks")} aria-pressed={mobileView === "tasks"} className={`rounded-md px-4 py-2 text-sm font-medium ${mobileView === "tasks" ? "bg-[var(--dayline-forest)] text-white" : "text-[var(--dayline-muted)]"}`}>Tasks</button>
            <button type="button" onClick={() => setMobileView("schedule")} aria-pressed={mobileView === "schedule"} className={`rounded-md px-4 py-2 text-sm font-medium ${mobileView === "schedule" ? "bg-[var(--dayline-forest)] text-white" : "text-[var(--dayline-muted)]"}`}>Schedule</button>
          </div>

          <div hidden={dashboardView !== "focus"} className="mt-7">
            <FocusTimer />
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
                        <span className="mt-1 flex items-center gap-1 text-xs text-[var(--dayline-muted)]"><Clock3 aria-hidden="true" size={12} />{task.time ? formatTime(task.time) : "No time set"}</span>
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