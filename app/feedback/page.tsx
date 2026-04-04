"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AuthHeader } from "@/components/AuthHeader";
import "../(marketing)/landing.css";

const PURPOSE_OPTIONS = [
  { value: "smartstore", label: "스마트스토어" },
  { value: "coupang", label: "쿠팡" },
  { value: "groupbuy", label: "공동구매" },
  { value: "shortform", label: "숏폼" },
] as const;

export default function FeedbackPage() {
  const [purpose, setPurpose] = useState<string>("smartstore");
  const [rating, setRating] = useState<number>(3);
  const [good, setGood] = useState("");
  const [bad, setBad] = useState("");
  const [request, setRequest] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        const res = await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            purpose,
            rating,
            good: good.trim() || undefined,
            bad: bad.trim() || undefined,
            request: request.trim() || undefined,
            email: email.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError((data.error?.message as string) ?? "제출에 실패했습니다.");
          return;
        }
        setSent(true);
      } catch {
        setError("네트워크 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    },
    [purpose, rating, good, bad, request, email]
  );

  if (sent) {
    return (
      <div className="landing-page">
        <div className="landing-gradient" />

        {/* Header */}
        <AuthHeader />

        <main className="auth-section">
          <div className="auth-content">
            <div className="auth-box" style={{ textAlign: "center" }}>
              <h1 className="auth-title">피드백을 보내주셔서 감사합니다</h1>
              <p className="auth-subtitle">소중한 의견으로 서비스를 개선하겠습니다.</p>
              <Link href="/" className="btn btn-primary" style={{ marginTop: "2rem" }}>
                홈으로
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-gradient" />

      {/* Header */}
      <AuthHeader />

      <main>
        <section className="content-section">
          <div className="content-inner" style={{ maxWidth: "560px" }}>
            <h1 className="content-title">피드백 보내기</h1>
            <p className="content-subtitle">베타 서비스 개선을 위해 1분만 소요해 주세요.</p>

            <form onSubmit={onSubmit} className="auth-form" style={{ marginTop: "2rem" }}>
              <div className="form-group">
                <label>사용 목적</label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.75rem",
                    fontSize: "0.9375rem",
                    color: "white",
                  }}
                >
                  {PURPOSE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} style={{ background: "#1a1a2e" }}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>만족도 (1–5)</label>
                <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <label
                      key={n}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                        padding: "0.5rem 1rem",
                        background: rating === n ? "var(--indigo-500)" : "var(--bg-card)",
                        border: "1px solid",
                        borderColor: rating === n ? "var(--indigo-500)" : "var(--border-color)",
                        borderRadius: "0.5rem",
                        transition: "all 0.2s",
                      }}
                    >
                      <input
                        type="radio"
                        name="rating"
                        value={n}
                        checked={rating === n}
                        onChange={() => setRating(n)}
                        style={{ display: "none" }}
                      />
                      <span style={{ color: "white", fontWeight: 500 }}>{n}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>가장 좋았던 점</label>
                <textarea
                  value={good}
                  onChange={(e) => setGood(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="선택 입력"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.75rem",
                    fontSize: "0.9375rem",
                    color: "white",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="form-group">
                <label>아쉬웠던 점</label>
                <textarea
                  value={bad}
                  onChange={(e) => setBad(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="선택 입력"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.75rem",
                    fontSize: "0.9375rem",
                    color: "white",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="form-group">
                <label>개선 요청</label>
                <textarea
                  value={request}
                  onChange={(e) => setRequest(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  placeholder="선택 입력"
                  style={{
                    width: "100%",
                    padding: "0.875rem 1rem",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    borderRadius: "0.75rem",
                    fontSize: "0.9375rem",
                    color: "white",
                    resize: "vertical",
                  }}
                />
              </div>

              <div className="form-group">
                <label>이메일 (선택, 답변 필요 시)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={256}
                  placeholder="example@email.com"
                />
              </div>

              {error && (
                <div className="error-message" style={{ marginTop: 0 }}>
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "제출 중…" : "피드백 보내기"}
              </button>
            </form>

            <p className="back-link">
              <Link href="/">홈으로</Link>
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <div className="footer-inner">
          <span>© VibeCopy</span>
          <nav>
            <Link href="/pricing">요금제</Link>
            <Link href="/guide">이용 가이드</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/feedback">피드백</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
