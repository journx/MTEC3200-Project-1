"use client";

import {
  AlarmClock,
  ArrowUpRight,
  BedDouble,
  BookOpen,
  Brain,
  Coffee,
  Monitor,
  MoonStar,
  Save,
  VolumeX,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import type {
  MorningFeeling,
  SleepEntry,
  SleepQuality,
} from "@/types/sleep";

type SleepSupportProps = {
  entries: Record<string, SleepEntry>;
  selectedDate: string;
  onSelectDate: (date: string) => void;
  onSaveEntry: (entry: SleepEntry) => void;
  onDeleteEntry: (date: string) => void;
};

const qualityOptions: {
  value: SleepQuality;
  label: string;
  color: string;
  selectedColor: string;
}[] = [
  {
    value: "bad",
    label: "Bad",
    color: "border-red-200 hover:bg-red-50",
    selectedColor: "border-red-500 bg-red-50 text-red-800",
  },
  {
    value: "okay",
    label: "Okay",
    color: "border-yellow-200 hover:bg-yellow-50",
    selectedColor: "border-yellow-500 bg-yellow-50 text-yellow-900",
  },
  {
    value: "great",
    label: "Great",
    color: "border-green-200 hover:bg-green-50",
    selectedColor: "border-green-600 bg-green-50 text-green-900",
  },
];

const feelingOptions: { value: MorningFeeling; label: string }[] = [
  { value: "rested", label: "Rested" },
  { value: "okay", label: "Okay" },
  { value: "tired", label: "Tired" },
  { value: "other", label: "Other" },
];

function getMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function getSleepWindowMinutes(bedtime: string, wakeTime: string) {
  if (!bedtime || !wakeTime) return 0;
  return (getMinutes(wakeTime) - getMinutes(bedtime) + 1440) % 1440;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const routineOptions = [
  {
    id: "schedule",
    label: "My sleep and wake times vary",
    icon: AlarmClock,
    suggestion:
      "If it fits your life, try choosing a regular wake-up time and keeping it similar across the week. A steady schedule is one habit public health sources recommend.",
  },
  {
    id: "screens",
    label: "I use screens close to bedtime",
    icon: Monitor,
    suggestion:
      "You could try putting screens away for the last 30 minutes before bed, or use that time for a quieter, less brightly lit activity.",
  },
  {
    id: "caffeine",
    label: "I have caffeine later in the day",
    icon: Coffee,
    suggestion:
      "Consider moving coffee, tea, soda, or energy drinks earlier in the day. Caffeine can affect sleep for several hours.",
  },
  {
    id: "room",
    label: "My room feels bright, noisy, or uncomfortable",
    icon: VolumeX,
    suggestion:
      "A small adjustment may help make the room quieter, darker, or cooler, such as dimming lights or reducing a source of noise.",
  },
  {
    id: "unwind",
    label: "I find it hard to wind down",
    icon: Brain,
    suggestion:
      "Consider setting aside a little quiet time before bed for a relaxing activity that feels comfortable to you.",
  },
  {
    id: "naps",
    label: "I nap late or for a long time",
    icon: BedDouble,
    suggestion:
      "If naps seem to make it harder to sleep at night, you could try keeping them shorter or earlier in the day.",
  },
] as const;

const readingResources = [
  {
    publisher: "National Heart, Lung, and Blood Institute",
    title: "Healthy Sleep Habits",
    description:
      "Practical information about schedules, light, caffeine, bedroom conditions, and winding down.",
    href: "https://www.nhlbi.nih.gov/health/sleep-deprivation/healthy-sleep-habits",
  },
  {
    publisher: "Centers for Disease Control and Prevention",
    title: "About Sleep",
    description:
      "An overview of sleep habits, sleep quality, and when to talk with a healthcare provider.",
    href: "https://www.cdc.gov/sleep/about/index.html",
  },
  {
    publisher: "NHS Every Mind Matters",
    title: "Sleep problems",
    description:
      "General information about sleep routines and common things that can affect sleep.",
    href: "https://www.nhs.uk/every-mind-matters/mental-health-issues/sleep/",
  },
] as const;

type RoutineOptionId = (typeof routineOptions)[number]["id"];

export default function SleepSupport({
  entries,
  selectedDate,
  onSelectDate,
  onSaveEntry,
  onDeleteEntry,
}: SleepSupportProps) {
  const [selectedRoutines, setSelectedRoutines] = useState<RoutineOptionId[]>([]);
  const selectedEntry = entries[selectedDate];
  const [wakeDate, setWakeDate] = useState(selectedDate);
  const [bedtime, setBedtime] = useState(selectedEntry?.bedtime ?? "22:30");
  const [wakeTime, setWakeTime] = useState(selectedEntry?.wakeTime ?? "07:00");
  const [quality, setQuality] = useState<SleepQuality>(selectedEntry?.quality ?? "okay");
  const [feeling, setFeeling] = useState<MorningFeeling>(selectedEntry?.feeling ?? "okay");
  const [formError, setFormError] = useState("");
  const [formMessage, setFormMessage] = useState("");

  function toggleRoutine(id: RoutineOptionId) {
    setSelectedRoutines((current) =>
      current.includes(id)
        ? current.filter((routine) => routine !== id)
        : [...current, id],
    );
  }

  const suggestions = routineOptions.filter((option) =>
    selectedRoutines.includes(option.id),
  );
  const estimatedDuration = getSleepWindowMinutes(bedtime, wakeTime);

  function saveSleepEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wakeDate || !bedtime || !wakeTime) {
      setFormError("Choose a date, bedtime, and wake-up time.");
      return;
    }

    if (!estimatedDuration) {
      setFormError("Bedtime and wake-up time need to be different.");
      return;
    }

    onSaveEntry({
      date: wakeDate,
      bedtime,
      wakeTime,
      durationMinutes: estimatedDuration,
      quality,
      feeling,
    });
    setFormError("");
    setFormMessage("Sleep log saved for this page session.");
  }

  return (
    <section className="dashboard-enter" aria-labelledby="sleep-heading">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dayline-muted)]">
          A gentle place to start
        </p>
        <h2 id="sleep-heading" className="mt-1.5 text-2xl font-semibold">
          Sleep routine ideas
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--dayline-muted)]">
          Explore trusted reading, or choose what sounds familiar to see a few
          general ideas for tonight. You can skip anything that does not fit.
        </p>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.05fr)_minmax(280px,0.95fr)]">
        <div className="rounded-2xl border border-[var(--dayline-line)] bg-white p-4 sm:p-5">
          <div>
            <h3 className="text-base font-semibold">What is your routine like?</h3>
            <p className="mt-1 text-xs leading-5 text-[var(--dayline-muted)]">
              Choose any that apply. Your selections are not saved.
            </p>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            {routineOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedRoutines.includes(option.id);

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleRoutine(option.id)}
                  aria-pressed={isSelected}
                  className={`flex min-h-14 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)] ${
                    isSelected
                      ? "border-[var(--dayline-forest)] bg-[var(--dayline-mint)] text-[var(--dayline-forest)]"
                      : "border-[var(--dayline-line)] bg-white text-[var(--dayline-ink)] hover:bg-[var(--dayline-ground)]"
                  }`}
                >
                  <Icon aria-hidden="true" size={17} className="shrink-0" />
                  <span className="font-medium leading-5">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="rounded-2xl border border-[var(--dayline-line)] bg-[var(--dayline-pale-green)] p-4 sm:p-5"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="flex items-center gap-2">
            <MoonStar
              aria-hidden="true"
              size={18}
              className="text-[var(--dayline-forest)]"
            />
            <h3 className="text-base font-semibold">A few ideas for tonight</h3>
          </div>
          {suggestions.length > 0 ? (
            <ul className="mt-3 space-y-3">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  className="rounded-xl border border-white/80 bg-white/80 p-3 text-sm leading-6 text-[var(--dayline-ink)]"
                >
                  {suggestion.suggestion}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 rounded-xl border border-white/80 bg-white/80 p-3 text-sm leading-6 text-[var(--dayline-muted)]">
              Pick a routine pattern above to see a related, general idea. Small
              changes are optional; you can choose what works for you.
            </p>
          )}
          {suggestions.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedRoutines([])}
              className="mt-3 min-h-9 rounded-lg px-2 text-xs font-semibold text-[var(--dayline-forest)] hover:bg-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
            >
              Clear selections
            </button>
          )}
        </div>
      </div>

      <section className="mt-7 max-w-3xl rounded-2xl border border-[var(--dayline-line)] bg-white p-4 sm:p-5" aria-labelledby="sleep-log-heading">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dayline-muted)]">
            Optional check-in
          </p>
          <h3 id="sleep-log-heading" className="mt-1 text-lg font-semibold">
            Log last night
          </h3>
          <p className="mt-1 text-xs leading-5 text-[var(--dayline-muted)]">
            Choose the morning you woke up. Time is estimated from bedtime to
            wake-up and may include time spent awake.
          </p>
        </div>

        <form onSubmit={saveSleepEntry} className="mt-4 space-y-4">
          <label htmlFor="sleep-wake-date" className="block text-sm font-medium">
            Wake-up date
            <input
              id="sleep-wake-date"
              type="date"
              value={wakeDate}
              onChange={(event) => {
                setWakeDate(event.target.value);
                onSelectDate(event.target.value);
                setFormMessage("");
              }}
              max={getLocalDateKey(new Date())}
              required
              className="mt-1.5 block min-h-10 w-full max-w-xs rounded-lg border border-[var(--dayline-line)] px-3 text-sm outline-none focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]"
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label htmlFor="sleep-bedtime" className="block text-sm font-medium">
              Bedtime
              <input
                id="sleep-bedtime"
                type="time"
                value={bedtime}
                onChange={(event) => {
                  setBedtime(event.target.value);
                  setFormMessage("");
                }}
                required
                className="mt-1.5 block min-h-10 w-full rounded-lg border border-[var(--dayline-line)] px-3 text-sm outline-none focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]"
              />
            </label>
            <label htmlFor="sleep-wake-time" className="block text-sm font-medium">
              Wake-up time
              <input
                id="sleep-wake-time"
                type="time"
                value={wakeTime}
                onChange={(event) => {
                  setWakeTime(event.target.value);
                  setFormMessage("");
                }}
                required
                className="mt-1.5 block min-h-10 w-full rounded-lg border border-[var(--dayline-line)] px-3 text-sm outline-none focus:border-[var(--dayline-forest)] focus:ring-2 focus:ring-[var(--dayline-mint)]"
              />
            </label>
          </div>
          <p className="text-xs text-[var(--dayline-muted)]" aria-live="polite">
            {estimatedDuration
              ? `Time between bedtime and wake-up: ${formatDuration(estimatedDuration)}`
              : "Enter different bedtime and wake-up times to calculate the time window."}
          </p>

          <fieldset>
            <legend className="text-sm font-medium">How did you sleep?</legend>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {qualityOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setQuality(option.value);
                    setFormMessage("");
                  }}
                  aria-pressed={quality === option.value}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)] ${
                    quality === option.value
                      ? option.selectedColor
                      : `text-[var(--dayline-ink)] ${option.color}`
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`size-2.5 rounded-full ${
                      option.value === "bad"
                        ? "bg-red-500"
                        : option.value === "okay"
                          ? "bg-yellow-400"
                          : "bg-green-500"
                    }`}
                  />
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium">How do you feel?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {feelingOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setFeeling(option.value);
                    setFormMessage("");
                  }}
                  aria-pressed={feeling === option.value}
                  className={`min-h-10 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)] ${
                    feeling === option.value
                      ? "border-[var(--dayline-forest)] bg-[var(--dayline-mint)] text-[var(--dayline-forest)]"
                      : "border-[var(--dayline-line)] text-[var(--dayline-muted)] hover:bg-[var(--dayline-ground)]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div aria-live="polite" className="min-h-5 text-xs">
            {formError ? (
              <p className="text-red-700">{formError}</p>
            ) : (
              <p className="text-[var(--dayline-forest)]">{formMessage}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-[var(--dayline-forest)] px-4 text-sm font-semibold text-white hover:bg-[var(--dayline-forest-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
            >
              <Save aria-hidden="true" size={15} />
              Save sleep log
            </button>
            {entries[wakeDate] && (
              <button
                type="button"
                onClick={() => {
                  onDeleteEntry(wakeDate);
                  setFormMessage("Sleep log deleted.");
                }}
                className="min-h-10 rounded-lg px-3 text-sm font-medium text-[var(--dayline-muted)] hover:bg-[var(--dayline-ground)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
              >
                Delete this log
              </button>
            )}
          </div>
        </form>

        <p className="mt-4 border-t border-[var(--dayline-line)] pt-3 text-xs leading-5 text-[var(--dayline-muted)]">
          Sleep logs are kept only while this page is open and are cleared when
          you reload it. This is a self-reported reflection, not a medical
          assessment.
        </p>
      </section>

      <section className="mt-8" aria-labelledby="reading-heading">
        <div className="flex items-center gap-2">
          <BookOpen
            aria-hidden="true"
            size={18}
            className="text-[var(--dayline-forest)]"
          />
          <h3 id="reading-heading" className="text-lg font-semibold">
            Read from trusted sources
          </h3>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {readingResources.map((resource) => (
            <article
              key={resource.title}
              className="flex flex-col rounded-xl border border-[var(--dayline-line)] bg-white p-4"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--dayline-muted)]">
                {resource.publisher}
              </p>
              <h4 className="mt-2 text-sm font-semibold">{resource.title}</h4>
              <p className="mt-1.5 flex-1 text-xs leading-5 text-[var(--dayline-muted)]">
                {resource.description}
              </p>
              <a
                href={resource.href}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-9 items-center gap-1 self-start rounded-lg px-2 text-xs font-semibold text-[var(--dayline-forest)] hover:bg-[var(--dayline-mint)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
              >
                Read article
                <ArrowUpRight aria-hidden="true" size={14} />
              </a>
            </article>
          ))}
        </div>
      </section>

      <p className="mt-6 max-w-3xl rounded-xl border border-[var(--dayline-line)] bg-white px-4 py-3 text-xs leading-5 text-[var(--dayline-muted)]">
        These are general educational ideas, not medical advice or a treatment
        plan. If sleep problems keep affecting your day, consider talking with a
        healthcare professional.
      </p>
    </section>
  );
}
