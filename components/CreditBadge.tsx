"use client";

import Link from "next/link";
import { LOW_CREDIT_THRESHOLD, type PlanType, type PlanLimitType } from "@/lib/constants/limits";

export type PlanInfo = {
  type: PlanLimitType;
  label: string;
  limit: number;
  remaining: number;
};

type TrialInfo = {
  active: boolean;
  ends_at: string;
};

type CreditBadgeProps = {
  plan: PlanType;
  planInfo?: PlanInfo | null;
  trialInfo?: TrialInfo | null;
  creditsLeft: number | null;
  loading?: boolean;
};

function getTrialDaysLeft(endsAt: string): number {
  const diff = new Date(endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function getBadgeText(plan: PlanType, planInfo: PlanInfo | null | undefined, trialInfo: TrialInfo | null | undefined, creditsLeft: number | null): string {
  if (planInfo) {
    if (planInfo.type === "unlimited") {
      return `Pro · 무제한`;
    }
    if (planInfo.type === "daily") {
      if (trialInfo?.active) {
        const days = getTrialDaysLeft(trialInfo.ends_at);
        return `체험 ${days}일 · ${planInfo.remaining}회 남음`;
      }
      return `무료 · ${planInfo.remaining}회 남음`;
    }
    if (planInfo.type === "monthly") {
      return `Standard · ${planInfo.remaining}회 남음`;
    }
  }
  return `${creditsLeft ?? 0} 크레딧`;
}

function getRemainingState(remaining: number): "empty" | "warn" | "low" | "" {
  if (remaining <= 0) return "empty";
  if (remaining === 1) return "low";
  if (remaining === 2) return "warn";
  return "";
}

function isLowCredit(plan: PlanType, remaining: number): boolean {
  const threshold = LOW_CREDIT_THRESHOLD[plan];
  return remaining <= threshold;
}

export function CreditBadge({
  plan,
  planInfo,
  trialInfo,
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
  const state = getRemainingState(remaining);
  const badgeText = getBadgeText(plan, planInfo, trialInfo, creditsLeft);

  return (
    <Link href="/pricing" className="credit-badge-wrapper credit-badge-link">
      <span
        className={`credit-badge ${state}`}
      >
        {badgeText}
      </span>
      {(isEmpty || isLow) && plan === "free" && (
        <span className={`credit-upgrade-btn ${isEmpty ? "empty" : "low"}`}>
          {isEmpty ? "Standard로 업그레이드" : "업그레이드"}
        </span>
      )}
    </Link>
  );
}
