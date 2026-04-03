"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import "@/app/(marketing)/landing.css";

function WelcomeContent() {
  const searchParams = useSearchParams();
  const nickname = searchParams.get("nickname") || "회원";
  const returnUrl = searchParams.get("returnUrl") || "/generate";

  return (
    <div className="landing-page">
      <div className="landing-gradient" />

      <main
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          position: "relative",
          zIndex: 1,
        }}
      >
        <Link href="/" className="logo" style={{ fontSize: "2rem", marginBottom: "2.5rem" }}>
          VibeCopy
        </Link>

        {/* Step Indicator - completed */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            marginBottom: "2.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--emerald-400)",
                color: "white",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>
              프로필 설정
            </span>
          </div>
          <div
            style={{
              width: 48,
              height: 2,
              margin: "0 0.75rem",
              background: "var(--emerald-400)",
              borderRadius: 1,
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--emerald-400)",
                color: "white",
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>
              완료
            </span>
          </div>
        </div>

        {/* Welcome Card */}
        <div className="auth-box" style={{ maxWidth: 500 }}>
          {/* Check Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "rgba(52,211,153,0.1)",
              border: "2px solid rgba(52,211,153,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
            }}
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--emerald-400)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1
            className="auth-title"
            style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}
          >
            환영합니다, {nickname}님!
          </h1>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: "0.95rem",
              textAlign: "center",
              marginBottom: "2.5rem",
            }}
          >
            회원가입이 완료되었습니다. 지금부터 VibeCopy를 시작해보세요.
          </p>

          {/* Benefit Cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem", marginBottom: "2.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.25rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(99,102,241,0.12)",
                  border: "1px solid rgba(99,102,241,0.2)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--indigo-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>7일 프리미엄 체험</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  GPT-4o 모델로 최고 품질의 카피를 체험하세요
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.25rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(34,211,238,0.12)",
                  border: "1px solid rgba(34,211,238,0.2)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20V10" />
                  <path d="M18 20V4" />
                  <path d="M6 20v-4" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>매일 3회 무료 생성</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  트라이얼 기간 동안 매일 3번 무료로 생성할 수 있어요
                </p>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                padding: "1rem 1.25rem",
                background: "var(--bg-card)",
                border: "1px solid var(--border-color)",
                borderRadius: 12,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  minWidth: 44,
                  borderRadius: 10,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(52,211,153,0.12)",
                  border: "1px solid rgba(52,211,153,0.2)",
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--emerald-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
              </div>
              <div>
                <p style={{ fontSize: "0.95rem", fontWeight: 600 }}>생성 기록 저장</p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
                  생성한 카피를 자동 저장하고 언제든 재사용하세요
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href={returnUrl}
            className="btn btn-primary"
            style={{
              display: "block",
              textAlign: "center",
              width: "100%",
              padding: "0.9375rem",
              marginBottom: "1rem",
            }}
          >
            카피 생성하러 가기
          </Link>
          <div style={{ textAlign: "center" }}>
            <Link
              href="/me"
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                textDecoration: "none",
              }}
            >
              내 프로필 보기
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function WelcomePage() {
  return (
    <Suspense
      fallback={
        <div className="landing-page">
          <div className="landing-gradient" />
          <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "8rem", height: "2rem", background: "rgba(255,255,255,0.1)", borderRadius: "0.5rem" }} />
          </div>
        </div>
      }
    >
      <WelcomeContent />
    </Suspense>
  );
}
