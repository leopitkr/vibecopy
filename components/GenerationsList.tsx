"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { GenerationDetail } from "./GenerationDetailModal";
import { GenerationDetailModal } from "./GenerationDetailModal";
import type { GenerateOutput } from "@/lib/ui/generateClient";

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

type GenerationSummary = {
  id: string;
  created_at: string;
  channel: string;
  vibe: string;
  input_preview: string;
  has_output: boolean;
};

const styles = {
  item: {
    display: "block",
    width: "100%",
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--border-color)",
    cursor: "pointer",
    transition: "background 0.2s",
    textAlign: "left" as const,
    background: "transparent",
    border: "none",
    borderBottomStyle: "solid" as const,
    borderBottomWidth: "1px",
    borderBottomColor: "var(--border-color)",
  },
  itemHover: {
    background: "rgba(255, 255, 255, 0.03)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "0.75rem",
    marginBottom: "0.5rem",
  },
  date: {
    fontSize: "0.8125rem",
    color: "var(--text-muted)",
  },
  badges: {
    display: "flex",
    gap: "0.375rem",
  },
  badgeChannel: {
    padding: "0.1875rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    background: "rgba(255, 255, 255, 0.08)",
    color: "var(--text-secondary)",
  },
  badgeVibe: {
    padding: "0.1875rem 0.5rem",
    borderRadius: "0.375rem",
    fontSize: "0.75rem",
    fontWeight: 500,
    background: "rgba(99, 102, 241, 0.2)",
    color: "var(--indigo-400)",
  },
  preview: {
    fontSize: "0.9375rem",
    color: "var(--text-secondary)",
    lineHeight: 1.6,
    overflow: "hidden",
    display: "-webkit-box",
    WebkitLineClamp: 2,
    WebkitBoxOrient: "vertical" as const,
  },
  skeleton: {
    padding: "1.25rem 1.5rem",
    borderBottom: "1px solid var(--border-color)",
  },
  skeletonLine: {
    background: "linear-gradient(90deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.1) 50%, rgba(255, 255, 255, 0.05) 100%)",
    backgroundSize: "200% 100%",
    animation: "shimmer 1.5s infinite",
    borderRadius: "0.375rem",
  },
  emptyState: {
    padding: "3rem 1.5rem",
    textAlign: "center" as const,
  },
  emptyIcon: {
    width: "4rem",
    height: "4rem",
    margin: "0 auto 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(255, 255, 255, 0.05)",
    borderRadius: "1rem",
    color: "var(--text-muted)",
  },
  emptyTitle: {
    fontSize: "1rem",
    fontWeight: 600,
    color: "white",
    marginBottom: "0.375rem",
  },
  emptyDesc: {
    fontSize: "0.875rem",
    color: "var(--text-muted)",
    marginBottom: "1.5rem",
  },
  errorState: {
    padding: "3rem 1.5rem",
    textAlign: "center" as const,
  },
  errorIcon: {
    width: "4rem",
    height: "4rem",
    margin: "0 auto 1rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(248, 113, 113, 0.1)",
    borderRadius: "1rem",
    color: "var(--red-400)",
  },
  loadMore: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid var(--border-color)",
    textAlign: "center" as const,
  },
  loadingDetail: {
    padding: "1rem 1.5rem",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.625rem",
    fontSize: "0.875rem",
    color: "var(--text-muted)",
  },
  spinner: {
    width: "1.25rem",
    height: "1.25rem",
    border: "2px solid var(--border-color)",
    borderTopColor: "var(--indigo-500)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.25rem",
    background: "linear-gradient(135deg, var(--indigo-500), #4f46e5)",
    color: "white",
    border: "none",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    textDecoration: "none",
    transition: "transform 0.2s, box-shadow 0.2s",
  },
  btnGhost: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.5rem",
    padding: "0.75rem 1.25rem",
    background: "rgba(255, 255, 255, 0.05)",
    border: "1px solid var(--border-color)",
    color: "white",
    borderRadius: "0.75rem",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    transition: "background 0.2s",
  },
};

function SkeletonItem() {
  return (
    <div style={styles.skeleton}>
      <div style={{ ...styles.skeletonLine, width: "5rem", height: "1rem", marginBottom: "0.75rem" }} />
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <div style={{ ...styles.skeletonLine, width: "4rem", height: "1.25rem" }} />
        <div style={{ ...styles.skeletonLine, width: "3rem", height: "1.25rem" }} />
      </div>
      <div style={{ ...styles.skeletonLine, width: "100%", height: "1rem" }} />
    </div>
  );
}

function EmptyState() {
  return (
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        <svg
          width="32"
          height="32"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>
      <h3 style={styles.emptyTitle}>아직 생성한 카피가 없습니다</h3>
      <p style={styles.emptyDesc}>상품 설명을 붙여넣고 첫 카피를 만들어보세요</p>
      <Link href="/generate" style={styles.btnPrimary}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        카피 생성하러 가기
      </Link>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div style={styles.errorState}>
      <div style={styles.errorIcon}>
        <svg
          width="32"
          height="32"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h3 style={styles.emptyTitle}>기록을 불러오지 못했습니다</h3>
      <p style={styles.emptyDesc}>일시적인 문제가 발생했습니다</p>
      <button type="button" onClick={onRetry} style={styles.btnGhost}>
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        다시 시도
      </button>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function GenerationsList() {
  const [items, setItems] = useState<GenerationSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(false);
  const [detail, setDetail] = useState<GenerationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const fetchList = useCallback(async (cursor?: string | null) => {
    setLoading(true);
    setError(false);
    try {
      const url = cursor
        ? `/api/generations?limit=20&cursor=${encodeURIComponent(cursor)}`
        : "/api/generations?limit=20";
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data?.data?.items) {
        setItems(data.data.items);
        setNextCursor(data.data.nextCursor ?? null);
      }
    } catch {
      setItems([]);
      setNextCursor(null);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/generations?limit=20&cursor=${encodeURIComponent(nextCursor)}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data?.data?.items?.length) {
        setItems((prev) => [...prev, ...data.data.items]);
        setNextCursor(data.data.nextCursor ?? null);
      }
    } catch {
      // 에러 시 무시 (기존 목록 유지)
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore]);

  const openDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/generations/${id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      if (data?.ok && data?.data) {
        const d = data.data;
        setDetail({
          id: d.id,
          created_at: d.created_at,
          channel: d.channel,
          vibe: d.vibe,
          input_type: d.input_type,
          input_value: d.input_value,
          output: d.output as GenerateOutput,
        });
      }
    } catch {
      // 상세 조회 실패 시 무시
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleRegenerated = useCallback(
    (output: GenerateOutput) => {
      setDetail((prev) => (prev ? { ...prev, output } : null));
      fetchList();
    },
    [fetchList]
  );

  // 로딩 중
  if (loading) {
    return (
      <div>
        {[1, 2, 3].map((i) => (
          <SkeletonItem key={i} />
        ))}
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return <ErrorState onRetry={() => fetchList()} />;
  }

  // 빈 상태
  if (items.length === 0) {
    return <EmptyState />;
  }

  return (
    <>
      <div>
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => openDetail(item.id)}
            onMouseEnter={() => setHoveredId(item.id)}
            onMouseLeave={() => setHoveredId(null)}
            style={{
              ...styles.item,
              ...(hoveredId === item.id ? styles.itemHover : {}),
              ...(index === items.length - 1 ? { borderBottom: "none" } : {}),
            }}
          >
            <div style={styles.header}>
              <span style={styles.date}>{formatDate(item.created_at)}</span>
              <div style={styles.badges}>
                <span style={styles.badgeChannel}>
                  {CHANNEL_LABELS[item.channel] ?? item.channel}
                </span>
                <span style={styles.badgeVibe}>
                  {VIBE_LABELS[item.vibe] ?? item.vibe}
                </span>
              </div>
            </div>
            <p style={styles.preview}>{item.input_preview}</p>
          </button>
        ))}
      </div>

      {/* 상세 로딩 오버레이 */}
      {loadingDetail && (
        <div style={styles.loadingDetail}>
          <div style={styles.spinner} />
          결과를 불러오는 중...
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      {/* 더 보기 버튼 */}
      {nextCursor && (
        <div style={styles.loadMore}>
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            style={{
              ...styles.btnGhost,
              ...(loadingMore ? { opacity: 0.5, cursor: "not-allowed" } : {}),
            }}
          >
            {loadingMore ? (
              <>
                <div style={{ ...styles.spinner, width: "1rem", height: "1rem" }} />
                불러오는 중...
                <style>{`
                  @keyframes spin {
                    to { transform: rotate(360deg); }
                  }
                `}</style>
              </>
            ) : (
              "더 보기"
            )}
          </button>
        </div>
      )}

      <GenerationDetailModal
        generation={detail}
        onClose={() => setDetail(null)}
        onRegenerated={handleRegenerated}
      />
    </>
  );
}
