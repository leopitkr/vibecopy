"use client";

import { useEffect, useState } from "react";

type Stats = { last7Days: number; thisMonth: number } | null;

export function UsageStats() {
  const [stats, setStats] = useState<Stats>(null);
  useEffect(() => {
    fetch("/api/generations/stats", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok && data?.data) setStats(data.data);
      })
      .catch(() => setStats(null));
  }, []);

  if (stats === null) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
        <p className="text-sm text-gray-500 dark:text-gray-400">사용량 불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">사용량 (MVP)</h3>
      <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-gray-500 dark:text-gray-400">최근 7일</dt>
          <dd className="font-medium text-gray-900 dark:text-white">{stats.last7Days}회</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">이번 달</dt>
          <dd className="font-medium text-gray-900 dark:text-white">{stats.thisMonth}회</dd>
        </div>
      </dl>
    </div>
  );
}
