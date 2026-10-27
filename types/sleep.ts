export type SleepQuality = "bad" | "okay" | "great";

export type MorningFeeling = "rested" | "okay" | "tired" | "other";

export type SleepEntry = {
  date: string;
  bedtime: string;
  wakeTime: string;
  durationMinutes: number;
  quality: SleepQuality;
  feeling: MorningFeeling;
};
