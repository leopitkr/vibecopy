"use client";

import { useCallback, useEffect, useState } from "react";
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

export function GenerationsList() {
  const [items, setItems] = useState<GenerationSummary[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<GenerationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchList = useCallback(async (cursor?: string | null) => {
    setLoading(true);
    try {
      const url = cursor
        ? `/api/generations?limit=20&cursor=${encodeURIComponent(cursor)}`
        : "/api/generations?limit=20";
      const res = await fetch(url, { credentials: "include" });
      const data = await res.json();
      if (data?.data?.items) {
        setItems(data.data.items);
        setNextCursor(data.data.nextCursor ?? null);
      }
    } catch {
      setItems([]);
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const loadMore = useCallback(() => {
    if (!nextCursor) return;
    fetch(`/api/generations?limit=20&cursor=${encodeURIComponent(nextCursor)}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.items?.length) {
          setItems((prev) => [...prev, ...data.data.items]);
          setNextCursor(data.data.nextCursor ?? null);
        }
      });
  }, [nextCursor]);

  const openDetail = useCallback(async (id: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/generations/${id}`, { credentials: "include" });
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
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const handleRegenerated = useCallback((output: GenerateOutput) => {
    setDetail((prev) => (prev ? { ...prev, output } : null));
    fetchList();
  }, [fetchList]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500 dark:text-gray-400">
        아직 생성 기록이 없습니다. <a href="/generate" className="text-blue-600 underline">생성하기</a>
      </p>
    );
  }

  return (
    <>
      <ul className="divide-y divide-gray-200 dark:divide-gray-700">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => openDetail(item.id)}
              className="flex w-full flex-col gap-1 p-4 text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-800"
            >
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(item.created_at).toLocaleString("ko-KR")}
              </span>
              <span className="inline-flex gap-2">
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                  {CHANNEL_LABELS[item.channel] ?? item.channel}
                </span>
                <span className="rounded bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700">
                  {VIBE_LABELS[item.vibe] ?? item.vibe}
                </span>
              </span>
              <span className="truncate text-sm text-gray-700 dark:text-gray-300">
                {item.input_preview}
              </span>
            </button>
          </li>
        ))}
      </ul>
      {loadingDetail && (
        <div className="flex justify-center py-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      )}
      {nextCursor && (
        <div className="py-4 text-center">
          <button
            type="button"
            onClick={loadMore}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            더 보기
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
