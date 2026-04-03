"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import "@/app/(marketing)/landing.css";

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/generate";

  const [nickname, setNickname] = useState("");
  const [termsAll, setTermsAll] = useState(false);
  const [termsService, setTermsService] = useState(false);
  const [termsPrivacy, setTermsPrivacy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nicknameStatus, setNicknameStatus] = useState<"idle" | "valid" | "error">("idle");
  const [nicknameMessage, setNicknameMessage] = useState("한글, 영문, 숫자, 밑줄(_) 사용 가능 · 2~20자");
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.email) setUserEmail(data.data.email);
        // Already onboarded? Redirect.
        if (data?.data?.onboarding_completed) {
          router.replace(returnUrl);
        }
      })
      .catch(() => {});
  }, [router, returnUrl]);

  function validateNickname(value: string) {
    setNickname(value);
    if (value.length === 0) {
      setNicknameStatus("idle");
      setNicknameMessage("한글, 영문, 숫자, 밑줄(_) 사용 가능 · 2~20자");
      return;
    }
    const pattern = /^[a-zA-Z0-9가-힣_]+$/;
    if (!pattern.test(value)) {
      setNicknameStatus("error");
      setNicknameMessage("한글, 영문, 숫자, 밑줄(_)만 사용할 수 있습니다");
      return;
    }
    if (value.length < 2) {
      setNicknameStatus("error");
      setNicknameMessage("2자 이상 입력해주세요");
      return;
    }
    setNicknameStatus("valid");
    setNicknameMessage("사용 가능한 닉네임입니다");
  }

  function handleAllCheck(checked: boolean) {
    setTermsAll(checked);
    setTermsService(checked);
    setTermsPrivacy(checked);
  }

  function handleItemCheck(service: boolean, privacy: boolean) {
    setTermsService(service);
    setTermsPrivacy(privacy);
    setTermsAll(service && privacy);
  }

  const canSubmit = nicknameStatus === "valid" && termsService && termsPrivacy && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message || "오류가 발생했습니다");
        setLoading(false);
        return;
      }
      router.push(`/welcome?nickname=${encodeURIComponent(nickname.trim())}&returnUrl=${encodeURIComponent(returnUrl)}`);
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  async function handleSkip() {
    setLoading(true);
    try {
      // Generate a default nickname from email
      const defaultNick = userEmail
        ? userEmail.split("@")[0].replace(/[^a-zA-Z0-9가-힣_]/g, "_").slice(0, 20)
        : `user_${Date.now().toString(36)}`;

      await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ nickname: defaultNick }),
      });
      router.push(returnUrl);
    } catch {
      setLoading(false);
    }
  }

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

        {/* Step Indicator */}
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
                fontSize: "0.85rem",
                fontWeight: 600,
                background: "linear-gradient(135deg, var(--indigo-500), var(--indigo-600))",
                color: "white",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              1
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-primary)" }}>
              프로필 설정
            </span>
          </div>
          <div
            style={{
              width: 48,
              height: 2,
              margin: "0 0.75rem",
              background: "var(--border-color)",
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
                fontSize: "0.85rem",
                fontWeight: 600,
                background: "rgba(255,255,255,0.06)",
                color: "var(--text-muted)",
                border: "1px solid var(--border-color)",
              }}
            >
              2
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--text-muted)" }}>
              완료
            </span>
          </div>
        </div>

        {/* Card */}
        <div className="auth-box" style={{ maxWidth: 460 }}>
          <h1 className="auth-title">프로필을 설정해주세요</h1>
          <p className="auth-subtitle" style={{ marginBottom: "2rem" }}>
            VibeCopy에서 사용할 닉네임을 입력해주세요
          </p>

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Nickname */}
            <div className="form-group">
              <label htmlFor="nickname">닉네임</label>
              <input
                id="nickname"
                type="text"
                value={nickname}
                onChange={(e) => validateNickname(e.target.value)}
                maxLength={20}
                autoComplete="off"
                placeholder="예: 카피마스터, copyking_01"
                style={
                  nicknameStatus === "error"
                    ? { borderColor: "var(--red-400)", boxShadow: "0 0 0 3px rgba(248,113,113,0.1)" }
                    : nicknameStatus === "valid"
                      ? { borderColor: "var(--emerald-400)", boxShadow: "0 0 0 3px rgba(52,211,153,0.1)" }
                      : {}
                }
              />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                <span
                  style={{
                    fontSize: "0.8rem",
                    color:
                      nicknameStatus === "error"
                        ? "var(--red-400)"
                        : nicknameStatus === "valid"
                          ? "var(--emerald-400)"
                          : "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                  }}
                >
                  {nicknameStatus === "valid" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                      <polyline points="22 4 12 14.01 9 11.01" />
                    </svg>
                  )}
                  {nicknameStatus === "error" && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                  {nicknameMessage}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  {nickname.length}/20
                </span>
              </div>
            </div>

            {/* Terms */}
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
                <label
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                >
                  <input
                    type="checkbox"
                    checked={termsService}
                    onChange={(e) => handleItemCheck(e.target.checked, termsPrivacy)}
                    style={{ width: 18, height: 18, accentColor: "var(--indigo-500)" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    <Link href="/terms" style={{ color: "var(--indigo-400)", textDecoration: "underline" }}>
                      이용약관
                    </Link>{" "}
                    동의 (필수)
                  </span>
                </label>
                <label
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }}
                >
                  <input
                    type="checkbox"
                    checked={termsPrivacy}
                    onChange={(e) => handleItemCheck(termsService, e.target.checked)}
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

            {error && (
              <div className="error-message" style={{ marginTop: 0, marginBottom: "1rem" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={!canSubmit} className="btn btn-primary">
              {loading ? "저장 중…" : "시작하기"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleSkip}
            disabled={loading}
            style={{
              display: "block",
              width: "100%",
              textAlign: "center",
              marginTop: "1.5rem",
              color: "var(--text-muted)",
              fontSize: "0.85rem",
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            나중에 설정하기
          </button>
        </div>
      </main>
    </div>
  );
}

export default function OnboardingPage() {
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
      <OnboardingForm />
    </Suspense>
  );
}
