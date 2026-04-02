import Link from "next/link";
import "../(marketing)/landing.css";

export default function GuidePage() {
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
            <h1 className="content-title">VibeCopy 사용 가이드</h1>
            <p className="content-subtitle">
              URL 또는 상품 정보만 넣으면 판매 카피 패키지를 한 번에 만듭니다.
            </p>

            <div className="content-block">
              <h2>이렇게 입력하세요</h2>
              <div className="content-card">
                <h3>URL 입력 예시</h3>
                <p>
                  스마트스토어·쿠팡 등 상품 상세 URL을 그대로 붙여넣으면 됩니다.
                  <br />
                  예: https://smartstore.naver.com/...
                </p>
              </div>
              <div className="content-card" style={{ marginTop: "1rem" }}>
                <h3>상품 특징 5줄 작성 예시</h3>
                <ul style={{ marginTop: "0.75rem" }}>
                  <li>• 상품명: 예) 무선 이어폰 Pro 3</li>
                  <li>• 특징 1~5: 핵심 스펙·혜택을 한 줄씩 (예: 40시간 재생, 노이즈캔슬링)</li>
                  <li>• 가격·타겟: 선택 입력 (예: 59,000원, 20~30대)</li>
                </ul>
              </div>
              <div className="content-card content-card-warning" style={{ marginTop: "1rem" }}>
                <h3 style={{ color: "#fbbf24" }}>잘못된 입력 vs 좋은 입력</h3>
                <p style={{ marginTop: "0.5rem" }}>
                  <strong style={{ color: "#fbbf24" }}>피하기:</strong> 너무 짧은 한 단어만, 또는 1,000자 초과.
                  <br />
                  <strong style={{ color: "#fbbf24" }}>추천:</strong> 상품의 차별점·혜택을 3~10줄 정도로 요약 (1,000자 이내).
                </p>
              </div>
            </div>

            <div className="content-block">
              <h2>채널 선택 가이드</h2>
              <ul>
                <li><strong>스마트스토어</strong> → 상세페이지형. 구매 전 읽는 긴 문구에 맞춤.</li>
                <li><strong>쿠팡</strong> → 검색 친화형. 키워드·검색 노출을 고려한 문구.</li>
                <li><strong>공동구매</strong> → 마감/한정 강조. 수량·기한·선착순 톤.</li>
                <li><strong>숏폼</strong> → 짧고 강한 후킹. 15초 안에 끌어당기는 문장.</li>
              </ul>
            </div>

            <div className="content-block">
              <h2>바이브 설명</h2>
              <p>생성 톤을 선택하면 그에 맞는 카피가 나옵니다.</p>
              <ul style={{ marginTop: "1rem" }}>
                <li><strong>신뢰형</strong> — 사실·스펙 중심, 신뢰감 있는 설명.</li>
                <li><strong>후기형</strong> — 리뷰·사용 후기 느낌의 설득.</li>
                <li><strong>자극형</strong> — 한정·할인·FOMO를 살린 유도.</li>
                <li><strong>프리미엄형</strong> — 고급감·품질 강조.</li>
                <li><strong>공구특화</strong> — 공동구매·단체 구매에 맞는 멘트.</li>
              </ul>
            </div>

            <div className="content-block">
              <h2>리스크 체크란?</h2>
              <p>
                생성 결과 하단의 <strong>리스크 체크</strong>는 광고·상세 문구에서 주의해야 할 표현을 표시합니다.
                과장·허위·금칙어에 가까운 문구가 있으면 수준(낮음/중간/높음)과 함께 안내하므로,
                그대로 사용하기 전에 한 번씩 확인하고 수정해 주세요.
              </p>
            </div>

            <div className="content-block">
              <h2>크레딧 정책</h2>
              <ul>
                <li><strong>Free</strong> — 하루 3회 생성 제한.</li>
                <li><strong>Standard</strong> — 월 500 크레딧 (결제일 기준 리셋).</li>
                <li><strong>Pro</strong> — 무제한 생성.</li>
              </ul>
              <p style={{ marginTop: "0.75rem" }}>
                자세한 요금은 <Link href="/pricing" style={{ color: "var(--indigo-400)" }}>요금제</Link>에서 확인하세요.
              </p>
            </div>

            <div className="cta-box">
              <h2>지금 카피 생성하러 가기</h2>
              <Link href="/generate" className="btn btn-primary">
                지금 카피 생성하러 가기
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
