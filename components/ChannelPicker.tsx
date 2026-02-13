"use client";

import type { Channel } from "@/lib/ui/generateClient";
import { CHANNEL_CONSTRAINTS } from "@/lib/prompts/generateCopy";

const CHANNEL_LABELS: Record<Channel, string> = {
  smartstore: "스마트스토어",
  coupang: "쿠팡",
  affiliate: "제휴/블로그",
  social: "SNS",
  shortform: "숏폼",
};

type ChannelPickerProps = {
  value: Channel;
  onChange: (c: Channel) => void;
  disabled?: boolean;
};

export function ChannelPicker({
  value,
  onChange,
  disabled = false,
}: ChannelPickerProps) {
  const channels = Object.keys(CHANNEL_CONSTRAINTS) as Channel[];
  const constraint = CHANNEL_CONSTRAINTS[value];
  return (
    <fieldset className="space-y-2" aria-describedby="channel-helper">
      <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
        채널
      </legend>
      <div className="flex flex-wrap gap-2">
        {channels.map((c) => (
          <label
            key={c}
            className="inline-flex cursor-pointer items-center rounded-lg border px-3 py-2 text-sm transition focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 dark:has-[:checked]:bg-blue-900/20"
          >
            <input
              type="radio"
              name="channel"
              value={c}
              checked={value === c}
              onChange={() => onChange(c)}
              disabled={disabled}
              className="sr-only"
              aria-describedby="channel-helper"
            />
            <span>{CHANNEL_LABELS[c]}</span>
          </label>
        ))}
      </div>
      <p
        id="channel-helper"
        className="text-xs text-gray-500 dark:text-gray-400"
      >
        {constraint?.headlineLength ?? ""}
      </p>
    </fieldset>
  );
}
