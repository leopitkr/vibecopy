"use client";

import type { Vibe } from "@/lib/ui/generateClient";

const VIBE_OPTIONS: { value: Vibe; label: string; description: string }[] = [
  { value: "trust", label: "신뢰형", description: "팩트 중심, 전문가 느낌, 과장 없이 설득력 있게" },
  { value: "review", label: "후기형", description: "실사용자 경험 기반, 후기/리뷰와 어울리는 톤" },
  { value: "impulse", label: "자극형", description: "긴박감, 한정/마감 강조, 즉시 행동 유도" },
  { value: "premium", label: "프리미엄형", description: "고급스러운 톤, 브랜드 가치와 경험 강조" },
  { value: "groupbuy", label: "공구특화", description: "함께 구매의 특별함, 커뮤니티 느낌" },
];

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
  const selected = VIBE_OPTIONS.find((o) => o.value === value);
  return (
    <fieldset aria-describedby="vibe-helper" className="picker-fieldset">
      <legend className="picker-legend">
        톤 & 스타일
      </legend>
      <div className="picker-options">
        {VIBE_OPTIONS.map((opt) => (
          <label
            key={opt.value}
            className={`picker-option ${value === opt.value ? "active" : ""} ${disabled ? "disabled" : ""}`}
          >
            <input
              type="radio"
              name="vibe"
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              disabled={disabled}
              className="sr-only"
              aria-describedby="vibe-helper"
            />
            {opt.label}
          </label>
        ))}
      </div>
      {selected && (
        <p id="vibe-helper" className="picker-helper">
          {selected.description}
        </p>
      )}
    </fieldset>
  );
}
