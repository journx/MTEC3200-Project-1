import { Check } from "lucide-react";

export const colorThemes = [
  { id: "forest", name: "Forest", color: "#28664e" },
  { id: "ocean", name: "Ocean", color: "#2f7182" },
  { id: "lavender", name: "Lavender", color: "#765c9e" },
  { id: "sunset", name: "Sunset", color: "#ac5b43" },
] as const;

export type ColorTheme = (typeof colorThemes)[number]["id"];

type ColorThemePickerProps = {
  value: ColorTheme;
  onChange: (theme: ColorTheme) => void;
};

export default function ColorThemePicker({
  value,
  onChange,
}: ColorThemePickerProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-xs font-medium text-[var(--dayline-muted)]">
        Color theme
      </legend>
      <div className="flex items-center gap-2" role="group" aria-label="Color theme">
        {colorThemes.map((theme) => (
          <button
            key={theme.id}
            type="button"
            onClick={() => onChange(theme.id)}
            aria-label={`${theme.name} color theme`}
            aria-pressed={value === theme.id}
            title={theme.name}
            className={`grid size-8 place-items-center rounded-full border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--dayline-forest)] ${
              value === theme.id
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
              ) : null}
            </span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
