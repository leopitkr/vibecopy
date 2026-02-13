"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  createIdempotencyKey,
  generate,
  type Channel,
  type GenerateOutput,
  type Vibe,
} from "@/lib/ui/generateClient";

type RegenerateButtonProps = {
  inputType: "url" | "text";
  inputValue: string;
  channel: Channel;
  vibe: Vibe;
  onSuccess?: (output: GenerateOutput) => void;
};

export function RegenerateButton({
  inputType,
  inputValue,
  channel,
  vibe,
  onSuccess,
}: RegenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);

  const run = useCallback(async () => {
    setError(null);
    setLoading(true);
    const key = createIdempotencyKey();
    const res = await generate({
      idempotency_key: key,
      input_type: inputType,
      input_value: inputValue,
      channel,
      vibe,
    });
    setLoading(false);
    if (res.ok) {
      onSuccess?.(res.data.output);
      return;
    }
    if (res.error.code === "INSUFFICIENT_CREDITS" || res.error.code === "DAILY_LIMIT_EXCEEDED") {
      setShowUpgrade(true);
      return;
    }
    setError(res.error);
  }, [inputType, inputValue, channel, vibe, onSuccess]);

  return (
    <>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        aria-busy={loading}
        className="rounded-lg border border-blue-600 bg-white px-3 py-2 text-sm font-medium text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 hover:bg-blue-50 dark:bg-gray-800 dark:text-blue-300 dark:hover:bg-blue-900/20"
      >
        {loading ? "생성 중…" : "재생성"}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error.message}
        </p>
      )}
      {showUpgrade && (
        <div
          className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/20"
          role="alert"
        >
          <p className="text-amber-800 dark:text-amber-200">크레딧이 부족하거나 일일 한도에 도달했습니다.</p>
          <Link
            href="/pricing"
            className="mt-2 inline-block font-medium text-blue-600 underline focus:ring-2 focus:ring-blue-500 dark:text-blue-400"
          >
            업그레이드
          </Link>
          <button
            type="button"
            onClick={() => setShowUpgrade(false)}
            className="ml-3 text-amber-700 dark:text-amber-300"
          >
            닫기
          </button>
        </div>
      )}
    </>
  );
}
