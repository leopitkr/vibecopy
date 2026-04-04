"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
import "../(marketing)/landing.css";

type UserProfile = {
  id: string;
  email: string | null;
  nickname: string | null;
  plan: string;
  credit_balance: number;
};

type Subscription = {
  id: string;
  plan: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_at: string;
};

type TabKey = "profile" | "subscription" | "account";

const TABS: { key: TabKey; label: string }[] = [
  { key: "profile", label: "프로필" },
  { key: "subscription", label: "구독 관리" },
  { key: "account", label: "계정" },
];

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  standard: "Standard",
  pro: "Pro",
};

const STATUS_LABELS: Record<string, string> = {
  active: "활성",
  trialing: "체험 중",
  past_due: "결제 지연",
  canceled: "취소됨",
  incomplete: "미완료",
  unpaid: "미결제",
};

export default function AccountPage() {
  return (
    <Suspense fallback={
      <div className="landing-page">
        <div className="landing-gradient" />
        <AuthHeader />
        <div className="account-container" style={{ textAlign: "center", paddingTop: "12rem" }}>
          <p style={{ color: "var(--text-muted)" }}>로딩 중...</p>
        </div>
      </div>
    }>
      <AccountContent />
    </Suspense>
  );
}

function AccountContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<TabKey>(
    (tabParam === "subscription" || tabParam === "account") ? tabParam : "profile"
  );

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editNickname, setEditNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Cancel subscription state
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const showToast = useCallback((type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Fetch profile
  useEffect(() => {
    Promise.all([
      fetch("/api/me", { credentials: "include", cache: "no-store" }).then((r) => r.json()),
      fetch("/api/account/subscriptions", { credentials: "include", cache: "no-store" })
        .then((r) => r.ok ? r.json() : { data: [] })
        .catch(() => ({ data: [] })),
    ])
      .then(([meData, subsData]) => {
        if (meData?.data?.id) {
          setProfile({
            id: meData.data.id,
            email: meData.data.email,
            nickname: meData.data.nickname,
            plan: meData.data.plan,
            credit_balance: meData.data.credit_balance,
          });
          setEditNickname(meData.data.nickname || "");
        }
        setSubscriptions(subsData?.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Save nickname
  const handleSaveProfile = async () => {
    if (!editNickname.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/account/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: editNickname.trim() }),
      });
      if (res.ok) {
        setProfile((prev) => prev ? { ...prev, nickname: editNickname.trim() } : prev);
        showToast("success", "닉네임이 변경되었습니다.");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err?.error?.message || "저장에 실패했습니다.");
      }
    } catch {
      showToast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  // Cancel subscription
  const handleCancelSubscription = async (subscriptionId: string) => {
    setCancellingId(subscriptionId);
    try {
      const res = await fetch("/api/account/subscriptions/cancel", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription_id: subscriptionId }),
      });
      if (res.ok) {
        setSubscriptions((prev) =>
          prev.map((s) => s.id === subscriptionId ? { ...s, cancel_at_period_end: true } : s)
        );
        showToast("success", "구독이 기간 종료 후 취소됩니다.");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err?.error?.message || "구독 취소에 실패했습니다.");
      }
    } catch {
      showToast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      setCancellingId(null);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== profile?.email) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        router.push("/?deleted=1");
      } else {
        const err = await res.json().catch(() => ({}));
        showToast("error", err?.error?.message || "계정 삭제에 실패했습니다.");
      }
    } catch {
      showToast("error", "네트워크 오류가 발생했습니다.");
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="landing-page">
        <div className="landing-gradient" />
        <AuthHeader />
        <div className="account-container" style={{ textAlign: "center", paddingTop: "12rem" }}>
          <p style={{ color: "var(--text-muted)" }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="landing-page">
        <div className="landing-gradient" />
        <AuthHeader />
        <div className="account-container" style={{ textAlign: "center", paddingTop: "12rem" }}>
          <h2 style={{ color: "white", marginBottom: "1rem" }}>로그인이 필요합니다</h2>
          <Link href="/login?returnUrl=/account" className="btn btn-primary">
            로그인하기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-page">
      <div className="landing-gradient" />
      <AuthHeader />

      <div className="account-container">
        <div className="account-header">
          <h1>계정 설정</h1>
          <p>프로필, 구독, 계정을 관리하세요</p>
        </div>

        {/* Tabs */}
        <div className="account-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              className={`account-tab${activeTab === tab.key ? " active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <>
            <div className="account-card">
              <h3>기본 정보</h3>
              <div className="account-field">
                <label>이메일</label>
                <div className="field-value">{profile.email ?? "—"}</div>
              </div>
              <div className="account-field">
                <label>현재 플랜</label>
                <div className="field-value">
                  <span
                    style={{
                      display: "inline-block",
                      padding: "0.25rem 0.75rem",
                      background:
                        profile.plan === "pro"
                          ? "linear-gradient(135deg, var(--indigo-500), var(--cyan-400))"
                          : "rgba(99, 102, 241, 0.2)",
                      borderRadius: "9999px",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                    }}
                  >
                    {PLAN_LABELS[profile.plan] ?? profile.plan}
                  </span>
                </div>
              </div>
              <div className="account-field">
                <label>잔여 크레딧</label>
                <div className="field-value" style={{ color: "var(--indigo-400)", fontWeight: 700 }}>
                  {profile.credit_balance}
                </div>
              </div>
            </div>

            <div className="account-card">
              <h3>닉네임 변경</h3>
              <div className="account-field">
                <label>닉네임</label>
                <input
                  type="text"
                  className="account-input"
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  placeholder="닉네임을 입력하세요"
                  maxLength={20}
                />
              </div>
              <div className="account-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={handleSaveProfile}
                  disabled={saving || !editNickname.trim() || editNickname.trim() === profile.nickname}
                >
                  {saving ? "저장 중..." : "저장"}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Subscription Tab */}
        {activeTab === "subscription" && (
          <>
            <div className="account-card">
              <h3>현재 구독</h3>
              {profile.plan === "free" ? (
                <div className="empty-state">
                  <div className="empty-state-icon">&#128176;</div>
                  <p>현재 무료 플랜을 사용 중입니다.</p>
                  <Link
                    href="/pricing"
                    className="btn btn-primary btn-sm"
                    style={{ marginTop: "1rem", display: "inline-flex" }}
                  >
                    요금제 업그레이드
                  </Link>
                </div>
              ) : (
                <div className="account-field">
                  <label>플랜</label>
                  <div className="field-value">
                    <span
                      style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        background:
                          profile.plan === "pro"
                            ? "linear-gradient(135deg, var(--indigo-500), var(--cyan-400))"
                            : "rgba(99, 102, 241, 0.2)",
                        borderRadius: "9999px",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {PLAN_LABELS[profile.plan] ?? profile.plan}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="account-card">
              <h3>구독 이력</h3>
              {subscriptions.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">&#128203;</div>
                  <p>구독 이력이 없습니다.</p>
                </div>
              ) : (
                subscriptions.map((sub) => (
                  <div key={sub.id} className="subscription-item">
                    <div className="subscription-info">
                      <span className="subscription-plan">
                        {PLAN_LABELS[sub.plan] ?? sub.plan}
                      </span>
                      <span className="subscription-date">
                        {sub.current_period_start
                          ? `${new Date(sub.current_period_start).toLocaleDateString("ko-KR")} ~ ${sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("ko-KR") : ""}`
                          : new Date(sub.created_at).toLocaleDateString("ko-KR")}
                      </span>
                      {sub.cancel_at_period_end && (
                        <span style={{ fontSize: "0.8rem", color: "var(--red-400)" }}>
                          기간 종료 후 해지 예정
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span
                        className={`subscription-status status-${sub.status === "active" && sub.cancel_at_period_end ? "canceled" : sub.status}`}
                      >
                        {sub.cancel_at_period_end ? "해지 예정" : STATUS_LABELS[sub.status] ?? sub.status}
                      </span>
                      {sub.status === "active" && !sub.cancel_at_period_end && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleCancelSubscription(sub.id)}
                          disabled={cancellingId === sub.id}
                          style={{ fontSize: "0.8rem" }}
                        >
                          {cancellingId === sub.id ? "처리 중..." : "구독 취소"}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Account Tab */}
        {activeTab === "account" && (
          <div className="account-card danger-zone">
            <h3>회원 탈퇴</h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6, marginBottom: "1rem" }}>
              계정을 삭제하면 모든 데이터(생성 기록, 구독 정보 등)가 영구적으로 삭제되며 복구할 수 없습니다.
            </p>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              회원 탈퇴
            </button>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: "var(--red-400)" }}>정말 탈퇴하시겠습니까?</h3>
            <p>
              이 작업은 되돌릴 수 없습니다. 확인을 위해 이메일 주소를 입력해주세요.
            </p>
            <input
              type="email"
              className="account-input"
              placeholder={profile.email ?? "이메일 입력"}
              value={deleteConfirmEmail}
              onChange={(e) => setDeleteConfirmEmail(e.target.value)}
              style={{ marginBottom: "1.25rem" }}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmEmail("");
                }}
              >
                취소
              </button>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={handleDeleteAccount}
                disabled={deleting || deleteConfirmEmail !== profile.email}
              >
                {deleting ? "삭제 중..." : "탈퇴하기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Footer */}
      <footer className="page-footer">
        <div className="footer-inner">
          <span>&copy; VibeCopy</span>
          <nav>
            <Link href="/generate">카피 생성</Link>
            <Link href="/history">생성 기록</Link>
            <Link href="/account">내 정보</Link>
            <Link href="/">홈</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
