"use client";

import Link from "next/link";
import { useCallback, useState } from "react";

const PURPOSE_OPTIONS = [
  { value: "smartstore", label: "스마트스토어" },
  { value: "coupang", label: "쿠팡" },
  { value: "groupbuy", label: "공동구매" },
  { value: "shortform", label: "숏폼" },
] as const;

export default function FeedbackPage() {
  const [purpose, setPurpose] = useState<string>("smartstore");
  const [rating, setRating] = useState<number>(3);
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [request, setRequest] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            purpose,
            rating,
            good: good.trim() || undefined,
            bad: bad.trim() || undefined,
            request: request.trim() || undefined,
            email: email.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError((data.error?.message as string) ?? "제출에 실패했습니다.");
          return;
        }
        setSent(true);
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [purpose, rating, good, bad, request, email]
  );

  if (sent) {
    return (
      <main className="min-h-screen p-6">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            피드백을 보내주셔서 감사합니다
          </h1>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            소중한 의견으로 서비스를 개선하겠습니다.
          </p>
          <Link
            href="/"
            className="mt-8 inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            홈으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-lg">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          피드백 보내기
        </h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          베타 서비스 개선을 위해 1분만 소요해 주세요.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              사용 목적
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            >
              {PURPOSE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              만족도 (1–5)
            </span>
            <div className="mt-2 flex gap-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <label key={n} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="radio"
                    name="rating"
                    value={n}
                    checked={rating === n}
                    onChange={() => setRating(n)}
                    className="rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{n}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              가장 좋았던 점
            </label>
            <textarea
              value={good}
              onChange={(e) => setGood(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="선택 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              아쉬웠던 점
            </label>
            <textarea
              value={bad}
              onChange={(e) => setBad(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="선택 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              개선 요청
            </label>
            <textarea
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              rows={3}
              maxLength={2000}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="선택 입력"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              이메일 (선택, 답변 필요 시)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={256}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              placeholder="example@email.com"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "제출 중…" : "피드백 보내기"}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="underline focus:ring-2 focus:ring-blue-500">
            홈으로
          </Link>
        </p>
      </div>
    </main>
  );
}
