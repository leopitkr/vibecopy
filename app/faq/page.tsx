import type { Metadata } from "next";
import Link from "next/link";
import { AuthHeader } from "@/components/AuthHeader";
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
    a: "회원가입 후 7일간 무료 체험이 제공되며, 하루 5회까지 프리미엄 AI(gpt-4o)로 카피를 생성할 수 있습니다. 체험 기간 종료 후에는 Free 플랜으로 전환되어 월 10회, 기본 AI(gpt-4o-mini)로 이용 가능합니다.",
  },
  {
    q: "크레딧은 언제 리셋되나요?",
    a: "Standard 플랜은 월 300회, Pro 플랜은 월 1,000회 생성이 제공됩니다. 유료 플랜은 결제 성공(정기 결제 갱신) 시점에 크레딧이 리셋됩니다. Free 플랜은 매월 1일 기준으로 월 10회가 자동 리셋됩니다.",
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
    a: "스마트스토어, 쿠팡, 제휴/블로그, SNS, 숏폼 채널을 선택할 수 있습니다. 채널에 맞는 톤과 형식으로 카피가 생성됩니다. Standard 이상 플랜에서는 바이브(분위기) 설정도 사용할 수 있습니다.",
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

      <AuthHeader />

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
                무료로 체험 시작하기
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
