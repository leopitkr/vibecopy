"use client";

import type { GenerateOutput } from "@/lib/ui/generateClient";
import { CopyPackageView } from "./CopyPackageView";
import { RegenerateButton } from "./RegenerateButton";

const CHANNEL_LABELS: Record<string, string> = {
  smartstore: "스마트스토어",
  coupang: "쿠팡",
  affiliate: "제휴",
  social: "SNS",
  shortform: "숏폼",
};
const VIBE_LABELS: Record<string, string> = {
  trust: "신뢰",
  review: "후기",
  impulse: "자극",
  premium: "프리미엄",
  groupbuy: "공구",
};

export type GenerationDetail = {
  id: string;
  created_at: string;
  channel: string;
  vibe: string;
  input_type: string;
  input_value: string;
  output: GenerateOutput;
};

type GenerationDetailModalProps = {
  generation: GenerationDetail | null;
  onClose: () => void;
  onRegenerated?: (output: GenerateOutput) => void;
};

export function GenerationDetailModal({
  generation,
  onClose,
  onRegenerated,
}: GenerationDetailModalProps) {
  if (!generation) return null;
  const d = generation;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
          <h2 id="detail-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
            생성 결과
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {new Date(d.created_at).toLocaleString("ko-KR")} · {CHANNEL_LABELS[d.channel] ?? d.channel} · {VIBE_LABELS[d.vibe] ?? d.vibe}
          </p>
          <CopyPackageView output={d.output} />
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <RegenerateButton
              inputType={d.input_type as "url" | "text"}
              inputValue={d.input_value}
              channel={d.channel as "smartstore" | "coupang" | "affiliate" | "social" | "shortform"}
              vibe={d.vibe as "trust" | "review" | "impulse" | "premium" | "groupbuy"}
              onSuccess={onRegenerated}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
