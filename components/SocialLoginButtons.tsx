"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type SocialLoginButtonsProps = {
  returnUrl?: string;
  disabled?: boolean;
  onBeforeOAuth?: () => void;
};

export function SocialLoginButtons({
  returnUrl = "/generate",
  disabled = false,
  onBeforeOAuth,
}: SocialLoginButtonsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(provider: "kakao" | "google") {
    if (disabled) return;
    setError(null);
    setLoading(provider);
    onBeforeOAuth?.();
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?returnUrl=${encodeURIComponent(returnUrl)}`,
        },
      });
      if (err) {
        setError(err.message);
        setLoading(null);
      }
    } catch {
      setError("소셜 로그인 중 오류가 발생했습니다.");
      setLoading(null);
    }
  }

  return (
    <div className="social-login-section">
      <button
        type="button"
        onClick={() => handleOAuth("kakao")}
        disabled={disabled || !!loading}
        className="social-login-btn social-login-kakao"
        style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <path
            d="M9 1C4.58 1 1 3.79 1 7.21c0 2.17 1.45 4.08 3.64 5.18l-.93 3.44c-.08.3.26.54.52.37l4.12-2.74c.21.02.43.03.65.03 4.42 0 8-2.79 8-6.28C17 3.79 13.42 1 9 1z"
            fill="#3C1E1E"
          />
        </svg>
        {loading === "kakao" ? "연결 중…" : "카카오로 계속하기"}
      </button>

      <button
        type="button"
        onClick={() => handleOAuth("google")}
        disabled={disabled || !!loading}
        className="social-login-btn social-login-google"
        style={disabled ? { opacity: 0.4, cursor: "not-allowed" } : undefined}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.49h4.84a4.14 4.14 0 01-1.8 2.71v2.26h2.92a8.78 8.78 0 002.68-6.62z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.83.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 009 18z" fill="#34A853"/>
          <path d="M3.96 10.71A5.41 5.41 0 013.68 9c0-.6.1-1.17.28-1.71V4.96H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.04l3-2.33z" fill="#FBBC05"/>
          <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A9 9 0 00.96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {loading === "google" ? "연결 중…" : "Google로 계속하기"}
      </button>

      {error && (
        <p className="social-login-error">{error}</p>
      )}
    </div>
  );
}
