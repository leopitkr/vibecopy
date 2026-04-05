"use client";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  trial: "무료 체험",
  standard: "Standard",
  pro: "Pro",
};

type PlanBadgeProps = {
  plan: string | null;
};

export function PlanBadge({ plan }: PlanBadgeProps) {
  const p = plan ?? "free";
  return (
    <span
      className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-200"
      aria-label={`플랜: ${PLAN_LABELS[p] ?? p}`}
    >
      {PLAN_LABELS[p] ?? p}
    </span>
  );
}
