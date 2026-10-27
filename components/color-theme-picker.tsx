import { Check, LockKeyhole } from "lucide-react";

export const colorThemes = [
  { id: "forest", name: "Forest", color: "#28664e", requiredStreak: 0 },
  { id: "ocean", name: "Ocean", color: "#2f7182", requiredStreak: 0 },
  { id: "lavender", name: "Lavender", color: "#765c9e", requiredStreak: 0 },
  { id: "sunset", name: "Sunset", color: "#ac5b43", requiredStreak: 0 },
  { id: "sky", name: "Sky", color: "#3975a8", requiredStreak: 7 },
  { id: "berry", name: "Berry", color: "#9b4f70", requiredStreak: 14 },
  { id: "midnight", name: "Midnight", color: "#52628f", requiredStreak: 21 },
] as const;

export type ColorTheme = (typeof colorThemes)[number]["id"];

type ColorThemePickerProps = {
  value: ColorTheme;
  bestStreak: number;
  onChange: (theme: ColorTheme) => void;
};

export default function ColorThemePicker({
  value,
  bestStreak,
  onChange,
}: ColorThemePickerProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-medium text-[var(--dayline-muted)]">
        Color theme
      </legend>
      <div className="flex items-center gap-2" role="group" aria-label="Color theme">
        {colorThemes.map((theme) => (
          <span key={theme.id} className="relative">
            <button
              type="button"
              onClick={() => onChange(theme.id)}
              disabled={bestStreak < theme.requiredStreak}
              aria-label={
                bestStreak >= theme.requiredStreak
                  ? `${theme.name} color theme`
                  : `${theme.name} color theme, unlocks at a ${theme.requiredStreak}-day streak`
              }
              aria-pressed={value === theme.id}
              title={
                bestStreak >= theme.requiredStreak
                  ? theme.name
                  : `Unlock at ${theme.requiredStreak} days`
              }
              className={`grid size-8 place-items-center rounded-full border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)] ${
                bestStreak < theme.requiredStreak
                  ? "cursor-not-allowed border-transparent opacity-50"
                  : value === theme.id
                    ? "border-[var(--dayline-ink)]"
                    : "border-transparent hover:scale-110"
              }`}
            >
              <span
                className="grid size-5 place-items-center rounded-full text-white"
                style={{ backgroundColor: theme.color }}
              >
                {value === theme.id ? (
                  <Check aria-hidden="true" size={12} strokeWidth={3} />
                ) : bestStreak < theme.requiredStreak ? (
                  <LockKeyhole aria-hidden="true" size={10} />
                ) : null}
              </span>
            </button>
          </span>
        ))}
      </div>
    </fieldset>
  );
}
