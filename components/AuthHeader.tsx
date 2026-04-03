"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CreditBadge, type PlanInfo } from "./CreditBadge";
import type { PlanType } from "@/lib/constants/limits";

type UserData = {
  email: string | null;
  nickname: string | null;
  plan: PlanType;
  credit_balance: number;
  plan_info: PlanInfo | null;
};

export function AuthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me", { credentials: "include", cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.id) {
          setUser({
            email: data.data.email ?? null,
            nickname: data.data.nickname ?? null,
            plan: (data.data.plan as PlanType) ?? "free",
            credit_balance: data.data.credit_balance ?? 0,
            plan_info: data.data.plan_info ?? null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/logout", { method: "POST", credentials: "include" });
      setUser(null);
      router.refresh();
      router.push("/");
    } catch {
      // Ignore
    }
  }, [router]);

  const returnUrl = pathname || "/generate";

  return (
    <header className="header-blur">
      <div className="header-inner">
        <Link href="/" className="logo">
          VibeCopy
        </Link>
        <nav>
          <Link href="/pricing">요금제</Link>
          <Link href="/guide">가이드</Link>
          <Link href="/faq">FAQ</Link>
          {loading ? (
            <div style={{ width: 80, height: 32, background: "rgba(255,255,255,0.1)", borderRadius: 8 }} />
          ) : user ? (
            <>
              <CreditBadge
                plan={user.plan}
                planInfo={user.plan_info}
                creditsLeft={user.credit_balance}
              />
              <Link
                href="/me"
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.85rem",
                  textDecoration: "none",
                  maxWidth: 120,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
                title={user.email ?? undefined}
              >
                {user.nickname || user.email?.split("@")[0] || "내 정보"}
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-ghost"
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="btn btn-ghost">
                로그인
              </Link>
              <Link href={`/signup?returnUrl=${encodeURIComponent(returnUrl)}`} className="btn btn-primary">
                시작하기
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
