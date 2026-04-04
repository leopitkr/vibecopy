"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  createIdempotencyKey,
  generate,
  type Channel,
  type GenerateOutput,
  type Vibe,
} from "@/lib/ui/generateClient";
import { CreditBadge, type PlanInfo } from "./CreditBadge";
import { ChannelPicker } from "./ChannelPicker";
import { VibePresetPicker } from "./VibePresetPicker";
import { CopyPackageView } from "./CopyPackageView";
import { ToastContainer, useToast } from "./Toast";
import { AuthHeader } from "./AuthHeader";
import type { PlanType } from "@/lib/constants/limits";
import "@/app/(marketing)/landing.css";

type SourceType = "text" | "url";

const INPUT_VALUE_MAX_LENGTH = 2000;

// Example products for "Try with example" feature
const EXAMPLE_PRODUCTS = [
  {
    name: "콜라겐 영양제",
    text: `저분자 피쉬 콜라겐 1000mg 함유
비타민C 500mg + 히알루론산 100mg 복합 배합
덴마크산 어류 콜라겐 펩타이드 사용
하루 1포로 간편하게 섭취
무향, 무미로 어디서든 간편하게
GMP 인증 시설에서 생산
피부 탄력 및 수분 유지에 도움
30포/1박스 (1개월분)`,
  },
  {
    name: "프리미엄 올리브 오일",
    text: `이탈리아 시칠리아산 100% 엑스트라 버진 올리브 오일
냉압착(Cold Pressed) 방식으로 영양 그대로
산도 0.3% 이하 최상급 품질
풍부한 폴리페놀과 올레산 함유
열매 수확 후 24시간 이내 착유
500ml 다크 글라스 병 (빛 차단)
샐러드, 파스타, 마리네이드에 최적
2025년 햇올리브 첫 수확분`,
  },
  {
    name: "무선 청소기",
    text: `25,000Pa 강력 흡입력 모터
60분 연속 사용 가능 (표준 모드)
본체 무게 1.5kg 초경량 설계
LED 헤드라이트로 먼지 확인
원터치 먼지통 비움 시스템
HEPA H13 필터 (미세먼지 99.97% 제거)
벽걸이 충전 거치대 포함
침구/틈새/미니 브러시 3종 포함`,
  },
];

// 에러 코드별 친화적인 메시지
const ERROR_MESSAGES: Record<string, { title: string; description: string }> = {
  BAD_REQUEST: {
    title: "입력 내용을 확인해주세요",
    description: "상품 정보를 다시 한번 확인해주세요.",
  },
  INPUT_TOO_LONG: {
    title: "입력이 너무 깁니다",
    description: "2000자 이내로 입력해주세요.",
  },
  UNAUTHORIZED: {
    title: "로그인이 필요합니다",
    description: "로그인 후 다시 시도해주세요.",
  },
  INSUFFICIENT_CREDITS: {
    title: "크레딧이 부족합니다",
    description: "플랜을 업그레이드하면 더 많이 생성할 수 있습니다.",
  },
  IDEMPOTENCY_CONFLICT: {
    title: "이미 처리된 요청입니다",
    description: "잠시 후 다시 시도해주세요.",
  },
  DAILY_LIMIT_EXCEEDED: {
    title: "오늘 사용량을 모두 사용했습니다",
    description: "내일 다시 시도하거나 플랜을 업그레이드해주세요.",
  },
  RATE_LIMIT_EXCEEDED: {
    title: "요청이 너무 빠릅니다",
    description: "잠시 후 다시 시도해주세요.",
  },
  AI_FAILED: {
    title: "일시적인 문제가 발생했습니다",
    description: "잠시 후 다시 시도해주세요. 문제가 계속되면 입력 내용을 줄여보세요.",
  },
  INTERNAL: {
    title: "일시적인 오류가 발생했습니다",
    description: "잠시 후 다시 시도해주세요.",
  },
};

// 로딩 단계 메시지
const LOADING_STAGES = [
  { message: "상품 정보를 분석하고 있어요", duration: 2000 },
  { message: "핵심 키워드를 추출하고 있어요", duration: 3000 },
  { message: "판매용 카피를 작성하고 있어요", duration: 4000 },
  { message: "마무리하고 있어요", duration: 10000 },
];

export function GeneratePageClient() {
  const router = useRouter();
  const { toasts, removeToast, showSuccess } = useToast();
  const [creditsLeft, setCreditsLeft] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userNickname, setUserNickname] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<PlanType | null>(null);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [meLoading, setMeLoading] = useState(true);
  const [upgradeToast, setUpgradeToast] = useState(false);
  const [sourceType, setSourceType] = useState<SourceType>("text");
  const [textValue, setTextValue] = useState("");
  const [urlValue, setUrlValue] = useState("");
  const [channel, setChannel] = useState<Channel>("smartstore");
  const [vibe, setVibe] = useState<Vibe>("trust");
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState(0);
  const [result, setResult] = useState<GenerateOutput | null>(null);
  const [creditsAfter, setCreditsAfter] = useState<number | null>(null);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [lastIdempotencyKey, setLastIdempotencyKey] = useState<string | null>(null);

  // Determine if user is logged in
  const isLoggedIn = !meLoading && creditsLeft !== null;

  // 로딩 단계 진행
  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }

    let totalTime = 0;
    const timers: NodeJS.Timeout[] = [];

    LOADING_STAGES.forEach((stage, index) => {
      totalTime += stage.duration;
      const timer = setTimeout(() => {
        if (index < LOADING_STAGES.length - 1) {
          setLoadingStage(index + 1);
        }
      }, totalTime);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [loading]);

  const fetchMe = useCallback(async () => {
    setMeLoading(true);
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json();
      if (data?.data?.credit_balance !== undefined) {
        setCreditsLeft(data.data.credit_balance);
        setUserEmail(data.data.email ?? null);
        setUserNickname(data.data.nickname ?? null);
        setUserPlan((data.data.plan as PlanType) ?? "free");
        setPlanInfo(data.data.plan_info ?? null);
      } else {
        setCreditsLeft(null);
        setUserEmail(null);
        setUserNickname(null);
        setUserPlan(null);
        setPlanInfo(null);
      }
    } catch {
      setCreditsLeft(null);
      setUserEmail(null);
      setUserNickname(null);
      setUserPlan(null);
      setPlanInfo(null);
    } finally {
      setMeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Handle upgrade success toast
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("upgraded") === "1") {
      setUpgradeToast(true);
      // Remove the query parameter from URL
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      router.replace(url.pathname, { scroll: false });
      // Auto-hide toast after 5 seconds
      const timer = setTimeout(() => setUpgradeToast(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [router]);

  const getInputValue = useCallback((): string => {
    return sourceType === "url" ? urlValue.trim() : textValue.trim();
  }, [sourceType, urlValue, textValue]);

  const inputLength = getInputValue().length;
  const inputTooLong = inputLength > INPUT_VALUE_MAX_LENGTH;
  const inputValid = inputLength > 0 && !inputTooLong;

  const handleSubmit = useCallback(
    async (idempotencyKey: string) => {
      // Redirect to login if not authenticated
      if (!isLoggedIn) {
        router.push("/login?returnUrl=/generate");
        return;
      }

      const inputValue = getInputValue();
      if (!inputValue) {
        setError({ code: "BAD_REQUEST", message: "입력 내용을 입력해 주세요." });
        return;
      }
      if (inputValue.length > INPUT_VALUE_MAX_LENGTH) {
        setError({
          code: "INPUT_TOO_LONG",
          message: "입력 길이가 너무 깁니다. 2000자 이내로 입력해 주세요.",
        });
        return;
      }

      setError(null);
      setLoading(true);
      setLoadingStage(0);
      const res = await generate({
        idempotency_key: idempotencyKey,
        input_type: sourceType === "url" ? "url" : "text",
        input_value: inputValue,
        channel,
        vibe,
      });
      setLoading(false);
      if (res.ok) {
        setResult(res.data.output);
        setCreditsAfter(res.data.credits.after);
        setCreditsLeft(res.data.credits.after);
        showSuccess("카피가 성공적으로 생성되었습니다");
        return;
      }
      const err = res.error;
      if (err.code === "UNAUTHORIZED") {
        router.push("/login?returnUrl=/generate");
        return;
      }
      if (err.code === "INSUFFICIENT_CREDITS" || err.code === "DAILY_LIMIT_EXCEEDED") {
        setError(err);
        setUpgradeModal(true);
        return;
      }
      if (err.code === "IDEMPOTENCY_CONFLICT") {
        setError(err);
        return;
      }
      setError(err);
    },
    [getInputValue, sourceType, channel, vibe, isLoggedIn, showSuccess, router]
  );

  const onSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const key = createIdempotencyKey();
      setLastIdempotencyKey(key);
      handleSubmit(key);
    },
    [handleSubmit]
  );

  const onRetry = useCallback(() => {
    const key = createIdempotencyKey();
    setLastIdempotencyKey(key);
    setError(null);
    handleSubmit(key);
  }, [handleSubmit]);

  const handleTryExample = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * EXAMPLE_PRODUCTS.length);
    const example = EXAMPLE_PRODUCTS[randomIndex];
    setSourceType("text");
    setTextValue(example.text);
  }, []);

  const canSubmit =
    !meLoading &&
    !loading &&
    inputValid &&
    (creditsLeft === null || creditsLeft > 0);

  const submitDisabledReason = !canSubmit
    ? meLoading
      ? "정보를 불러오는 중..."
      : !inputValid
        ? inputTooLong
          ? "입력이 2000자를 초과하면 생성할 수 없습니다."
          : "상품 정보를 입력해주세요."
        : creditsLeft !== null && creditsLeft <= 0
          ? "오늘 사용 가능한 횟수를 모두 사용했습니다."
          : "준비 중..."
    : null;

  // 에러 메시지 포맷팅
  const getErrorInfo = (errorCode: string) => {
    return ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.INTERNAL;
  };

  return (
    <div className="landing-page">
      {/* Background Gradient */}
      <div className="landing-gradient" />

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {/* Header */}
      <AuthHeader />

      {/* Upgrade Toast */}
      {upgradeToast && (
        <div
          className="fixed left-1/2 top-20 z-50 -translate-x-1/2 transform rounded-lg bg-[var(--emerald-400)] px-6 py-3 text-[var(--bg-dark)] shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold">업그레이드 완료! 이제 더 많은 카피를 만들어보세요.</span>
            <button
              type="button"
              onClick={() => setUpgradeToast(false)}
              className="ml-2 opacity-70 hover:opacity-100"
              aria-label="닫기"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Upgrade Modal (for logged-in users) */}
      {upgradeModal && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-modal-title"
        >
          <div className="generate-modal">
            {userPlan === "free" || error?.code === "DAILY_LIMIT_EXCEEDED" ? (
              <>
                <h2 id="upgrade-modal-title">
                  오늘 무료 생성을 모두 사용했어요
                </h2>
                <p>
                  내일 다시 3회 무료로 사용하거나,
                  <br />
                  업그레이드하면 더 많이 생성할 수 있어요.
                </p>
                <div className="generate-modal-buttons">
                  <Link href="/pricing" className="btn btn-primary">
                    플랜 업그레이드
                  </Link>
                  <button
                    type="button"
                    onClick={() => setUpgradeModal(false)}
                    className="btn btn-ghost"
                  >
                    내일 다시 올게요
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="upgrade-modal-title">
                  이번 달 크레딧을 모두 사용했어요
                </h2>
                <p>다음 결제일에 크레딧이 충전됩니다.</p>
                <div className="generate-modal-buttons">
                  <Link href="/pricing" className="btn btn-primary">
                    플랜 변경
                  </Link>
                  <button
                    type="button"
                    onClick={() => setUpgradeModal(false)}
                    className="btn btn-ghost"
                  >
                    닫기
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {loading && (
        <div
          className="fixed inset-0 z-30 flex items-center justify-center bg-[var(--bg-dark)]/95"
          aria-busy="true"
        >
          <div className="generate-loading-card">
            <div className="generate-loading-spinner" />
            <p className="generate-loading-title">카피 생성 중입니다</p>
            <p className="generate-loading-message">
              {LOADING_STAGES[loadingStage]?.message ?? "처리 중입니다..."}
            </p>
            <div className="generate-loading-progress">
              {LOADING_STAGES.map((_, index) => (
                <div
                  key={index}
                  className={`generate-loading-bar ${index <= loadingStage ? "active" : ""}`}
                />
              ))}
            </div>
            <p className="generate-loading-hint">보통 5~10초 정도 걸립니다</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="generate-main">
        <div className="generate-container">
          <form onSubmit={onSubmit} className="generate-form">
            {/* Unified Input Card */}
            <div className="generate-card">
              {/* Source Type Toggle */}
              <div className="generate-card-header">
                <div className="generate-toggle">
                  <button
                    type="button"
                    onClick={() => setSourceType("text")}
                    className={`generate-toggle-btn ${sourceType === "text" ? "active" : ""}`}
                  >
                    텍스트 입력
                  </button>
                  <button
                    type="button"
                    disabled
                    className="generate-toggle-btn"
                    title="URL 자동 분석 기능을 준비 중입니다"
                  >
                    URL 입력 <span style={{ fontSize: "0.7em", opacity: 0.6, marginLeft: 4 }}>준비중</span>
                  </button>
                </div>
              </div>

              {/* Input Area */}
              <div className="generate-card-body">
                {sourceType === "text" ? (
                  <div>
                    <div className="generate-label-row">
                      <label htmlFor="product-info" className="generate-label">
                        상품 정보
                      </label>
                      <button
                        type="button"
                        onClick={handleTryExample}
                        className="generate-example-btn"
                      >
                        예시로 해보기
                      </button>
                    </div>
                    <textarea
                      id="product-info"
                      value={textValue}
                      onChange={(e) => setTextValue(e.target.value)}
                      placeholder={`상품 상세페이지, 제조사 설명, 판매 문구 등을 붙여넣으세요.\n정리되지 않은 텍스트도 괜찮습니다. AI가 핵심을 추출합니다.`}
                      rows={7}
                      className="generate-textarea"
                      aria-describedby="input-helper"
                    />
                    <div className="generate-input-helper">
                      <p className="generate-hint">
                        쿠팡/스마트스토어 상세설명, 공구 안내문, 브랜드 소개글 등
                      </p>
                      <p
                        id="input-helper"
                        className={`generate-counter ${inputTooLong ? "error" : ""}`}
                        aria-live="polite"
                      >
                        {inputLength.toLocaleString()}/{INPUT_VALUE_MAX_LENGTH.toLocaleString()}
                        {inputTooLong && " 초과"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label htmlFor="product-url" className="generate-label">
                      상품 URL
                    </label>
                    <input
                      id="product-url"
                      type="url"
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      placeholder="https://smartstore.naver.com/... 또는 https://www.coupang.com/..."
                      className="generate-input"
                      aria-describedby="input-helper"
                    />
                    <div className="generate-input-helper">
                      <p className="generate-hint">
                        상품 상세 페이지 URL을 입력하면 자동으로 분석합니다
                      </p>
                      <p
                        id="input-helper"
                        className={`generate-counter ${inputTooLong ? "error" : ""}`}
                        aria-live="polite"
                      >
                        {inputLength.toLocaleString()}/{INPUT_VALUE_MAX_LENGTH.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Options Section - Integrated */}
              <div className="generate-card-footer">
                <div className="generate-options">
                  <ChannelPicker value={channel} onChange={setChannel} disabled={loading} />
                  <VibePresetPicker value={vibe} onChange={setVibe} disabled={loading} />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {error && !upgradeModal && (
              <div role="alert" className="generate-error">
                <div className="generate-error-content">
                  <div className="generate-error-icon">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <div className="generate-error-text">
                    <p className="generate-error-title">{getErrorInfo(error.code).title}</p>
                    <p className="generate-error-desc">{getErrorInfo(error.code).description}</p>
                  </div>
                </div>
                {(error.code === "AI_FAILED" || error.code === "INTERNAL" || error.code === "RATE_LIMIT_EXCEEDED") && (
                  <button type="button" onClick={onRetry} className="generate-retry-btn">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    다시 시도하기
                  </button>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="generate-submit-section">
              <button
                type="submit"
                disabled={!canSubmit}
                aria-busy={loading}
                className="btn btn-primary generate-submit-btn"
              >
                {isLoggedIn ? "카피 생성하기" : "회원가입 후 7일 무료 체험 시작"}
              </button>
              {submitDisabledReason ? (
                <p className="generate-submit-hint" role="status">
                  {submitDisabledReason}
                </p>
              ) : !isLoggedIn ? (
                <p className="generate-submit-hint">
                  가입 즉시 7일간 하루 3회 프리미엄 AI 무료 체험
                </p>
              ) : null}
            </div>
          </form>

          {/* Result Section */}
          {result && (
            <div className="generate-result-section">
              <div className="generate-save-notice">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>자동으로 저장되었습니다</span>
                <Link href="/history" className="generate-save-link">
                  기록 보기
                </Link>
              </div>

              <div className="generate-result-card">
                <CopyPackageView output={result} channel={channel} />
              </div>

              {/* Action buttons below result */}
              <div className="generate-action-buttons">
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="btn btn-ghost"
                >
                  다른 상품으로 생성하기
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const key = createIdempotencyKey();
                    setLastIdempotencyKey(key);
                    handleSubmit(key);
                  }}
                  disabled={loading}
                  className="btn btn-primary"
                >
                  같은 상품 다시 생성
                </button>
              </div>

              {/* Credits & feedback */}
              <div className="generate-footer-info">
                {creditsAfter !== null && (
                  <p className="generate-credits-info">남은 크레딧: {creditsAfter}</p>
                )}
                <p>
                  <Link href="/feedback" className="generate-feedback-link">
                    피드백 남기기
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <div className="footer-inner">
          <span>VibeCopy</span>
          <nav>
            {isLoggedIn && (
              <>
                <Link href="/me">내 정보</Link>
                <Link href="/history">생성 기록</Link>
              </>
            )}
            <Link href="/">홈</Link>
            <Link href="/pricing">요금제</Link>
            {!isLoggedIn && (
              <>
                <Link href="/login?returnUrl=/generate">로그인 / 회원가입</Link>
              </>
            )}
          </nav>
        </div>
      </footer>
    </div>
  );
}
