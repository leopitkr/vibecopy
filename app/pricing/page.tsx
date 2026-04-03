"use client";

import { useState } from "react";
import Link from "next/link";
import "../(marketing)/landing.css";

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
    <div className="landing-page">
      <div className="landing-gradient" />

      {/* Header */}
      <header className="header-blur">
        <div className="header-inner">
          <Link href="/" className="logo">
            VibeCopy
          </Link>
          <nav>
            <Link href="/pricing">요금제</Link>
            <Link href="/guide">가이드</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/login" className="btn btn-ghost">
              로그인
            </Link>
            <Link href="/generate" className="btn btn-primary">
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="hero" style={{ paddingBottom: "4rem" }}>
          <div className="hero-inner">
            <p className="section-label">요금제</p>
            <h1 style={{ marginBottom: "1rem" }}>부담 없이 무료로 시작하세요</h1>
            <p>필요에 맞는 플랜을 선택하세요</p>
          </div>
        </section>

        <section style={{ paddingTop: 0 }}>
          <div className="section-inner" style={{ maxWidth: "1000px" }}>
            <div className="pricing-grid">
              {/* Free Plan */}
              <div className="pricing-card">
                <h2 className="pricing-tier">Free</h2>
                <p className="pricing-price">0원</p>
                <p className="pricing-period">하루 1회 생성</p>
                <ul className="pricing-features">
                  <li>
                    <span className="check-icon">✓</span>
                    전체 채널 지원
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    기본 AI (gpt-4o-mini)
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    생성 기록 저장
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    가입 후 7일간 프리미엄 체험
                  </li>
                </ul>
                <Link href="/generate" className="btn btn-ghost" style={{ width: "100%", marginTop: "auto" }}>
                  무료로 시작하기
                </Link>
              </div>

              {/* Standard Plan */}
              <div className="pricing-card pricing-card-featured">
                <span className="pricing-badge">추천</span>
                <h2 className="pricing-tier pricing-tier-featured">Standard</h2>
                <p className="pricing-price">
                  19,000원<span className="pricing-unit">/월</span>
                </p>
                <p className="pricing-period">월 100회 생성</p>
                <ul className="pricing-features">
                  <li>
                    <span className="check-icon check-icon-featured">✓</span>
                    프리미엄 AI (gpt-4o)
                  </li>
                  <li>
                    <span className="check-icon check-icon-featured">✓</span>
                    전체 채널 + 바이브
                  </li>
                  <li>
                    <span className="check-icon check-icon-featured">✓</span>
                    히스토리 저장
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleUpgrade("standard")}
                  disabled={!!loading}
                  className="btn btn-primary"
                  style={{ width: "100%", marginTop: "auto" }}
                >
                  {loading === "standard" ? "이동 중…" : "업그레이드"}
                </button>
              </div>

              {/* Pro Plan */}
              <div className="pricing-card">
                <h2 className="pricing-tier">Pro</h2>
                <p className="pricing-price">
                  49,000원<span className="pricing-unit">/월</span>
                </p>
                <p className="pricing-period">무제한 생성</p>
                <ul className="pricing-features">
                  <li>
                    <span className="check-icon">✓</span>
                    프리미엄 AI (gpt-4o)
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    Standard 모든 기능
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    브랜드 보이스 저장 <span style={{ fontSize: "0.7em", opacity: 0.6 }}>준비중</span>
                  </li>
                  <li>
                    <span className="check-icon">✓</span>
                    CSV 다운로드 <span style={{ fontSize: "0.7em", opacity: 0.6 }}>준비중</span>
                  </li>
                </ul>
                <button
                  type="button"
                  onClick={() => handleUpgrade("pro")}
                  disabled={!!loading}
                  className="btn btn-ghost"
                  style={{ width: "100%", marginTop: "auto" }}
                >
                  {loading === "pro" ? "이동 중…" : "업그레이드"}
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <p className="help-text">
              질문이 있으시면{" "}
              <Link href="/faq">FAQ</Link>를 확인하거나{" "}
              <Link href="/feedback">피드백</Link>을 남겨주세요.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <div className="footer-inner">
          <span>© VibeCopy</span>
          <nav>
            <Link href="/pricing">요금제</Link>
            <Link href="/guide">이용 가이드</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/feedback">피드백</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
