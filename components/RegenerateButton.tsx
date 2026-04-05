"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  createIdempotencyKey,
  generate,
  type Channel,
  type GenerateOutput,
  type Vibe,
} from "@/lib/ui/generateClient";

type RegenerateButtonProps = {
  inputType: "url" | "text";
  inputValue: string;
  channel: Channel;
  vibe: Vibe;
  onSuccess?: (output: GenerateOutput) => void;
};

// 에러 코드별 친화적인 메시지
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  INSUFFICIENT_CREDITS: {
    title: "크레딧이 부족합니다",
    description: "Standard 플랜으로 월 300회까지 프리미��� AI로 생성할 수 있어요.",
  },
  DAILY_LIMIT_EXCEEDED: {
    title: "오늘 체험 생성 5회를 모두 사용했어요",
    description: "Standard로 업그레이드하면 월 300회까지 바로 계속 사용할 수 있습니다.",
  },
  MONTHLY_LIMIT_EXCEEDED: {
    title: "이번 달 무료 10회를 모두 사용했어요",
    description: "Standard로 업그레이드하면 월 300회 + 고급 모델(gpt-4o)로 생성할 수 있습니다.",
  },
  AI_FAILED: {
    title: "일시적인 문제가 발생했습니다",
    description: "크레딧은 차감되지 않았습니다. 잠시 후 다시 시도해주세요.",
  },
  INTERNAL: {
    title: "일시적인 오류가 발생했습니다",
    description: "크레딧은 차감되지 않았습니다. 잠시 후 다시 시도해주세요.",
  },
  RATE_LIMIT_EXCEEDED: {
    title: "요청이 너무 빠릅니다",
    description: "잠시 후 다시 시도해주세요.",
  },
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.75rem",
  },
  button: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.625rem 1rem",
    borderRadius: "0.75rem",
    background: "rgba(99, 102, 241, 0.1)",
    border: "1px solid var(--indigo-500, #6366f1)",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--indigo-400, #818cf8)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  buttonHover: {
    background: "rgba(99, 102, 241, 0.2)",
  },
  buttonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  spinner: {
    width: "1rem",
    height: "1rem",
    border: "2px solid var(--border-color, rgba(255, 255, 255, 0.1))",
    borderTopColor: "var(--indigo-400, #818cf8)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorBox: {
    padding: "0.875rem 1rem",
    borderRadius: "0.75rem",
    background: "rgba(248, 113, 113, 0.1)",
    border: "1px solid rgba(248, 113, 113, 0.3)",
  },
  errorTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--red-400, #f87171)",
    margin: 0,
  },
  errorDesc: {
    marginTop: "0.25rem",
    fontSize: "0.875rem",
    color: "rgba(248, 113, 113, 0.8)",
  },
  retryBtn: {
    marginTop: "0.5rem",
    padding: 0,
    background: "none",
    border: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--red-400, #f87171)",
    textDecoration: "underline",
    cursor: "pointer",
  },
  upgradeBox: {
    padding: "1rem 1.25rem",
    borderRadius: "0.75rem",
    background: "rgba(251, 191, 36, 0.1)",
    border: "1px solid rgba(251, 191, 36, 0.3)",
  },
  upgradeContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: "0.75rem",
  },
  upgradeIcon: {
    flexShrink: 0,
    width: "2rem",
    height: "2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "50%",
    background: "rgba(251, 191, 36, 0.2)",
    color: "#fbbf24",
  },
  upgradeTextWrap: {
    flex: 1,
  },
  upgradeTitle: {
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#fbbf24",
    margin: 0,
  },
  upgradeDesc: {
    marginTop: "0.375rem",
    fontSize: "0.875rem",
    color: "rgba(251, 191, 36, 0.8)",
  },
  upgradeButtons: {
    marginTop: "0.75rem",
    display: "flex",
    alignItems: "center",
    gap: "0.75rem",
  },
  upgradePrimaryBtn: {
    display: "inline-flex",
    alignItems: "center",
    padding: "0.5rem 0.875rem",
    borderRadius: "0.5rem",
    background: "#fbbf24",
    border: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "#0f0f1a",
    textDecoration: "none",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  upgradeCloseBtn: {
    padding: 0,
    background: "none",
    border: "none",
    fontSize: "0.875rem",
    color: "rgba(251, 191, 36, 0.8)",
    textDecoration: "underline",
    cursor: "pointer",
  },
};

export function RegenerateButton({
  inputType,
  inputValue,
  channel,
  vibe,
  onSuccess,
}: RegenerateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [hovered, setHovered] = useState(false);

  const run = useCallback(async () => {
    setError(null);
    setLoading(true);
    const key = createIdempotencyKey();
    const res = await generate({
      idempotency_key: key,
      input_type: inputType,
      input_value: inputValue,
      channel,
      vibe,
    });
    setLoading(false);
    if (res.ok) {
      onSuccess?.(res.data.output);
      return;
    }
    if (res.error.code === "INSUFFICIENT_CREDITS" || res.error.code === "DAILY_LIMIT_EXCEEDED" || res.error.code === "MONTHLY_LIMIT_EXCEEDED") {
      setShowUpgrade(true);
      return;
    }
    setError(res.error);
  }, [inputType, inputValue, channel, vibe, onSuccess]);

  const getErrorInfo = (errorCode: string) => {
    return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.INTERNAL;
  };

  const canRetry = error?.code === "AI_FAILED" || error?.code === "INTERNAL" || error?.code === "RATE_LIMIT_EXCEEDED";

  return (
    <div style={styles.container}>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      <button
        type="button"
        onClick={run}
        disabled={loading}
        aria-busy={loading}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          ...styles.button,
          ...(hovered && !loading ? styles.buttonHover : {}),
          ...(loading ? styles.buttonDisabled : {}),
        }}
      >
        {loading ? (
          <>
            <div style={styles.spinner} />
            생성 중...
          </>
        ) : (
          <>
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            다시 생성하기
          </>
        )}
      </button>

      {/* Error Message */}
      {error && (
        <div role="alert" style={styles.errorBox}>
          <p style={styles.errorTitle}>
            {getErrorInfo(error.code).title}
          </p>
          <p style={styles.errorDesc}>
            {getErrorInfo(error.code).description}
          </p>
          {canRetry && (
            <button type="button" onClick={run} style={styles.retryBtn}>
              다시 시도
            </button>
          )}
        </div>
      )}

      {/* Upgrade Modal */}
      {showUpgrade && (
        <div style={styles.upgradeBox} role="alert">
          <div style={styles.upgradeContent}>
            <div style={styles.upgradeIcon}>
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div style={styles.upgradeTextWrap}>
              <p style={styles.upgradeTitle}>
                사용 가능 횟수를 모두 사용했어요
              </p>
              <p style={styles.upgradeDesc}>
                Standard 플랜으로 월 300회까지 프리미엄 AI(gpt-4o)로 생성할 수 있어요.
              </p>
              <div style={styles.upgradeButtons}>
                <Link href="/pricing" style={styles.upgradePrimaryBtn}>
                  Standard 플랜 보기
                </Link>
                <button
                  type="button"
                  onClick={() => setShowUpgrade(false)}
                  style={styles.upgradeCloseBtn}
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
