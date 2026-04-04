import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SignOutButton from "./SignOutButton";
import { AuthHeader } from "@/components/AuthHeader";
import "../(marketing)/landing.css";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="landing-page">
        <div className="landing-gradient" />

        {/* Header */}
        <AuthHeader />

        <main className="auth-section">
          <div className="auth-content">
            <div className="auth-box" style={{ textAlign: "center" }}>
              <h1 className="auth-title">로그인이 필요합니다</h1>
              <p className="auth-subtitle">내 정보를 확인하려면 로그인해주세요.</p>
              <Link href="/login" className="btn btn-primary" style={{ marginTop: "2rem" }}>
                로그인하기
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  let profile: { id: string; email: string | null; plan: string; credit_balance: number } | null = null;
  let error: Error | null = null;
  let result = await supabase
    .from("users")
    .select("id, email, plan, credit_balance")
    .eq("id", user.id)
    .single();
  profile = result.data;
  error = result.error;

  // If no row (e.g. user signed up before trigger existed), create it and retry
  if (error && (result.error?.code === "PGRST116" || result.error?.message?.includes("single JSON object"))) {
    await supabase.from("users").insert({ id: user.id, email: user.email ?? undefined }).select().single();
    result = await supabase
      .from("users")
      .select("id, email, plan, credit_balance")
      .eq("id", user.id)
      .single();
    profile = result.data;
    error = result.error;
  }

  if (error || !profile) {
    return (
      <div className="landing-page">
        <div className="landing-gradient" />

        <AuthHeader />

        <main className="auth-section">
          <div className="auth-content">
            <div className="auth-box" style={{ textAlign: "center" }}>
              <h1 className="auth-title">오류가 발생했습니다</h1>
              <p className="auth-subtitle" style={{ color: "var(--red-400)" }}>
                프로필을 불러오는 중 오류: {error?.message ?? "알 수 없는 오류"}
              </p>
              <SignOutButton />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const PLAN_LABELS: Record<string, string> = {
    free: "Free",
    standard: "Standard",
    pro: "Pro",
  };

  return (
    <div className="landing-page">
      <div className="landing-gradient" />

      {/* Header */}
      <AuthHeader />

      <main>
        <section className="content-section">
          <div className="content-inner" style={{ maxWidth: "500px" }}>
            <h1 className="content-title">내 정보</h1>
            <p className="content-subtitle">계정 정보와 사용량을 확인하세요</p>

            <div className="demo-card">
              <div style={{ padding: "2rem" }}>
                <dl style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                  <div>
                    <dt style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                      이메일
                    </dt>
                    <dd style={{ fontSize: "1rem", color: "white" }}>
                      {profile.email ?? "—"}
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                      플랜
                    </dt>
                    <dd style={{ fontSize: "1rem", color: "white" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "0.25rem 0.75rem",
                        background: profile.plan === "pro" ? "linear-gradient(135deg, var(--indigo-500), var(--cyan-400))" : "rgba(99, 102, 241, 0.2)",
                        borderRadius: "9999px",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "white",
                      }}>
                        {PLAN_LABELS[profile.plan] ?? profile.plan}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-muted)", marginBottom: "0.25rem" }}>
                      잔여 크레딧
                    </dt>
                    <dd style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--indigo-400)" }}>
                      {profile.credit_balance}
                    </dd>
                  </div>
                </dl>

                <div style={{ marginTop: "2rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                  <Link href="/pricing" className="btn btn-primary">
                    요금제 변경
                  </Link>
                  <Link href="/generate" className="btn btn-ghost">
                    카피 생성하기
                  </Link>
                </div>

                <SignOutButton />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="page-footer">
        <div className="footer-inner">
          <span>© VibeCopy</span>
          <nav>
            <Link href="/generate">카피 생성</Link>
            <Link href="/history">생성 기록</Link>
            <Link href="/me">내 정보</Link>
            <Link href="/">홈</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
