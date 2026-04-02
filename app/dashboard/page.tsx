"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CreditBadge, type PlanInfo } from "@/components/CreditBadge";
import { PlanBadge } from "@/components/PlanBadge";
import { UsageStats } from "@/components/UsageStats";
import type { PlanType } from "@/lib/constants/limits";
import "../(marketing)/landing.css";

type Me = { email?: string; plan?: string; credit_balance?: number; plan_info?: PlanInfo } | null;
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
    <div className="landing-page">
      <div className="landing-gradient" />

      {/* Header */}
      <header className="header-blur">
        <div className="header-inner">
          <Link href="/" className="logo">
            VibeCopy
          </Link>
          <nav>
            <Link href="/generate">카피 생성</Link>
            <Link href="/history">생성 기록</Link>
            <Link href="/me">내 정보</Link>
            <Link href="/generate" className="btn btn-primary">
              새로 생성
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="content-section">
          <div className="content-inner" style={{ maxWidth: "700px" }}>
            <h1 className="content-title">대시보드</h1>
            {me && (
              <p className="content-subtitle" style={{ marginBottom: "2rem" }}>
                {me.email ?? "로그인됨"}
              </p>
            )}

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
              {me && (
                <>
                  <PlanBadge plan={me.plan ?? null} />
                  <CreditBadge
                    plan={(me.plan as PlanType) ?? "free"}
                    planInfo={me.plan_info ?? null}
                    creditsLeft={me.credit_balance ?? null}
                  />
                </>
              )}
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "2rem" }}>
              <Link href="/generate" className="btn btn-primary">
                생성하러 가기
              </Link>
              <Link href="/pricing" className="btn btn-ghost">
                요금제 보기
              </Link>
            </div>

            <div style={{ marginBottom: "2rem" }}>
              <UsageStats />
            </div>

            <div className="content-block">
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
                <h2>최근 생성</h2>
                <Link href="/history" style={{ color: "var(--indigo-400)", fontSize: "0.875rem", fontWeight: 500 }}>
                  전체 보기
                </Link>
              </div>
              <div className="demo-card">
                {recent.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--text-muted)" }}>
                    최근 생성 기록이 없습니다.
                  </div>
                ) : (
                  <div>
                    {recent.map((item, index) => (
                      <Link
                        key={item.id}
                        href="/history"
                        style={{
                          display: "block",
                          padding: "1rem 1.5rem",
                          borderBottom: index < recent.length - 1 ? "1px solid var(--border-color)" : "none",
                          transition: "background 0.2s",
                        }}
                        className="recent-item"
                      >
                        <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {new Date(item.created_at).toLocaleString("ko-KR")}
                        </span>
                        <span style={{
                          marginLeft: "0.5rem",
                          padding: "0.125rem 0.5rem",
                          background: "rgba(99, 102, 241, 0.2)",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          color: "var(--indigo-400)",
                        }}>
                          {CHANNEL_LABELS[item.channel] ?? item.channel}
                        </span>
                        <span style={{
                          marginLeft: "0.25rem",
                          padding: "0.125rem 0.5rem",
                          background: "rgba(99, 102, 241, 0.2)",
                          borderRadius: "0.25rem",
                          fontSize: "0.75rem",
                          color: "var(--indigo-400)",
                        }}>
                          {VIBE_LABELS[item.vibe] ?? item.vibe}
                        </span>
                        <p style={{
                          marginTop: "0.5rem",
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}>
                          {item.input_preview}
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <div className="footer-inner">
          <span>© VibeCopy</span>
          <nav>
            <Link href="/generate">카피 생성</Link>
            <Link href="/history">생성 기록</Link>
            <Link href="/me">내 정보</Link>
            <Link href="/">홈</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
