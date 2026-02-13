"use client";

import { useState } from "react";
import Link from "next/link";

type PlanId = "standard" | "pro";

export default function PricingPage() {
  const [loading, setLoading] = useState<PlanId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade(plan: PlanId) {
    setError(null);
    setLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError((data.error?.message as string) ?? "결제 시작 실패");
        return;
      }
      const url = data.url as string;
      if (url) window.location.href = url;
      else setError("결제 URL을 받지 못했습니다.");
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          요금제
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          플랜을 선택하고 업그레이드하세요.
        </p>

        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Free
            </h2>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              0원
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              일 3회 생성
            </p>
            <ul className="mt-4 list-inside list-disc text-sm text-gray-600 dark:text-gray-300">
              <li>기본 바이브 사용</li>
              <li>생성 기록 저장</li>
            </ul>
            <Link
              href="/generate"
              className="mt-6 block w-full rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-200"
            >
              시작하기
            </Link>
          </section>

          <section className="rounded-xl border-2 border-blue-500 bg-white p-6 shadow-sm dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Standard
            </h2>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              19,000원
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              월 500 크레딧
            </p>
            <ul className="mt-4 list-inside list-disc text-sm text-gray-600 dark:text-gray-300">
              <li>전체 바이브 사용</li>
              <li>히스토리 저장</li>
            </ul>
            <button
              type="button"
              onClick={() => handleUpgrade("standard")}
              disabled={!!loading}
              aria-busy={loading === "standard"}
              className="mt-6 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 hover:bg-blue-700"
            >
              {loading === "standard" ? "이동 중…" : "업그레이드"}
            </button>
          </section>

          <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Pro
            </h2>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              49,000원
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              무제한 생성
            </p>
            <ul className="mt-4 list-inside list-disc text-sm text-gray-600 dark:text-gray-300">
              <li>브랜드 보이스 저장</li>
              <li>CSV 다운로드</li>
              <li>A/B 카피 변형</li>
            </ul>
            <button
              type="button"
              onClick={() => handleUpgrade("pro")}
              disabled={!!loading}
              aria-busy={loading === "pro"}
              className="mt-6 w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 hover:bg-blue-700"
            >
              {loading === "pro" ? "이동 중…" : "업그레이드"}
            </button>
          </section>
        </div>

        {error && (
          <p role="alert" className="mt-6 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/generate" className="underline focus:ring-2 focus:ring-blue-500">
            카피 생성
          </Link>
          {" · "}
          <Link href="/me" className="underline focus:ring-2 focus:ring-blue-500">
            내 정보
          </Link>
        </p>
      </div>
    </main>
  );
}
