import type { Metadata } from "next";
import Link from "next/link";
import "../(marketing)/landing.css";

export const metadata: Metadata = {
  title: "VibeCopy 자주 묻는 질문 (FAQ)",
  description:
    "VibeCopy 무료 사용, 크레딧 리셋, 생성 결과 저장, 결제 안전성, 지원 채널, 입력 방법, 환불 정책 등 자주 묻는 질문을 확인하세요.",
  openGraph: {
    title: "VibeCopy 자주 묻는 질문 (FAQ)",
    description:
      "VibeCopy 무료 사용, 크레딧, 결제, 지원 채널, 입력 방법, 환불 정책 FAQ.",
    type: "website",
  },
};

const FAQ_ITEMS = [
  {
    q: "무료 사용은 어떻게 되나요?",
    a: "무료 플랜은 하루 3회까지 카피를 생성할 수 있습니다. 1회 생성 시 1 크레딧이 차감되는 방식이며, 일 3회를 초과하면 다음 날 자정에 한도가 리셋됩니다.",
  },
  {
    q: "크레딧은 언제 리셋되나요?",
    a: "Standard 플랜은 월 500 크레딧이 제공되며, 결제 성공(정기 결제 갱신) 시점에 해당 월 분이 리셋됩니다. Pro 플랜은 무제한 생성입니다.",
  },
  {
    q: "생성 결과는 저장되나요?",
    a: "네. 생성한 카피 패키지는 히스토리 페이지에 저장됩니다. 기록에서 다시 보기, 복사, 재생성할 수 있습니다.",
  },
  {
    q: "결제는 안전한가요?",
    a: "Stripe를 통해 결제를 처리합니다. 카드 정보는 저희 서버에 저장되지 않으며, Stripe의 보안 기준을 따릅니다. 정기 결제는 마이페이지에서 언제든 해지할 수 있습니다.",
  },
  {
    q: "어떤 채널을 지원하나요?",
    a: "스마트스토어, 쿠팡, 공동구매, 숏폼 등 채널을 선택할 수 있습니다. 채널에 맞는 톤과 형식으로 카피가 생성됩니다.",
  },
  {
    q: "입력은 어떻게 작성해야 하나요?",
    a: "상품 URL을 붙여넣거나, 상품명·특징·가격·타겟을 직접 입력하면 됩니다. 3~10줄 정도로 핵심만 요약해 주시고, 전체는 1,000자 이내로 작성해 주세요.",
  },
  {
    q: "환불 정책은?",
    a: "MVP 기준으로, 구독 결제 후 7일 이내 미사용 또는 서비스 장애 시 문의 시 환불을 검토합니다. 자세한 환불 요청은 고객 문의(이메일 또는 앱 내 피드백)로 접수해 주세요.",
  },
];

export default function FAQPage() {
  return (
    <div className="landing-page">
      <div className="landing-gradient" />

      {/* Header */}
      <header className="header-blur">
        <div className="header-inner">
          <Link href="/" className="logo">
            VibeCopy
          </Link>
          <nav>
            <Link href="/pricing">요금제</Link>
            <Link href="/guide">가이드</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/login" className="btn btn-ghost">
              로그인
            </Link>
            <Link href="/generate" className="btn btn-primary">
              시작하기
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="content-section">
          <div className="content-inner">
            <h1 className="content-title">자주 묻는 질문 (FAQ)</h1>
            <p className="content-subtitle">이용 시 궁금한 점을 모았습니다.</p>

            <dl className="faq-list">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="faq-item">
                  <dt>{item.q}</dt>
                  <dd>{item.a}</dd>
                </div>
              ))}
            </dl>

            <div className="cta-box">
              <h2>무료로 체험해 보세요</h2>
              <Link href="/generate" className="btn btn-primary">
                무료로 3회 사용해보기
              </Link>
            </div>

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
