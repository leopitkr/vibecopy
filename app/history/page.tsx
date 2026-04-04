import Link from "next/link";
import { GenerationsList } from "@/components/GenerationsList";
import { AuthHeader } from "@/components/AuthHeader";
import "../(marketing)/landing.css";

export const metadata = {
  title: "생성 기록 - VibeCopy",
  description: "내가 만든 카피를 다시 확인하고 재사용하세요",
};

export default function HistoryPage() {
  return (
    <div className="landing-page">
      <div className="landing-gradient" />

      {/* Header */}
      <AuthHeader />

      <main>
        <section className="content-section">
          <div className="content-inner" style={{ maxWidth: "700px" }}>
            <h1 className="content-title">생성 기록</h1>
            <p className="content-subtitle">이전에 생성한 카피를 확인하고 재사용하세요</p>

            <div className="demo-card" style={{ overflow: "hidden" }}>
              <GenerationsList />
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
