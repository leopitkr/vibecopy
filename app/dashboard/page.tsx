"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditBadge } from "@/components/CreditBadge";
import { PlanBadge } from "@/components/PlanBadge";
import { UsageStats } from "@/components/UsageStats";

type Me = { email?: string; plan?: string; credit_balance?: number } | null;
type RecentItem = { id: string; created_at: string; channel: string; vibe: string; input_preview: string };

const CHANNEL_LABELS: Record<string, string> = {
  smartstore: "스마트스토어",
  coupang: "쿠팡",
  social: "SNS",
  shortform: "숏폼",
  affiliate: "제휴",
};
const VIBE_LABELS: Record<string, string> = {
  trust: "신뢰",
  review: "후기",
  impulse: "자극",
  premium: "프리미엄",
  groupbuy: "공구",
};

export default function DashboardPage() {
  const [me, setMe] = useState<Me>(null);
  const [recent, setRecent] = useState<RecentItem[]>([]);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) setMe(data.data);
      });
  }, []);

  useEffect(() => {
    fetch("/api/generations?limit=5", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.items) setRecent(data.data.items);
      });
  }, []);

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          대시보드
        </h1>
        {me && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {me.email ?? "로그인됨"}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-4">
          {me && (
            <>
              <PlanBadge plan={me.plan ?? null} />
              <CreditBadge creditsLeft={me.credit_balance ?? null} />
            </>
          )}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/generate"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            생성하러 가기
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            요금제 보기
          </Link>
        </div>

        <div className="mt-8">
          <UsageStats />
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              최근 생성
            </h2>
            <Link
              href="/history"
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              전체 보기
            </Link>
          </div>
          <div className="mt-3 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
            {recent.length === 0 ? (
              <p className="p-4 text-sm text-gray-500 dark:text-gray-400">
                최근 생성 기록이 없습니다.
              </p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {recent.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/history`}
                      className="block p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.created_at).toLocaleString("ko-KR")}
                      </span>
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                        {CHANNEL_LABELS[item.channel] ?? item.channel}
                      </span>
                      <span className="ml-1 rounded bg-gray-100 px-1.5 py-0.5 text-xs dark:bg-gray-700">
                        {VIBE_LABELS[item.vibe] ?? item.vibe}
                      </span>
                      <p className="mt-1 truncate text-sm text-gray-700 dark:text-gray-300">
                        {item.input_preview}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/generate" className="underline focus:ring-2 focus:ring-blue-500">
            카피 생성
          </Link>
          {" · "}
          <Link href="/history" className="underline focus:ring-2 focus:ring-blue-500">
            생성 기록
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
