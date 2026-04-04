"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import Link from "next/link";
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { AuthHeader } from "@/components/AuthHeader";
import "../(marketing)/landing.css";

function LoginContent() {
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/generate";
  const error = searchParams.get("error");
  const isSignIn = searchParams.get("mode") === "signin";

  const [termsService, setTermsService] = useState(false);
  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const termsAgreed = termsService && termsPrivacy;
  const termsAll = termsService && termsPrivacy;

  function handleAllCheck(checked: boolean) {
    setTermsService(checked);
    setTermsPrivacy(checked);
  }

  function handleOAuthReady() {
    if (isSignIn) return;
    // Store terms consent timestamp before OAuth redirect
    if (termsAgreed) {
      localStorage.setItem("vibecopy_terms_agreed", new Date().toISOString());
    }
  }

  // Build mode toggle link preserving returnUrl
  const toggleParams = new URLSearchParams();
  if (!isSignIn) toggleParams.set("mode", "signin");
  if (returnUrl !== "/generate") toggleParams.set("returnUrl", returnUrl);
  const toggleHref = `/login${toggleParams.toString() ? `?${toggleParams.toString()}` : ""}`;

  return (
    <div className="landing-page">
      <div className="landing-gradient" />

      <AuthHeader />

      <main className="auth-section">
        <div className="auth-content">
          <div className="auth-box">
            <h1 className="auth-title">{isSignIn ? "로그인" : "무료체험 시작"}</h1>
            <p className="auth-subtitle">
              {isSignIn
                ? "소셜 계정으로 로그인하세요"
                : "소셜 계정으로 간편하게 시작하세요"}
            </p>

            {error && (
              <div className="error-message" style={{ marginBottom: "1.5rem" }}>
                로그인 중 오류가 발생했습니다. 다시 시도해주세요.
              </div>
            )}

            {!isSignIn && (
              <div className="auth-info" style={{ background: "rgba(52, 211, 153, 0.1)", borderColor: "rgba(52, 211, 153, 0.3)" }}>
                <p style={{ color: "var(--emerald-400)" }}>가입하면 받는 혜택</p>
                <ul>
                  <li>
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "var(--emerald-400)" }}>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    가입 후 7일간 프리미엄 AI 체험
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
            )}

            {/* Terms agreement — only for signup mode */}
            {!isSignIn && (
              <div style={{ marginBottom: "1.5rem" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    marginBottom: "0.75rem",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={termsAll}
                    onChange={(e) => handleAllCheck(e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: "var(--indigo-500)" }}
                  />
                  <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>전체 동의</span>
                </label>
                <div
                  style={{
                    borderTop: "1px solid var(--border-color)",
                    paddingTop: "0.75rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={termsService}
                      onChange={(e) => { setTermsService(e.target.checked); }}
                      style={{ width: 18, height: 18, accentColor: "var(--indigo-500)" }}
                    />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <Link href="/terms" style={{ color: "var(--indigo-400)", textDecoration: "underline" }}>
                        이용약관
                      </Link>{" "}
                      동의 (필수)
                    </span>
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={termsPrivacy}
                      onChange={(e) => { setTermsPrivacy(e.target.checked); }}
                      style={{ width: 18, height: 18, accentColor: "var(--indigo-500)" }}
                    />
                    <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                      <Link href="/privacy" style={{ color: "var(--indigo-400)", textDecoration: "underline" }}>
                        개인정보처리방침
                      </Link>{" "}
                      동의 (필수)
                    </span>
                  </label>
                </div>
              </div>
            )}

            <SocialLoginButtons
              returnUrl={returnUrl}
              disabled={!isSignIn && !termsAgreed}
              onBeforeOAuth={handleOAuthReady}
              mode={isSignIn ? "signin" : "signup"}
            />

            {!isSignIn && !termsAgreed && (
              <p style={{ marginTop: "1rem", textAlign: "center", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                약관에 동의하면 소셜 로그인이 활성화됩니다
              </p>
            )}

            {/* Mode toggle link */}
            <p style={{ marginTop: "1.5rem", textAlign: "center", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
              {isSignIn ? (
                <>
                  아직 계정이 없나요?{" "}
                  <Link href={toggleHref} style={{ color: "var(--indigo-400)", textDecoration: "underline", fontWeight: 600 }}>
                    무료체험 시작
                  </Link>
                </>
              ) : (
                <>
                  이미 계정이 있나요?{" "}
                  <Link href={toggleHref} style={{ color: "var(--indigo-400)", textDecoration: "underline", fontWeight: 600 }}>
                    로그인
                  </Link>
                </>
              )}
            </p>
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
      <LoginContent />
    </Suspense>
  );
}
