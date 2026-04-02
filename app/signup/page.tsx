"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import "../(marketing)/landing.css";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/generate";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    router.push(returnUrl);
    router.refresh();
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

      <main className="auth-section">
        <div className="auth-content">
          <div className="auth-box">
            <h1 className="auth-title">회원가입</h1>
            <p className="auth-subtitle">
              이미 계정이 있으신가요?{" "}
              <Link href={`/login${returnUrl !== "/generate" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : "?returnUrl=/generate"}`}>
                로그인
              </Link>
            </p>

            {/* Benefits banner */}
            <div className="auth-info" style={{ background: "rgba(52, 211, 153, 0.1)", borderColor: "rgba(52, 211, 153, 0.3)" }}>
              <p style={{ color: "var(--emerald-400)" }}>가입하면 받는 혜택</p>
              <ul>
                <li>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--emerald-400)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  매일 3회 무료 카피 생성
                </li>
                <li>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--emerald-400)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  생성 기록 저장 및 재사용
                </li>
                <li>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--emerald-400)" }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  프리미엄 플랜 업그레이드 가능
                </li>
              </ul>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="email">이메일</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="password">비밀번호</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
                <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  최소 6자 이상 입력해 주세요
                </p>
              </div>
              {error && (
                <div className="error-message" style={{ marginTop: 0 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "가입 중…" : "무료로 시작하기"}
              </button>
            </form>

            <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.75rem", color: "var(--text-muted)" }}>
              가입 시{" "}
              <Link href="/terms" style={{ textDecoration: "underline" }}>
                이용약관
              </Link>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function SignupPage() {
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
      <SignupForm />
    </Suspense>
  );
}
