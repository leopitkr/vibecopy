"use client";

import Link from "next/link";

type CreditBadgeProps = {
  creditsLeft: number | null;
  loading?: boolean;
  insufficient?: boolean;
};

const label: Record<string, string> = {
  en: "Credits",
  ko: "크레딧",
};

export function CreditBadge({
  creditsLeft,
  loading = false,
  insufficient = false,
}: CreditBadgeProps) {
  if (loading) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-500 dark:bg-gray-800 dark:text-gray-400"
        aria-busy="true"
      >
        <span className="h-2 w-2 animate-pulse rounded-full bg-gray-400" />
        {label.ko}
      </span>
    );
  }
  const isLow = creditsLeft !== null && creditsLeft <= 0;
  return (
    <div className="inline-flex flex-col items-end">
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 ${
          isLow || insufficient
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200"
            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
        }`}
        aria-describedby={isLow || insufficient ? "credit-warning" : undefined}
      >
        <span aria-hidden="true">{creditsLeft ?? 0}</span>
        <span>{label.ko}</span>
      </span>
      {(isLow || insufficient) && (
        <span
          id="credit-warning"
          className="mt-1 text-xs text-amber-600 dark:text-amber-400"
        >
          <Link
            href="/pricing"
            className="underline focus:rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            업그레이드
          </Link>
        </span>
      )}
    </div>
  );
}
