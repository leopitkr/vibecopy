"use client";

import type { Vibe } from "@/lib/ui/generateClient";
import { VIBE_PRESETS } from "@/lib/prompts/generateCopy";

const VIBE_LABELS: Record<Vibe, string> = {
  trust: "신뢰형",
  review: "후기형",
  impulse: "자극형",
  premium: "프리미엄형",
  groupbuy: "공구특화",
};

type VibePresetPickerProps = {
  value: Vibe;
  onChange: (v: Vibe) => void;
  disabled?: boolean;
};

export function VibePresetPicker({
  value,
  onChange,
  disabled = false,
}: VibePresetPickerProps) {
  const vibes = Object.keys(VIBE_PRESETS) as Vibe[];
  const preset = VIBE_PRESETS[value];
  return (
    <fieldset className="space-y-2" aria-describedby="vibe-helper">
      <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
        바이브
      </legend>
      <div className="flex flex-wrap gap-2">
        {vibes.map((v) => (
          <label
            key={v}
            className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm transition focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20"
          >
            <input
              type="radio"
              name="vibe"
              value={v}
              checked={value === v}
              onChange={() => onChange(v)}
              disabled={disabled}
              className="sr-only"
              aria-describedby="vibe-helper"
            />
            <span>{VIBE_LABELS[v]}</span>
          </label>
        ))}
      </div>
      <p id="vibe-helper" className="text-xs text-gray-500 dark:text-gray-400">
        {preset?.tone ?? ""}
      </p>
    </fieldset>
  );
}
