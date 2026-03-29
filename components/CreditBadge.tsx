"use client";

import Link from "next/link";
import { LOW_CREDIT_THRESHOLD, type PlanType, type PlanLimitType } from "@/lib/constants/limits";

export type PlanInfo = {
  type: PlanLimitType;
  label: string;
  limit: number;
  remaining: number;
};

type CreditBadgeProps = {
  plan: PlanType;
  planInfo?: PlanInfo | null;
  creditsLeft: number | null;
  loading?: boolean;
};

function getBadgeText(plan: PlanType, planInfo: PlanInfo | null | undefined, creditsLeft: number | null): string {
  if (planInfo) {
    if (planInfo.type === "unlimited") {
      return `${planInfo.label} · 무제한 이용 중`;
    }
    if (planInfo.type === "daily") {
      return `${planInfo.label} 플랜 · 오늘 ${planInfo.remaining}회 남음`;
    }
    if (planInfo.type === "monthly") {
      return `${planInfo.label} · 이번 달 ${planInfo.remaining}회 남음`;
    }
  }
  // Fallback for old API response format
  return `${creditsLeft ?? 0} 크레딧`;
}

function isLowCredit(plan: PlanType, remaining: number): boolean {
  const threshold = LOW_CREDIT_THRESHOLD[plan];
  return remaining <= threshold;
}

export function CreditBadge({
  plan,
  planInfo,
  creditsLeft,
  loading = false,
}: CreditBadgeProps) {
  if (loading) {
    return (
      <span className="credit-badge credit-badge-loading" aria-busy="true">
        <span className="credit-badge-dot loading" />
        로딩 중
      </span>
    );
  }

  const remaining = planInfo?.remaining ?? creditsLeft ?? 0;
  const isLow = isLowCredit(plan, remaining);
  const isEmpty = remaining <= 0;
  const badgeText = getBadgeText(plan, planInfo, creditsLeft);

  return (
    <div className="credit-badge-wrapper">
      <span
        className={`credit-badge ${isEmpty ? "empty" : isLow ? "low" : ""}`}
        aria-describedby={isLow ? "credit-warning" : undefined}
      >
        {badgeText}
      </span>
      {isEmpty && plan === "free" && (
        <span id="credit-warning" className="credit-badge-warning empty">
          <Link href="/pricing">업그레이드</Link>
        </span>
      )}
      {isLow && !isEmpty && (
        <span id="credit-warning" className="credit-badge-warning low">
          <Link href="/pricing">업그레이드</Link>
        </span>
      )}
    </div>
  );
}
