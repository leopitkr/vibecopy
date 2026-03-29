"use client";

import type { Channel } from "@/lib/ui/generateClient";

const CHANNEL_OPTIONS: { value: Channel; label: string; description: string }[] = [
  { value: "smartstore", label: "스마트스토어", description: "50~80자 헤드라인, 네이버 검색 최적화" },
  { value: "coupang", label: "쿠팡", description: "쿠팡 규정에 맞는 키워드 중심 타이틀" },
  { value: "affiliate", label: "제휴/블로그", description: "클릭을 유도하는 블로그/카페용 제목" },
  { value: "social", label: "SNS", description: "짧고 임팩트 있는 피드/스토리용" },
  { value: "shortform", label: "숏폼", description: "3~5초 내 후킹, 대화체 스크립트" },
];

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
  const selected = CHANNEL_OPTIONS.find((o) => o.value === value);
  return (
    <fieldset aria-describedby="channel-helper" className="picker-fieldset">
      <legend className="picker-legend">
        판매 채널
      </legend>
      <div className="picker-options">
        {CHANNEL_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`picker-option ${value === opt.value ? "active" : ""} ${disabled ? "disabled" : ""}`}
          >
            <input
              type="radio"
              name="channel"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="sr-only"
              aria-describedby="channel-helper"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {selected && (
        <p id="channel-helper" className="picker-helper">
          {selected.description}
        </p>
      )}
    </fieldset>
  );
}
