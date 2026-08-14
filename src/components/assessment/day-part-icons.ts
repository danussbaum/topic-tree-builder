import { Moon, Sun, Sunrise, Sunset, Utensils } from "lucide-react";
import type { DayPart } from "@/types/assessment";

export const DAY_PART_ICONS: Record<DayPart, typeof Sunrise> = {
  morning: Sunrise,
  noon: Utensils,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};
