# Design: landing-conversion-upgrade

> Phase: Design | Status: done | Created: 2026-04-03
> Architecture: Option C — Pragmatic Balance (5 Key Sections)

## Context Anchor

| Key | Value |
|-----|-------|
| WHY | Kill the "just use ChatGPT" objection → increase conversion |
| WHO | Korean e-commerce sellers (SmartStore, Coupang, Instagram, shortform) |
| RISK | Copy-only changes may not convert if product UX doesn't match |
| SUCCESS | Visitor understands value in <10 seconds; comparison table kills ChatGPT objection |
| SCOPE | Landing page only (`page.tsx` + `landing.css`). No backend. No new routes. |

---

## 1. Overview

Rewrite the landing page with 5 high-impact sections in a conversion funnel structure. The page uses the existing CSS design system (landing.css) with ~12 new CSS classes added.

**Selected Architecture**: Option C — 5 sections covering all critical conversion elements without duplicating pricing page logic.

**Key Decision**: No inline pricing table (link to `/pricing` instead). No dedicated persona section (folded into hero subtext and "who it's for" mention in CTA).

---

## 2. Page Structure (Section Flow)

```
┌─────────────────────────────────────┐
│  Header (existing, unchanged)       │
├─────────────────────────────────────┤
│  Section 1: HERO                    │
│  - Badge: "셀러 전용 판매글 생성기"    │
│  - H1: 상품 정보 하나로              │
│       판매글 32개가 한번에 나옵니다    │
│  - Sub: 채널별·톤별 output 설명      │
│  - CTA: 무료로 카피 만들어보기        │
│  - Micro: 매일 3회 무료 · 카드 불필요  │
├─────────────────────────────────────┤
│  Section 2: COMPARISON              │
│  - Title: ChatGPT로 하면 되지 않나요? │
│  - 6-row comparison table           │
│  - Bottom verdict text              │
├─────────────────────────────────────┤
│  Section 3: DEMO                    │
│  - Title: 30초 만에 이런 결과물이     │
│  - Full 6-category output showcase  │
│  - Each with copy button            │
│  - Mid CTA: 내 상품으로 만들어보기    │
├─────────────────────────────────────┤
│  Section 4: HOW IT WORKS            │
│  - Title: 3단계면 끝                 │
│  - Step 1: 붙여넣기                 │
│  - Step 2: 선택                     │
│  - Step 3: 복사 → 판매              │
├─────────────────────────────────────┤
│  Section 5: FINAL CTA               │
│  - Title: 지금 바로 시작하세요        │
│  - Value recap + pricing hook        │
│  - CTA button                       │
│  - Link to /pricing                 │
├─────────────────────────────────────┤
│  Footer (existing, unchanged)       │
└─────────────────────────────────────┘
```

---

## 3. Section Specifications

### 3.1 Hero Section

**Goal**: Communicate quantified value in first viewport.

```
Badge:    "셀러 전용 판매글 생성기" (replaces "AI 기반 마케팅 카피 생성기")
H1 line1: "상품 정보 하나로"
H1 line2: "판매글 32개가 한번에 나옵니다" (gradient text)
Subtext:  "헤드라인, 베네핏, DM 멘트, 댓글 유도, 마감 문구, 숏폼 대본까지
           — 채널별로 톤까지 맞춰서."
CTA1:     "무료로 카피 만들어보기" (btn-primary → /generate)
CTA2:     "결과물 미리보기" (btn-ghost → #demo)
Micro:    "회원가입하면 매일 3회 무료 · 카드 등록 없이 시작"
```

**Data**: No static data constants needed. Pure markup.

**CSS**: Reuses existing `.hero`, `.hero-inner`, `.badge`, `.text-gradient`, `.hero-buttons`, `.hero-note` classes. No new CSS.

### 3.2 Comparison Section

**Goal**: Kill the #1 objection — "ChatGPT로 하면 되지 않나요?"

```
Label:    "비교"
Title:    "ChatGPT로 하면 되지 않나요?"
```

**Comparison Table Data** (6 rows):

```typescript
const COMPARISON_DATA = [
  { category: "입력", chatgpt: "프롬프트 직접 작성", vibecopy: "상품 정보만 붙여넣기" },
  { category: "출력", chatgpt: "텍스트 한 덩어리", vibecopy: "6가지 카테고리로 구분 정리" },
  { category: "채널 최적화", chatgpt: "직접 수정해야 함", vibecopy: "스마트스토어·쿠팡·SNS·숏폼·제휴 자동" },
  { category: "톤 조절", chatgpt: "매번 프롬프트 수정", vibecopy: "신뢰·후기·자극·프리미엄·공구 원클릭" },
  { category: "정책 안전", chatgpt: "과장/금지표현 모름", vibecopy: "자동 필터링" },
  { category: "소요 시간", chatgpt: "30분+ (시행착오)", vibecopy: "30초" },
];
```

**Bottom verdict**:
```
"ChatGPT는 '글 쓰는 AI'입니다.
 VibeCopy는 '판매글 패키지를 찍어내는 도구'입니다."
```

**New CSS classes needed**:
- `.compare-table` — full-width table with dark theme
- `.compare-header` — table header row (3 columns)
- `.compare-row` — alternating row styling
- `.compare-category` — left column label
- `.compare-chatgpt` — middle column (muted/negative)
- `.compare-vibecopy` — right column (highlighted/positive)
- `.compare-verdict` — bottom verdict box

### 3.3 Demo Section

**Goal**: Show the full output package — all 6 categories, interactive copy buttons.

```
Label:    "결과물"
Title:    "이런 결과물이 30초 만에 나옵니다"
```

**Demo Data** (expanded from current 2 sections to 6):

```typescript
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
```

**Section rendering**: 6 collapsible sections (headlines/benefits open by default, rest collapsed with "펼치기" toggle).

Each section format: icon + label + copy button + items list.

| # | Icon | Label | Items shown |
|---|------|-------|-------------|
| 1 | 🎯 | 후킹 헤드라인 | 3 (of 10 in real output) |
| 2 | 💎 | 핵심 베네핏 | 3 (of 5) |
| 3 | 💬 | DM 유도 멘트 | 3 (of 5) |
| 4 | 💭 | 댓글 유도 문구 | 3 (of 5) |
| 5 | ⏰ | 마감/희소성 문구 | 3 (of 5) |
| 6 | 🎬 | 숏폼 스크립트 | 2 (of 2) |

**Demo footer**:
```
"실제 생성 시 헤드라인 10개, 베네핏 5개, DM 5개, 댓글 5개, 마감 5개, 숏폼 2개 — 총 32개가 나옵니다"
```

**Mid-section CTA** (after demo card):
```
Button: "내 상품으로 직접 만들어보기 →" (btn-primary → /generate)
```

**CSS**: Reuses existing `.demo-card`, `.demo-section`, `.demo-item` classes. No new CSS needed — sections 3-6 use the same pattern as existing headlines/benefits.

### 3.4 How It Works Section

**Goal**: Remove perceived complexity. Show it's 3 clicks.

```
Label:    "사용법"
Title:    "3단계면 끝"
```

**Steps Data**:

```typescript
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
    desc: "32개 카피가 즉시 생성됩니다. 원클릭 복사 후 바로 판매글에 사용하세요",
  },
];
```

**Layout**: 3-column grid (responsive to single column on mobile).

**New CSS classes needed**:
- `.steps-grid` — 3-column grid layout
- `.step-card` — individual step card
- `.step-num` — large number circle
- `.step-title` — step title text
- `.step-desc` — step description text

### 3.5 Final CTA Section

**Goal**: Close the page with urgency and clear action.

```
Title:    "지금 상품 정보 하나만 넣어보세요"
Subtext:  "30초 후에 판매글 32개를 받아보실 수 있습니다."
CTA:      "무료로 시작하기" (btn-primary, large → /generate)
Sub-link: "요금제 보기 →" (text link → /pricing)
```

**New CSS classes needed**:
- `.cta-section` — centered section with gradient background accent
- `.cta-title` — large title
- `.cta-sub` — subtitle text
- `.cta-link` — subtle text link below button

---

## 4. Component Architecture

### 4.1 File: `app/(marketing)/page.tsx`

Single client component (keep "use client" for clipboard interaction).

**State**:
```typescript
const [copiedSection, setCopiedSection] = useState<string | null>(null);
const [expandedSections, setExpandedSections] = useState<Set<string>>(
  new Set(["headlines", "benefits"])  // first 2 open by default
);
```

**Constants** (top of file):
- `COMPARISON_DATA` — 6-row comparison array
- `DEMO_DATA` — 6-category demo output (expanded from current 2)
- `STEPS` — 3-step how-it-works array
- `DEMO_SECTIONS` — section metadata (icon, label, key, dataKey)

**Functions**:
- `handleCopy(text, section)` — existing, unchanged
- `copyAll()` — updated to include all 6 sections
- `toggleSection(key)` — toggle expanded/collapsed state for demo sections

**Render flow**:
```
return (
  <div className="landing-page">
    <div className="landing-gradient" />
    <Header />                    // unchanged
    <main>
      <HeroSection />            // updated copy
      <ComparisonSection />      // NEW
      <DemoSection />            // expanded to 6 categories
      <HowItWorksSection />      // NEW
      <FinalCtaSection />        // NEW
    </main>
    <Footer />                   // add footer (currently missing)
  </div>
)
```

All sections are inline JSX in the same component (no extraction needed for 5 sections).

### 4.2 File: `app/(marketing)/landing.css`

Add ~120 lines for new CSS classes:

1. **Comparison table** (~50 lines): `.compare-table`, `.compare-header`, `.compare-row`, `.compare-category`, `.compare-chatgpt`, `.compare-vibecopy`, `.compare-verdict`
2. **Steps grid** (~40 lines): `.steps-grid`, `.step-card`, `.step-num`, `.step-title`, `.step-desc`
3. **Final CTA** (~20 lines): `.cta-section`, `.cta-title`, `.cta-sub`, `.cta-link`
4. **Demo toggle** (~10 lines): `.demo-toggle-btn`

All new classes follow existing design system conventions:
- Use CSS custom properties (`var(--bg-card)`, `var(--border-color)`, etc.)
- Use `!important` pattern (matching existing codebase convention)
- Dark theme with gradient accents
- Border-radius: 1rem-1.5rem
- Responsive via `auto-fit` / `minmax`

---

## 5. Data Flow

No API calls. No backend changes. Pure static content with client-side clipboard interaction.

```
Static Data (constants) → JSX Render → User clicks "복사" → navigator.clipboard → Toast state
```

---

## 6. Removed Elements

From the current page, these elements are **removed**:

| Element | Reason |
|---------|--------|
| `PAIN_POINTS` array + pain grid section | Replaced by comparison table (stronger objection handling) |
| `.solution-box` section | Value prop moved into hero subtext |
| Badge text "AI 기반 마케팅 카피 생성기" | Replaced with "셀러 전용 판매글 생성기" |

---

## 7. Copy Reference (All Text)

### Hero
- Badge: `셀러 전용 판매글 생성기`
- H1: `상품 정보 하나로` / `판매글 32개가 한번에 나옵니다`
- Sub: `헤드라인, 베네핏, DM 멘트, 댓글 유도, 마감 문구, 숏폼 대본까지 — 채널별로 톤까지 맞춰서.`
- CTA1: `무료로 카피 만들어보기`
- CTA2: `결과물 미리보기`
- Micro: `회원가입하면 매일 3회 무료 · 카드 등록 없이 시작`

### Comparison
- Label: `비교`
- Title: `ChatGPT로 하면 되지 않나요?`
- Verdict: `ChatGPT는 "글 쓰는 AI"입니다. VibeCopy는 "판매글 패키지를 찍어내는 도구"입니다.`

### Demo
- Label: `결과물`
- Title: `이런 결과물이 30초 만에 나옵니다`
- Footer: `실제 생성 시 헤드라인 10개, 베네핏 5개, DM 5개, 댓글 5개, 마감 5개, 숏폼 2개 — 총 32개가 나옵니다`
- Mid CTA: `내 상품으로 직접 만들어보기 →`

### How It Works
- Label: `사용법`
- Title: `3단계면 끝`
- Steps: 붙여넣기 → 채널·톤 선택 → 복사해서 바로 사용

### Final CTA
- Title: `지금 상품 정보 하나만 넣어보세요`
- Sub: `30초 후에 판매글 32개를 받아보실 수 있습니다.`
- CTA: `무료로 시작하기`
- Link: `요금제 보기 →`

---

## 8. Mobile Considerations

- Comparison table: horizontal scroll on < 640px (or stack vertically)
- Steps grid: single column on < 640px
- Demo sections: all collapsed by default on mobile (save scroll depth)
- Existing responsive CSS handles header, hero, demo card

---

## 9. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Page becomes too long | Users bounce before CTA | Collapsed demo sections; final CTA is short |
| Comparison table feels aggressive | Brand perception | Factual tone, no mockery of ChatGPT |
| "32개" claim confuses if output varies | Trust loss | Footer clarifies exact breakdown |

---

## 10. Dependencies

- None. Pure frontend changes to existing files.
- No new npm packages.
- No new routes or API endpoints.

---

## 11. Implementation Guide

### 11.1 File Changes

| File | Action | Lines (est.) |
|------|--------|-------------|
| `app/(marketing)/page.tsx` | Rewrite | ~280 lines |
| `app/(marketing)/landing.css` | Append | ~120 lines |

### 11.2 Implementation Order

1. **CSS first**: Add all new CSS classes to `landing.css`
2. **Data constants**: Replace/expand constants at top of `page.tsx`
3. **Hero section**: Update copy
4. **Comparison section**: New section after hero
5. **Demo section**: Expand from 2 to 6 categories + toggle
6. **How It Works section**: New section after demo
7. **Final CTA section**: New section + footer

### 11.3 Session Guide

Single session — all changes fit in one implementation pass.

| Module | Scope | Files |
|--------|-------|-------|
| module-1 | CSS additions | `landing.css` |
| module-2 | page.tsx rewrite | `page.tsx` |

Recommended: implement sequentially (CSS → TSX) in one session.
