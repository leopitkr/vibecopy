"use client";

import { useCallback, useState } from "react";
import type { GenerateOutput } from "@/lib/ui/generateClient";
import { CopyPackageView } from "./CopyPackageView";
import { RegenerateButton } from "./RegenerateButton";

const CHANNEL_LABELS: Record<string, string> = {
  smartstore: "스마트스토어",
  coupang: "쿠팡",
  affiliate: "제휴",
  social: "SNS",
  shortform: "숏폼",
};
const VIBE_LABELS: Record<string, string> = {
  trust: "신뢰",
  review: "후기",
  impulse: "자극",
  premium: "프리미엄",
  groupbuy: "공구",
};

export type GenerationDetail = {
  id: string;
  created_at: string;
  channel: string;
  vibe: string;
  input_type: string;
  input_value: string;
  output: GenerateOutput;
};

type GenerationDetailModalProps = {
  generation: GenerationDetail | null;
  onClose: () => void;
  onRegenerated?: (output: GenerateOutput) => void;
};

const styles = {
  overlay: {
    position: "fixed" as const,
    inset: 0,
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(0, 0, 0, 0.7)",
    backdropFilter: "blur(4px)",
    padding: "1rem",
  },
  modal: {
    maxHeight: "90vh",
    width: "100%",
    maxWidth: "42rem",
    overflow: "hidden",
    borderRadius: "1.25rem",
    background: "var(--bg-dark, #0f0f1a)",
    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
    boxShadow: "0 25px 50px rgba(0, 0, 0, 0.5)",
  },
  header: {
    position: "sticky" as const,
    top: 0,
    zIndex: 10,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "1.25rem 1.5rem",
    background: "var(--bg-dark, #0f0f1a)",
    borderBottom: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
  },
  title: {
    fontSize: "1.125rem",
    fontWeight: 600,
    color: "white",
    margin: 0,
  },
  subtitle: {
    marginTop: "0.25rem",
    fontSize: "0.875rem",
    color: "var(--text-muted, #64748b)",
  },
  closeBtn: {
    padding: "0.5rem",
    borderRadius: "0.5rem",
    background: "transparent",
    border: "none",
    color: "var(--text-muted, #64748b)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  content: {
    maxHeight: "calc(90vh - 140px)",
    overflowY: "auto" as const,
  },
  contentInner: {
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column" as const,
    gap: "1.25rem",
  },
  badges: {
    display: "flex",
    flexWrap: "wrap" as const,
    alignItems: "center",
    gap: "0.5rem",
  },
  badgeChannel: {
    padding: "0.375rem 0.75rem",
    borderRadius: "9999px",
    background: "rgba(255, 255, 255, 0.08)",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-secondary, #94a3b8)",
  },
  badgeVibe: {
    padding: "0.375rem 0.75rem",
    borderRadius: "9999px",
    background: "rgba(99, 102, 241, 0.2)",
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--indigo-400, #818cf8)",
  },
  inputPreview: {
    padding: "1rem 1.25rem",
    borderRadius: "0.875rem",
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
  },
  inputHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
  },
  inputLabel: {
    fontSize: "0.75rem",
    fontWeight: 500,
    color: "var(--text-muted, #64748b)",
  },
  inputCopyBtn: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.25rem",
    padding: "0.375rem 0.625rem",
    borderRadius: "0.375rem",
    background: "transparent",
    border: "none",
    fontSize: "0.75rem",
    color: "var(--text-muted, #64748b)",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  inputCopyBtnCopied: {
    background: "rgba(52, 211, 153, 0.15)",
    color: "var(--emerald-400, #34d399)",
  },
  inputText: {
    fontSize: "0.875rem",
    lineHeight: 1.6,
    color: "var(--text-secondary, #94a3b8)",
    wordBreak: "break-all" as const,
  },
  inputLink: {
    color: "var(--indigo-400, #818cf8)",
    textDecoration: "underline",
  },
  expandBtn: {
    marginTop: "0.75rem",
    padding: 0,
    background: "none",
    border: "none",
    fontSize: "0.875rem",
    fontWeight: 500,
    color: "var(--indigo-400, #818cf8)",
    cursor: "pointer",
  },
  successToast: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.875rem 1rem",
    borderRadius: "0.75rem",
    background: "rgba(52, 211, 153, 0.1)",
    border: "1px solid rgba(52, 211, 153, 0.3)",
    fontSize: "0.875rem",
    color: "var(--emerald-400, #34d399)",
  },
  regenerateSection: {
    paddingTop: "1.25rem",
    borderTop: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
  },
  regenerateHint: {
    marginTop: "0.625rem",
    fontSize: "0.75rem",
    color: "var(--text-muted, #64748b)",
  },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InputPreview({
  inputType,
  inputValue,
}: {
  inputType: string;
  inputValue: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const isLong = inputValue.length > 200;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(inputValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  }, [inputValue]);

  return (
    <div style={styles.inputPreview}>
      <div style={styles.inputHeader}>
        <span style={styles.inputLabel}>
          {inputType === "url" ? "URL" : "입력한 상품 정보"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            ...styles.inputCopyBtn,
            ...(copied ? styles.inputCopyBtnCopied : {}),
          }}
        >
          {copied ? (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              복사됨
            </>
          ) : (
            <>
              <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              복사
            </>
          )}
        </button>
      </div>
      <div
        style={{
          ...styles.inputText,
          ...(!expanded && isLong
            ? {
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical" as const,
              }
            : {}),
        }}
      >
        {inputType === "url" ? (
          <a
            href={inputValue}
            target="_blank"
            rel="noopener noreferrer"
            style={styles.inputLink}
          >
            {inputValue}
          </a>
        ) : (
          <span style={{ whiteSpace: "pre-wrap" }}>{inputValue}</span>
        )}
      </div>
      {isLong && inputType !== "url" && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          style={styles.expandBtn}
        >
          {expanded ? "접기" : "전체 보기"}
        </button>
      )}
    </div>
  );
}

export function GenerationDetailModal({
  generation,
  onClose,
  onRegenerated,
}: GenerationDetailModalProps) {
  const [regenerated, setRegenerated] = useState(false);
  const [closeHover, setCloseHover] = useState(false);

  const handleRegenerated = useCallback(
    (output: GenerateOutput) => {
      setRegenerated(true);
      setTimeout(() => setRegenerated(false), 3000);
      onRegenerated?.(output);
    },
    [onRegenerated]
  );

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  if (!generation) return null;
  const d = generation;

  return (
    <div
      style={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="detail-modal-title"
      onClick={handleOverlayClick}
    >
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h2 id="detail-modal-title" style={styles.title}>
              생성 결과
            </h2>
            <p style={styles.subtitle}>{formatDate(d.created_at)}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            onMouseEnter={() => setCloseHover(true)}
            onMouseLeave={() => setCloseHover(false)}
            style={{
              ...styles.closeBtn,
              ...(closeHover
                ? { background: "rgba(255, 255, 255, 0.1)", color: "white" }
                : {}),
            }}
            aria-label="닫기"
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div style={styles.content}>
          <div style={styles.contentInner}>
            {/* Meta Info */}
            <div style={styles.badges}>
              <span style={styles.badgeChannel}>
                {CHANNEL_LABELS[d.channel] ?? d.channel}
              </span>
              <span style={styles.badgeVibe}>
                {VIBE_LABELS[d.vibe] ?? d.vibe}
              </span>
            </div>

            {/* Input Preview */}
            <InputPreview inputType={d.input_type} inputValue={d.input_value} />

            {/* Regenerate Success Toast */}
            {regenerated && (
              <div style={styles.successToast}>
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                새로운 카피가 생성되었습니다
              </div>
            )}

            {/* Output */}
            <CopyPackageView output={d.output} />

            {/* Regenerate Button */}
            <div style={styles.regenerateSection}>
              <RegenerateButton
                inputType={d.input_type as "url" | "text"}
                inputValue={d.input_value}
                channel={d.channel as "smartstore" | "coupang" | "affiliate" | "social" | "shortform"}
                vibe={d.vibe as "trust" | "review" | "impulse" | "premium" | "groupbuy"}
                onSuccess={handleRegenerated}
              />
              <p style={styles.regenerateHint}>
                같은 입력으로 새로운 카피를 생성합니다
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
