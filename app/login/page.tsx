"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import "../(marketing)/landing.css";

function LoginForm() {
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
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
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
            <h1 className="auth-title">로그인</h1>
            <p className="auth-subtitle">
              계정이 없으신가요?{" "}
              <Link href={`/signup${returnUrl !== "/generate" ? `?returnUrl=${encodeURIComponent(returnUrl)}` : "?returnUrl=/generate"}`}>
                회원가입
              </Link>
            </p>

            {/* Value proposition banner */}
            <div className="auth-info">
              <p>로그인하면 이용 가능한 기능</p>
              <ul>
                <li>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  매일 무료 카피 생성
                </li>
                <li>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  생성 기록 저장 및 재사용
                </li>
                <li>
                  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  프리미엄 플랜 업그레이드
                </li>
              </ul>
            </div>

            <SocialLoginButtons returnUrl={returnUrl} mode="login" />
            <div className="auth-divider">또는</div>

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
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <div className="error-message" style={{ marginTop: 0 }}>
                  {error}
                </div>
              )}
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "로그인 중…" : "로그인"}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
