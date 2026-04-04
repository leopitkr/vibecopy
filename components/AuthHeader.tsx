"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { CreditBadge, type PlanInfo } from "./CreditBadge";
import type { PlanType } from "@/lib/constants/limits";

type TrialInfo = {
  active: boolean;
  ends_at: string;
};

type UserData = {
  email: string | null;
  nickname: string | null;
  plan: PlanType;
  credit_balance: number;
  plan_info: PlanInfo | null;
  trial: TrialInfo | null;
};

export function AuthHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

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
            trial: data.data.trial ?? null,
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
    }
  }, [menuOpen]);

  const handleLogout = useCallback(async () => {
    setMenuOpen(false);
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

  const triggerStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    padding: 0,
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "0.625rem",
    color: "#94a3b8",
    cursor: "pointer",
    transition: "all 0.2s",
  };

  const dropdownStyle: React.CSSProperties = {
    position: "absolute",
    top: "calc(100% + 0.5rem)",
    right: 0,
    minWidth: 200,
    background: "rgba(20, 20, 35, 0.97)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "0.875rem",
    padding: "0.5rem",
    zIndex: 9999,
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.5)",
  };

  const menuItemStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
    width: "100%",
    padding: "0.625rem 0.875rem",
    background: "none",
    border: "none",
    borderRadius: "0.5rem",
    color: "#94a3b8",
    fontSize: "0.875rem",
    fontWeight: 500,
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.15s",
    textAlign: "left" as const,
  };

  const dividerStyle: React.CSSProperties = {
    height: 1,
    background: "rgba(255, 255, 255, 0.1)",
    margin: "0.375rem 0.5rem",
  };

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
                trialInfo={user.trial}
                creditsLeft={user.credit_balance}
              />
              <div ref={menuRef} style={{ position: "relative" }}>
                <button
                  type="button"
                  style={triggerStyle}
                  onClick={() => setMenuOpen((v) => !v)}
                  title="설정"
                  aria-label="설정"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.1)";
                    e.currentTarget.style.color = "white";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                  </svg>
                </button>
                {menuOpen && (
                  <div style={dropdownStyle}>
                    <Link
                      href="/account"
                      onClick={() => setMenuOpen(false)}
                      style={menuItemStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.color = "#94a3b8";
                      }}
                    >
                      <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>👤</span>
                      내 정보
                    </Link>
                    <Link
                      href="/account?tab=subscription"
                      onClick={() => setMenuOpen(false)}
                      style={menuItemStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.color = "#94a3b8";
                      }}
                    >
                      <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>💳</span>
                      구독 관리
                    </Link>
                    <Link
                      href="/history"
                      onClick={() => setMenuOpen(false)}
                      style={menuItemStyle}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                        e.currentTarget.style.color = "white";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                        e.currentTarget.style.color = "#94a3b8";
                      }}
                    >
                      <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>📄</span>
                      생성 기록
                    </Link>
                    <div style={dividerStyle} />
                    <button
                      type="button"
                      onClick={handleLogout}
                      style={{ ...menuItemStyle, color: "#f87171" }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(248,113,113,0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "none";
                      }}
                    >
                      <span style={{ fontSize: "1rem", width: "1.25rem", textAlign: "center" }}>🚪</span>
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
              <Link href={`/login?mode=signin&returnUrl=${encodeURIComponent(returnUrl)}`} className="btn btn-primary">
                로그인
              </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
