import { ChevronLeft, ChevronRight, MoonStar } from "lucide-react";
import type { SleepEntry, SleepQuality } from "@/types/sleep";

type SleepCalendarProps = {
  entries: Record<string, SleepEntry>;
  selectedDate: string;
  month: string;
  onSelectDate: (date: string) => void;
  onChangeMonth: (month: string) => void;
  onLogSleep: () => void;
};

const qualityColor: Record<SleepQuality, string> = {
  bad: "bg-red-500",
  okay: "bg-yellow-400",
  great: "bg-green-500",
};

const qualityLabel: Record<SleepQuality, string> = {
  bad: "Bad",
  okay: "Okay",
  great: "Great",
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours} hr ${remainingMinutes} min` : `${hours} hr`;
}

export default function SleepCalendar({
  entries,
  selectedDate,
  month,
  onSelectDate,
  onChangeMonth,
  onLogSleep,
}: SleepCalendarProps) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstDay = new Date(year, monthNumber - 1, 1);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const monthLabel = new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(firstDay);
  const selectedEntry = entries[selectedDate];
  const selectedDateLabel = selectedDate
    ? new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
      }).format(new Date(`${selectedDate}T12:00:00`))
    : "Selected day";

  function moveMonth(amount: number) {
    const nextMonth = new Date(year, monthNumber - 1 + amount, 1);
    onChangeMonth(`${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}`);
  }

  return (
    <section
      className="mt-5 rounded-2xl border border-[var(--dayline-line)] bg-white p-4 sm:p-5"
      aria-labelledby="sleep-calendar-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--dayline-muted)]">
            Your sleep log
          </p>
          <h2 id="sleep-calendar-heading" className="mt-1 text-lg font-semibold">
            {monthLabel}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => moveMonth(-1)}
            aria-label="Previous month"
            className="grid size-9 place-items-center rounded-lg text-[var(--dayline-muted)] hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
          >
            <ChevronLeft aria-hidden="true" size={18} />
          </button>
          <button
            type="button"
            onClick={() => moveMonth(1)}
            aria-label="Next month"
            className="grid size-9 place-items-center rounded-lg text-[var(--dayline-muted)] hover:bg-[var(--dayline-ground)] hover:text-[var(--dayline-ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
          >
            <ChevronRight aria-hidden="true" size={18} />
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <span
            key={day}
            className="py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--dayline-muted)]"
          >
            {day}
          </span>
        ))}
        {Array.from({ length: leadingDays }, (_, index) => (
          <span key={`empty-${index}`} aria-hidden="true" className="h-10" />
        ))}
        {Array.from({ length: daysInMonth }, (_, index) => {
          const date = new Date(year, monthNumber - 1, index + 1);
          const dateKey = formatDateKey(date);
          const entry = entries[dateKey];
          const isSelected = selectedDate === dateKey;
          const isToday = formatDateKey(new Date()) === dateKey;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => onSelectDate(dateKey)}
              aria-label={`${date.getDate()} ${monthLabel}${entry ? `, sleep rating: ${qualityLabel[entry.quality]}` : ", no sleep log"}`}
              aria-pressed={isSelected}
              className={`relative flex h-10 flex-col items-center justify-center rounded-lg text-xs transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--dayline-forest)] ${
                isSelected
                  ? "bg-[var(--dayline-mint)] font-semibold text-[var(--dayline-forest)]"
                  : "text-[var(--dayline-ink)] hover:bg-[var(--dayline-ground)]"
              } ${isToday ? "ring-1 ring-inset ring-[var(--dayline-forest)]/40" : ""}`}
            >
              <span>{date.getDate()}</span>
              {entry && (
                <span
                  aria-hidden="true"
                  className={`absolute bottom-1 size-1.5 rounded-full ${qualityColor[entry.quality]}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[var(--dayline-line)] pt-3">
        {(["bad", "okay", "great"] as const).map((quality) => (
          <span
            key={quality}
            className="inline-flex items-center gap-1.5 text-[10px] text-[var(--dayline-muted)]"
          >
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${qualityColor[quality]}`}
            />
            {qualityLabel[quality]}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--dayline-ground)] px-3 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold">{selectedDateLabel}</p>
          {selectedEntry ? (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--dayline-muted)]">
              <span className="inline-flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className={`size-2 rounded-full ${qualityColor[selectedEntry.quality]}`}
                />
                {qualityLabel[selectedEntry.quality]}
              </span>
              <span>{formatDuration(selectedEntry.durationMinutes)} between bedtime and wake-up</span>
              <span>Felt {selectedEntry.feeling}</span>
            </p>
          ) : (
            <p className="mt-1 text-xs text-[var(--dayline-muted)]">
              No sleep log for this day yet.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onLogSleep}
          className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg bg-[var(--dayline-forest)] px-3 text-xs font-semibold text-white hover:bg-[var(--dayline-forest-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)]"
        >
          <MoonStar aria-hidden="true" size={14} />
          {selectedEntry ? "Edit sleep log" : "Log sleep"}
        </button>
      </div>
    </section>
  );
}
