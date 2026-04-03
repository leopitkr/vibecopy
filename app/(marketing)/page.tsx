"use client";

import Link from "next/link";
import { useState } from "react";
import "./landing.css";

// Design Ref: §3.2 — Comparison table data (6 rows)
const COMPARISON_DATA = [
  { category: "입력", chatgpt: "프롬프트 직접 작성", vibecopy: "상품 정보만 붙여넣기" },
  { category: "출력", chatgpt: "텍스트 한 덩어리", vibecopy: "6가지 카테고리로 구분 정리" },
  { category: "채널 최적화", chatgpt: "직접 수정해야 함", vibecopy: "스마트스토어·쿠팡·SNS·숏폼·제휴 자동" },
  { category: "톤 조절", chatgpt: "매번 프롬프트 수정", vibecopy: "신뢰·후기·자극·프리미엄·공구 원클릭" },
  { category: "정책 안전", chatgpt: "과장/금지표현 모름", vibecopy: "자동 필터링" },
  { category: "소요 시간", chatgpt: "30분+ (시행착오)", vibecopy: "30초" },
];

// Design Ref: §3.3 — Full 6-category demo output
const DEMO_DATA = {
  headlines: [
    '"이탈리아 셰프가 직접 쓰는 그 오일, 드디어 국내 입고"',
    '"마트 오일로 만족 못 하는 분들만 클릭하세요"',
    '"파스타 맛이 달라지는 이유? 올리브 오일 하나 바꿨을 뿐"',
  ],
  benefits: [
    "냉압착 방식으로 영양 손실 제로",
    "산도 0.3% 이하 엑스트라 버진 등급",
    "유통기한 걱정 없는 소용량 패키지",
  ],
  dm_messages: [
    "이거 저번에 올린 올리브 오일인데 재입고됐어요! 수량 얼마 없어서 먼저 연락드려요",
    "DM 주시면 공구가로 안내드릴게요, 마트보다 훨씬 저렴해요",
    "혹시 올리브 오일 찾고 계셨으면 이번이 진짜 타이밍이에요",
  ],
  comment_triggers: [
    "써보신 분 후기 좀 알려주세요!",
    "보관 팁 아시는 분 댓글로 공유해주세요",
    "이거 vs 코스트코 오일, 어떤 게 나을까요?",
  ],
  scarcity_lines: [
    "이번 입고분 200병 중 벌써 절반 나갔어요",
    "다음 입고 미정이라 지금 아니면 한참 기다리셔야 해요",
    "오늘 자정까지만 공구가 유지됩니다",
  ],
  shortform_scripts: [
    { hook: "마트 올리브 오일이랑 뭐가 다르냐고요?", body: "산도 0.3% 이하만 엑스트라 버진인데, 마트 대부분은 1% 넘어요. 이건 직수입이라 가격도 비슷한데 퀄리티가 달라요." },
    { hook: "파스타 맛이 갑자기 달라진 이유", body: "올리브 오일 바꿨을 뿐인데 향이 완전 달라요. 셰프들이 오일에 집착하는 이유를 알겠더라고요." },
  ],
};

const DEMO_SECTIONS = [
  { key: "headlines", icon: "🎯", label: "후킹 헤드라인", dataKey: "headlines" as const },
  { key: "benefits", icon: "💎", label: "핵심 베네핏", dataKey: "benefits" as const },
  { key: "dm_messages", icon: "💬", label: "DM 유도 멘트", dataKey: "dm_messages" as const },
  { key: "comment_triggers", icon: "💭", label: "댓글 유도 문구", dataKey: "comment_triggers" as const },
  { key: "scarcity_lines", icon: "⏰", label: "마감/희소성 문구", dataKey: "scarcity_lines" as const },
];

// Design Ref: §3.4 — 3-step how-it-works
const STEPS = [
  {
    num: "1",
    title: "붙여넣기",
    desc: "상품 정보(URL 또는 텍스트)를 입력창에 붙여넣으세요",
  },
  {
    num: "2",
    title: "채널·톤 선택",
    desc: "판매 채널(스마트스토어, 쿠팡, SNS 등)과 톤(신뢰, 후기, 자극 등)을 선택하세요",
  },
  {
    num: "3",
    title: "복사해서 바로 사용",
    desc: "채널에 맞는 카피가 즉시 생성됩니다. 원클릭 복사 후 바로 판매글에 사용하세요",
  },
];

export default function LandingPage() {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["headlines", "benefits"])
  );

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(section);
      setTimeout(() => setCopiedSection(null), 1500);
    } catch {
      console.error("복사 실패");
    }
  };

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const copyAll = () => {
    const allText = [
      "🎯 후킹 헤드라인",
      ...DEMO_DATA.headlines,
      "",
      "💎 핵심 베네핏",
      ...DEMO_DATA.benefits,
      "",
      "💬 DM 유도 멘트",
      ...DEMO_DATA.dm_messages,
      "",
      "💭 댓글 유도 문구",
      ...DEMO_DATA.comment_triggers,
      "",
      "⏰ 마감/희소성 문구",
      ...DEMO_DATA.scarcity_lines,
      "",
      "🎬 숏폼 스크립트",
      ...DEMO_DATA.shortform_scripts.map((s, i) => `[${i + 1}] Hook: ${s.hook}\nBody: ${s.body}`),
    ].join("\n");
    handleCopy(allText, "all");
  };

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
        {/* ===== Section 1: Hero ===== */}
        {/* Plan SC1: Hero communicates quantified value ("32 pieces") */}
        <section className="hero">
          <div className="hero-inner">
            <div className="badge">
              <span className="badge-dot" />
              셀러 전용 판매글 생성기
            </div>
            <h1>
              상품 정보 하나로
              <br />
              <span className="text-gradient">채널에 딱 맞는 판매글이 나옵니다</span>
            </h1>
            <p>
              스마트스토어 상품명, 쿠팡 타이틀, SNS 캡션, 숏폼 스크립트까지
              <br />
              — 채널별로 필요한 카피만, 톤까지 맞춰서.
            </p>
            <div className="hero-buttons">
              <Link href="/generate" className="btn btn-primary">
                무료로 카피 만들어보기
              </Link>
              <Link href="#demo" className="btn btn-ghost">
                결과물 미리보기
              </Link>
            </div>
            <p className="hero-note">
              가입하면 <strong>7일간 프리미엄 AI 무료 체험</strong> · 카드 등록 없이 시작
            </p>
          </div>
        </section>

        {/* ===== Section 2: Comparison ===== */}
        {/* Plan SC2: ChatGPT comparison section kills the objection */}
        <section>
          <div className="section-inner">
            <p className="section-label">비교</p>
            <h2 className="section-title">ChatGPT로 하면 되지 않나요?</h2>

            <table className="compare-table">
              <thead>
                <tr>
                  <th></th>
                  <th>ChatGPT</th>
                  <th>VibeCopy</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_DATA.map((row) => (
                  <tr key={row.category}>
                    <td className="compare-category">{row.category}</td>
                    <td className="compare-chatgpt">{row.chatgpt}</td>
                    <td className="compare-vibecopy">{row.vibecopy}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="compare-verdict">
              ChatGPT는 &ldquo;글 쓰는 AI&rdquo;입니다.
              <br />
              VibeCopy는 <strong>&ldquo;판매글 패키지를 찍어내는 도구&rdquo;</strong>입니다.
            </div>
          </div>
        </section>

        {/* ===== Section 3: Demo ===== */}
        {/* Plan SC3: Demo shows all 6 output categories with copy buttons */}
        <section id="demo">
          <div className="section-inner">
            <p className="section-label">결과물</p>
            <h2 className="section-title">이런 결과물이 30초 만에 나옵니다</h2>

            <div className="demo-card">
              {/* Demo Header */}
              <div className="demo-header">
                <div className="demo-header-left">
                  <span className="demo-badge">예시</span>
                  <span className="demo-title">프리미엄 올리브 오일</span>
                </div>
                <button onClick={copyAll} className="demo-copy-btn">
                  {copiedSection === "all" ? "복사됨!" : "전체 복사"}
                </button>
              </div>

              {/* Text-based sections (5 categories) */}
              {DEMO_SECTIONS.map((section) => {
                const isExpanded = expandedSections.has(section.key);
                const items = DEMO_DATA[section.dataKey] as string[];

                return (
                  <div key={section.key}>
                    <button
                      className="demo-toggle-btn"
                      onClick={() => toggleSection(section.key)}
                    >
                      <div className="demo-section-title">
                        <span className="demo-section-icon">{section.icon}</span>
                        <span className="demo-section-label">{section.label}</span>
                      </div>
                      <span className={`demo-toggle-icon ${isExpanded ? "expanded" : ""}`}>
                        ▼
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="demo-section">
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                          <button
                            onClick={() => handleCopy(items.join("\n"), section.key)}
                            className="demo-copy-btn"
                          >
                            {copiedSection === section.key ? "복사됨!" : "복사"}
                          </button>
                        </div>
                        <div className="demo-items">
                          {items.map((text, i) => (
                            <div key={i} className="demo-item">
                              <span className="demo-item-num">{i + 1}</span>
                              <span>{text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Shortform Scripts */}
              {(() => {
                const isExpanded = expandedSections.has("shortform");
                return (
                  <div>
                    <button
                      className="demo-toggle-btn"
                      onClick={() => toggleSection("shortform")}
                    >
                      <div className="demo-section-title">
                        <span className="demo-section-icon">🎬</span>
                        <span className="demo-section-label">숏폼 스크립트</span>
                      </div>
                      <span className={`demo-toggle-icon ${isExpanded ? "expanded" : ""}`}>
                        ▼
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="demo-section">
                        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
                          <button
                            onClick={() =>
                              handleCopy(
                                DEMO_DATA.shortform_scripts
                                  .map((s, i) => `[${i + 1}] Hook: ${s.hook}\nBody: ${s.body}`)
                                  .join("\n\n"),
                                "shortform"
                              )
                            }
                            className="demo-copy-btn"
                          >
                            {copiedSection === "shortform" ? "복사됨!" : "복사"}
                          </button>
                        </div>
                        <div className="demo-items">
                          {DEMO_DATA.shortform_scripts.map((script, i) => (
                            <div key={i} className="demo-script">
                              <span className="demo-script-label">Hook</span>
                              <span className="demo-script-text">{script.hook}</span>
                              <span className="demo-script-label">Body</span>
                              <span className="demo-script-text">{script.body}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Demo Footer */}
              <div className="demo-footer">
                채널에 맞는 카피가 자동으로 구성됩니다. 스마트스토어는 상품명·키워드, SNS는 캡션·DM, 숏폼은 스크립트 중심 — <span>채널별 최적화</span>
              </div>
            </div>

            {/* Mid CTA */}
            <div className="demo-mid-cta">
              <Link href="/generate" className="btn btn-primary">
                내 상품으로 직접 만들어보기 →
              </Link>
            </div>
          </div>
        </section>

        {/* ===== Section 4: How It Works ===== */}
        <section>
          <div className="section-inner">
            <p className="section-label">사용법</p>
            <h2 className="section-title">3단계면 끝</h2>

            <div className="steps-grid">
              {STEPS.map((step) => (
                <div key={step.num} className="step-card">
                  <div className="step-num">{step.num}</div>
                  <div className="step-title">{step.title}</div>
                  <div className="step-desc">{step.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Section 5: Final CTA ===== */}
        {/* Plan SC4: Pricing hook with link to /pricing */}
        <section className="cta-section">
          <h2 className="cta-title">지금 상품 정보 하나만 넣어보세요</h2>
          <p className="cta-sub">30초 후에 채널에 딱 맞는 판매글을 받아보실 수 있습니다.</p>
          <Link href="/generate" className="btn btn-primary">
            무료로 시작하기
          </Link>
          <br />
          <Link href="/pricing" className="cta-link">
            요금제 보기 →
          </Link>
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
