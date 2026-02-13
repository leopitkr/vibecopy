"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  createIdempotencyKey,
  generate,
  type Channel,
  type GenerateOutput,
  type Vibe,
} from "@/lib/ui/generateClient";
import { CreditBadge } from "./CreditBadge";
import { ChannelPicker } from "./ChannelPicker";
import { VibePresetPicker } from "./VibePresetPicker";
import { CopyPackageView } from "./CopyPackageView";

type SourceType = "url" | "manual";

const INPUT_VALUE_MAX_LENGTH = 1000;

/*
 * Manual test steps (add as comment block in page):
 * (UI-1) Authenticated user with credits >0 can generate and sees results
 * (UI-2) Free user on 4th generation -> API returns 429; UI shows upgrade modal
 * (UI-3) Network / AI failure -> shows error and retry button; retry reuses idempotencyKey and does not double-charge
 * (UI-4) Copy buttons copy correct text (unit test or manual)
 * (UI-5) Loading state appears and prevents duplicate submits
 * (C-1) Input over 1000 chars -> counter shows over limit, submit disabled; API returns INPUT_TOO_LONG if bypassed
 */

export function GeneratePageClient() {
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [sourceType, setSourceType] = useState<SourceType>("manual");
  const [urlValue, setUrlValue] = useState("");
  const [productName, setProductName] = useState("");
  const [bullets, setBullets] = useState<string[]>(["", "", "", "", ""]);
  const [price, setPrice] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [channel, setChannel] = useState<Channel>("smartstore");
  const [vibe, setVibe] = useState<Vibe>("trust");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateOutput | null>(null);
  const [creditsAfter, setCreditsAfter] = useState<number | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState<string | null>(
    null
  );

  const fetchMe = useCallback(async () => {
    setMeLoading(true);
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json();
      if (data?.data?.credit_balance !== undefined) {
        setCreditsLeft(data.data.credit_balance);
      } else {
        setCreditsLeft(null);
      }
    } catch {
      setCreditsLeft(null);
    } finally {
      setMeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const buildInputValue = useCallback((): string => {
    if (sourceType === "url") return urlValue.trim();
    const parts: string[] = [];
    if (productName.trim()) parts.push(`상품명: ${productName.trim()}`);
    const b = bullets.filter(Boolean);
    if (b.length) parts.push("특징:\n" + b.map((x) => `- ${x}`).join("\n"));
    if (price.trim()) parts.push(`가격: ${price.trim()}`);
    if (targetAudience.trim()) parts.push(`타겟: ${targetAudience.trim()}`);
    return parts.join("\n\n");
  }, [sourceType, urlValue, productName, bullets, price, targetAudience]);

  const inputLength = buildInputValue().length;
  const inputTooLong = inputLength > INPUT_VALUE_MAX_LENGTH;
  const inputValid = inputLength > 0 && !inputTooLong;

  const handleSubmit = useCallback(
    async (idempotencyKey: string) => {
      const inputValue = buildInputValue();
      if (!inputValue.trim()) {
        setError({ code: "BAD_REQUEST", message: "입력 내용을 입력해 주세요." });
        return;
      }
      if (inputValue.length > INPUT_VALUE_MAX_LENGTH) {
        setError({
          code: "INPUT_TOO_LONG",
          message: "입력 길이가 너무 깁니다. 핵심만 요약해 주세요.",
        });
        return;
      }
      setError(null);
      setLoading(true);
      const res = await generate({
        idempotency_key: idempotencyKey,
        input_type: sourceType === "url" ? "url" : "text",
        input_value: inputValue,
        channel,
        vibe,
      });
      setLoading(false);
      if (res.ok) {
        setResult(res.data.output);
        setCreditsAfter(res.data.credits.after);
        setCreditsLeft(res.data.credits.after);
        return;
      }
      const err = res.error;
      if (err.code === "UNAUTHORIZED") {
        setError({ ...err, message: "로그인이 필요합니다." });
        return;
      }
      if (err.code === "INSUFFICIENT_CREDITS" || err.code === "DAILY_LIMIT_EXCEEDED") {
        setError(err);
        setUpgradeModal(true);
        return;
      }
      if (err.code === "IDEMPOTENCY_CONFLICT") {
        setError(err);
        return;
      }
      setError(err);
    },
    [buildInputValue, sourceType, channel, vibe]
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const key = createIdempotencyKey();
      setLastIdempotencyKey(key);
      handleSubmit(key);
    },
    [handleSubmit]
  );

  const onRetry = useCallback(() => {
    if (lastIdempotencyKey) {
      setError(null);
      setLoading(true);
      handleSubmit(lastIdempotencyKey);
    }
  }, [lastIdempotencyKey, handleSubmit]);

  const insufficient =
    creditsLeft !== null && creditsLeft <= 0 && !meLoading;
  const canSubmit =
    !meLoading &&
    !loading &&
    inputValid &&
    (creditsLeft === null || creditsLeft > 0);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          카피 생성
        </h1>
        <CreditBadge
          creditsLeft={creditsLeft}
          loading={meLoading}
          insufficient={insufficient}
        />
      </header>

      {upgradeModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
        >
          <div className="max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 id="upgrade-modal-title" className="text-lg font-semibold text-gray-900 dark:text-white">
              크레딧 부족
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              {error?.code === "DAILY_LIMIT_EXCEEDED"
                ? "무료 플랜 일일 한도(3회)를 모두 사용했습니다."
                : "크레딧이 부족합니다. 업그레이드 후 이용해 주세요."}
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/pricing"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 hover:bg-blue-700"
              >
                업그레이드
              </Link>
              <button
                type="button"
                onClick={() => setUpgradeModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:border-gray-600 dark:text-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-white/80 dark:bg-gray-900/80"
          aria-busy="true"
        >
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              생성 중…
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-2xl space-y-8">
        <form onSubmit={onSubmit} className="space-y-6">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
              소스
            </legend>
            <div className="flex gap-4">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="sourceType"
                  value="url"
                  checked={sourceType === "url"}
                  onChange={() => setSourceType("url")}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm">URL</span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="sourceType"
                  value="manual"
                  checked={sourceType === "manual"}
                  onChange={() => setSourceType("manual")}
                  className="rounded border-gray-300 focus:ring-blue-500"
                />
                <span className="text-sm">직접 입력</span>
              </label>
            </div>
            {sourceType === "url" ? (
              <input
                type="url"
                value={urlValue}
                onChange={(e) => setUrlValue(e.target.value)}
                placeholder="https://..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                aria-label="상품 URL"
              />
            ) : (
              <div className="mt-2 space-y-3">
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="상품명"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  aria-label="상품명"
                />
                {bullets.map((b, i) => (
                  <input
                    key={i}
                    type="text"
                    value={b}
                    onChange={(e) => {
                      const next = [...bullets];
                      next[i] = e.target.value;
                      setBullets(next);
                    }}
                    placeholder={`특징 ${i + 1}`}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    aria-label={`특징 ${i + 1}`}
                  />
                ))}
                <input
                  type="text"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="가격 (선택)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  aria-label="가격"
                />
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="타겟 고객 (선택)"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  aria-label="타겟 고객"
                />
              </div>
            )}
            <p
              className={`mt-1 text-xs ${inputTooLong ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400"}`}
              aria-live="polite"
            >
              {sourceType === "url"
                ? `URL 입력: ${urlValue.length} / ${INPUT_VALUE_MAX_LENGTH}자`
                : `전체 입력: ${inputLength} / ${INPUT_VALUE_MAX_LENGTH}자`}
              {inputTooLong && " (초과 시 생성할 수 없습니다)"}
            </p>
          </fieldset>

          <ChannelPicker value={channel} onChange={setChannel} disabled={loading} />
          <VibePresetPicker value={vibe} onChange={setVibe} disabled={loading} />

          {error && !upgradeModal && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200"
            >
              <p>{error.message}</p>
              {(error.code === "AI_FAILED" || error.code === "INTERNAL") && (
                <button
                  type="button"
                  onClick={onRetry}
                  className="mt-2 rounded border border-red-300 px-3 py-1 text-sm font-medium text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-red-600 dark:text-red-300"
                >
                  재시도
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            aria-busy={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-base font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 dark:focus:ring-offset-gray-900"
          >
            생성
          </button>
        </form>

        {result && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <CopyPackageView output={result} />
            {creditsAfter !== null && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                남은 크레딧: {creditsAfter}
              </p>
            )}
            <p className="mt-3 text-center">
              <Link
                href="/feedback"
                className="text-xs text-blue-600 underline hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                서비스 개선을 위한 1분 피드백
              </Link>
            </p>
          </div>
        )}
      </div>

      <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
        <Link href="/me" className="underline focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          내 정보
        </Link>
        {" · "}
        <Link href="/" className="underline focus:rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          홈
        </Link>
      </p>
    </main>
  );
}
