import type OpenAI from "openai";

/**
 * Conversion-focused prompt for Korean e-commerce copy generation.
 * Response must match the schema: hook_headlines[10], benefits[5], dm_messages[5],
 * comment_triggers[5], scarcity_lines[5], shortform_scripts[2].
 *
 * UPGRADED: Forces specificity, realism, and conversion-focused tone.
 * Outputs should feel immediately usable for real selling.
 */

// --- Vibe presets (강화된 스타일 규칙) ---
export const VIBE_PRESETS = {
  trust: {
    tone: "신뢰감 있는 추천, 근거 있는 설명",
    style: "믿을 수 있는 이유를 자연스럽게 녹여서 작성",
    rules: [
      "반드시 믿을 만한 근거나 이유 포함",
      "과장 없이 담백하게 작성",
      "그래도 구어체 유지, 딱딱하지 않게",
      "실제 경험에서 나온 것처럼 작성",
    ],
  },
  review: {
    tone: "실제 사용자 후기처럼",
    style: "솔직하고 구체적인 개인 경험담",
    rules: [
      "반드시 1인칭 시점으로 작성",
      "사용 전/후 변화 포함",
      "구체적인 상황 묘사 필수",
      "격식체 사용 금지, 친근한 말투",
    ],
  },
  impulse: {
    tone: "긴급함과 FOMO 자극",
    style: "지금 당장 사야 할 것 같은 느낌",
    rules: [
      "시간/수량 제한 강조",
      "놓치면 후회할 것 같은 느낌 주기",
      "망설이면 안 되는 이유 포함",
      "직접적인 행동 유도",
    ],
  },
  premium: {
    tone: "감성적 만족감 중심",
    style: "가심비, 소유욕 자극",
    rules: [
      "저렴함 강조 금지",
      "품질과 경험의 차이 강조",
      "소유했을 때의 기분 묘사",
      "은근한 자부심 느낌",
    ],
  },
  groupbuy: {
    tone: "공구 진행자처럼",
    style: "친근하면서 급한 느낌",
    rules: [
      "실제 공구 상황처럼 작성",
      "함께 사는 느낌 강조",
      "특별 혜택/가격 언급",
      "마감 임박 느낌 자연스럽게",
    ],
  },
} as const;

export type VibeKey = keyof typeof VIBE_PRESETS;

// --- Channel constraints (강화된 채널별 규칙) ---
export const CHANNEL_CONSTRAINTS = {
  smartstore: {
    context: "네이버 스마트스토어 상세페이지용",
    format: "검색 키워드 친화적, 상세 설명 중심",
    rules: [
      "한 줄당 최대 20단어",
      "구체적인 맥락 포함 (언제/어디서/왜)",
      "그래도 generic한 표현 금지",
      "검색될 수 있는 구체적 키워드 자연스럽게 포함",
    ],
  },
  coupang: {
    context: "쿠팡 상품 페이지용",
    format: "간결하고 핵심 위주",
    rules: [
      "한 줄당 최대 15단어",
      "핵심 베네핏 즉시 전달",
      "로켓배송/빠른배송 활용 가능",
      "구매 결정에 직접 영향주는 내용만",
    ],
  },
  affiliate: {
    context: "블로그/카페 제휴 마케팅용",
    format: "자연스러운 추천글 형식",
    rules: [
      "경험담 중심으로 작성",
      "광고 티 나지 않게",
      "실제 사용 후기처럼",
      "자연스러운 추천 흐름",
    ],
  },
  social: {
    context: "인스타그램/SNS 피드용",
    format: "짧고 임팩트 있게",
    rules: [
      "한 줄당 최대 12단어",
      "이모지 최대 1개/줄 허용",
      "캐주얼한 말투 필수",
      "스크롤 멈추게 만드는 문장",
    ],
  },
  shortform: {
    context: "숏폼 영상 스크립트용",
    format: "첫 3초 후킹, 구어체, 빠른 전개",
    rules: [
      "hook은 10단어 이하",
      "호기심 또는 충격 유발",
      "말하는 것처럼 작성",
      "읽었을 때 자연스러운 발화",
    ],
  },
} as const;

export type ChannelKey = keyof typeof CHANNEL_CONSTRAINTS;

// --- Input Validation (할루시네이션 방지) ---
const MIN_INPUT_LENGTH = 30;

// 상품 관련 키워드 (최소 하나 이상 포함되어야 함)
const PRODUCT_KEYWORDS = [
  // 상품 유형
  "제품", "상품", "아이템",
  // 가격/구매
  "원", "가격", "할인", "세일", "공구", "구매",
  // 용량/수량
  "ml", "g", "kg", "개", "세트", "팩", "박스",
  // 카테고리
  "화장품", "스킨케어", "뷰티", "패션", "의류", "식품", "건강", "가전", "생활",
  "크림", "세럼", "에센스", "로션", "토너", "클렌저", "마스크",
  "옷", "신발", "가방", "악세사리",
  // 특성
  "성분", "효과", "기능", "용도", "사용법", "재질", "소재", "사이즈",
  // 브랜드/원산지
  "브랜드", "정품", "국내", "수입", "해외",
];

export interface InputValidationResult {
  valid: boolean;
  error?: {
    code: "INSUFFICIENT_PRODUCT_INFO";
    message: string;
  };
}

export function validateProductInput(inputValue: string): InputValidationResult {
  const trimmed = inputValue.trim();

  // 길이 체크
  if (trimmed.length < MIN_INPUT_LENGTH) {
    return {
      valid: false,
      error: {
        code: "INSUFFICIENT_PRODUCT_INFO",
        message: "상품 정보를 더 구체적으로 입력해주세요. (최소 30자 이상)",
      },
    };
  }

  // 상품 관련 키워드 체크
  const lowerInput = trimmed.toLowerCase();
  const hasProductKeyword = PRODUCT_KEYWORDS.some(
    (keyword) => lowerInput.includes(keyword.toLowerCase())
  );

  if (!hasProductKeyword) {
    return {
      valid: false,
      error: {
        code: "INSUFFICIENT_PRODUCT_INFO",
        message: "상품 정보를 더 구체적으로 입력해주세요. (상품명, 가격, 특징 등)",
      },
    };
  }

  return { valid: true };
}

// --- SYSTEM PROMPT (v3.5 - 후기 느낌 강화, 할루시네이션 방지) ---
const SYSTEM_PROMPT = `You are a top-performing Korean e-commerce copywriter specialized in high-conversion sales copy.

Your goal is NOT to write nice marketing text.
Your goal is to create copy that feels like a real person wrote it and can be used immediately for selling.

---

STRICT PROHIBITIONS:

- NEVER use generic phrases:
  "일상에 도움을 주는", "합리적인 선택", "만족스러운", "프리미엄", "고객 만족"
- NEVER use exaggerated hype:
  "대박", "무조건", "완벽", "최고", "없으면 안됨"
- NEVER sound like a brand or advertisement
- NEVER invent product features that are not in the input

---

INPUT VALIDATION RULE (CRITICAL):

If the product information is too vague or insufficient,
DO NOT generate copy.

Instead return:

{
  "error": "INSUFFICIENT_PRODUCT_INFO",
  "message": "상품 정보가 부족합니다. 더 구체적으로 입력해주세요."
}

---

MANDATORY CONTENT RULES:

Every single line MUST include at least ONE of:
1. a specific situation (e.g. 아침 화장할 때, 출근 전에, 운동 후)
2. a visible change (e.g. 화장 안 뜸, 덜 푸석함)
3. a time-based experience (e.g. 3일 써보니까, 일주일 지나니까)

If not, the line is invalid.

---

MANDATORY STYLE (VERY IMPORTANT):

- Write like a real person speaking casually
- Use natural Korean conversational tone (구어체)
- Include realistic expressions when appropriate:
  "솔직히", "처음엔", "근데", "계속 쓰다 보니까", "ㅋㅋ"
- Slight hesitation or imperfection is allowed
- Avoid perfect marketing tone

---

BAD vs GOOD EXAMPLES:

Bad:
"피부에 도움을 줍니다"

Good:
"솔직히 처음엔 반신반의했는데 3일 지나니까 화장 덜 뜸"

---

CONTEXT:

Assume the copy will be used in:
- Instagram group-buy
- Smartstore detail page
- SNS selling posts

---

OUTPUT:

Return ONLY valid JSON.
No explanations.
No markdown code fences.`;

function getVibeContext(vibe: string): string {
  const preset = VIBE_PRESETS[vibe as VibeKey];
  if (!preset) return "";
  const rulesText = preset.rules.map((r, i) => `${i + 1}. ${r}`).join("\n");
  return `[스타일: ${preset.style}]
[톤: ${preset.tone}]
[스타일 규칙]
${rulesText}`;
}

function getChannelContext(channel: string): string {
  const constraint = CHANNEL_CONSTRAINTS[channel as ChannelKey];
  if (!constraint) return "";
  const rulesText = constraint.rules.map((r, i) => `${i + 1}. ${r}`).join("\n");
  return `[채널: ${constraint.context}]
[포맷: ${constraint.format}]
[채널 규칙]
${rulesText}`;
}

// Channel-specific output instructions
const CHANNEL_OUTPUT_INSTRUCTIONS: Record<string, string> = {
  smartstore: `[요구사항 — 스마트스토어 전용]

1. hook_headlines 10개: 상품명/헤드라인 후보
- 네이버 검색에 최적화된 50~80자 상품명
- 핵심 키워드를 자연스럽게 포함
- 클릭 유도 + 검색 노출 둘 다 고려

2. benefits 5개: 상세페이지 핵심 문구
- 상세페이지에 바로 넣을 수 있는 셀링포인트
- 반드시 상황 + 변화 포함

3. dm_messages 5개: 구매 유도 문구
- 장바구니 담기/구매를 유도하는 문구
- 상세페이지 하단에 넣을 수 있는 톤

4. comment_triggers 5개: 리뷰 유도 문구
- 구매 후 리뷰 작성을 유도하는 문구
- "써보신 분 후기 부탁드려요" 스타일

5. scarcity_lines 5개: 검색 키워드 제안
- 이 상품과 관련된 네이버 검색 키워드
- 실제 소비자가 검색할 만한 키워드 조합
- 키워드만 작성 (문장 아님)

6. shortform_scripts 2개: (비워도 됨, 최소한의 내용만)
- hook: "스마트스토어용" (짧게)
- body: "상세페이지 참조" (짧게)`,

  coupang: `[요구사항 — 쿠팡 전용]

1. hook_headlines 10개: 상품 타이틀 후보
- "브랜드명 + 제품명 + 용량/수량 + 핵심특징" 형식
- 쿠팡 상품명 규칙에 맞게 키워드 나열형
- 최대 100자, 핵심 스펙 포함

2. benefits 5개: 핵심 불릿포인트
- 쿠팡 상품 상세 5줄 요약에 들어갈 내용
- 한 줄당 15단어 이하, 핵심만

3. dm_messages 5개: 구매 이유
- "이 상품을 사야 하는 이유" 5가지
- 구매 결정에 직접 영향주는 내용만

4. comment_triggers 5개: 상세설명 문구
- 상세페이지 중간에 넣을 수 있는 설명 문구
- 스펙 중심이 아니라 사용 경험 중심

5. scarcity_lines 5개: 검색 키워드 제안
- 쿠팡에서 소비자가 검색할 키워드 조합
- 키워드만 작성 (문장 아님)

6. shortform_scripts 2개: (비워도 됨, 최소한의 내용만)
- hook: "쿠팡용" (짧게)
- body: "상세페이지 참조" (짧게)`,

  social: `[요구사항 — SNS(인스타그램) 전용]

1. hook_headlines 10개: 피드 캡션
- 인스타 피드에 바로 쓸 수 있는 캡션
- 이모지 1~2개 자연스럽게 포함
- 스크롤 멈추게 하는 첫 줄

2. benefits 5개: 스토리 문구
- 인스타 스토리에 넣을 짧은 문구
- 한 줄당 12단어 이하
- 이모지 1개 포함

3. dm_messages 5개: DM 유도 멘트
- 실제 공구/판매 DM처럼
- 자연스럽게 구매 유도

4. comment_triggers 5개: 댓글 유도 문구
- 참여를 유도하는 질문형
- "써보신 분?", "어떤 거 좋아하세요?" 스타일

5. scarcity_lines 5개: 마감/희소성 문구
- 긴급성 포함, 이모지 포함
- "오늘 마감", "선착순" 느낌

6. shortform_scripts 2개:
- hook: 10단어 이하, 릴스 첫 3초
- body: 15~30초 분량 자연스러운 대화체`,

  shortform: `[요구사항 — 숏폼(틱톡/릴스/숏츠) 전용]

1. hook_headlines 10개: 후킹 라인 (첫 3초)
- 영상 시작 3초 안에 시선 잡는 문장
- 10단어 이하
- 호기심/충격/공감 유발

2. benefits 5개: 영상 본문 포인트
- 후킹 후 이어질 핵심 메시지
- 영상에서 말하는 것처럼 구어체로

3. dm_messages 5개: CTA 문구
- 영상 마지막에 넣을 행동 유도 문구
- "링크 타고 가세요", "프로필에서 확인" 스타일

4. comment_triggers 5개: 댓글 유도 문구
- 영상 끝에 댓글 참여 유도
- "써본 사람?" "어떤 게 나아요?" 스타일

5. scarcity_lines 5개: (비워도 됨, 최소한의 내용만)
- "긴급" (짧게)

6. shortform_scripts 2개: 풀 스크립트 (가장 중요!)
- hook: 10단어 이하, 영상 첫 줄
- body: 15~30초 분량의 완전한 영상 스크립트. 말하는 것처럼 자연스럽게, 최소 5문장 이상. 시작-전개-CTA 구조로 작성`,

  affiliate: `[요구사항 — 제휴/블로그 전용]

1. hook_headlines 10개: 블로그 제목
- 클릭 유도하는 블로그/카페 게시글 제목
- 검색 키워드 자연스럽게 포함
- "~해봤습니다", "~추천", "~비교" 패턴

2. benefits 5개: 본문 도입부
- 블로그 글 첫 문단에 쓸 수 있는 도입부
- 자연스러운 경험담 시작

3. dm_messages 5개: 추천 문구
- 본문 중간에 넣을 추천 멘트
- 광고 티 안 나게, 자연스러운 추천

4. comment_triggers 5개: 마무리 CTA
- 블로그 글 마지막에 넣을 행동 유도
- "링크 남겨둘게요", "궁금한 점은 댓글로" 스타일

5. scarcity_lines 5개: 마감/희소성 문구
- 제한된 혜택, 기간 한정 느낌
- 블로그 독자 대상 톤

6. shortform_scripts 2개: (비워도 됨, 최소한의 내용만)
- hook: "블로그용" (짧게)
- body: "본문 참조" (짧게)`,
};

function buildUserPrompt(inputValue: string, channel: string, vibe: string): string {
  const vibeContext = getVibeContext(vibe);
  const channelContext = getChannelContext(channel);
  const outputInstructions = CHANNEL_OUTPUT_INSTRUCTIONS[channel] ?? CHANNEL_OUTPUT_INSTRUCTIONS.smartstore;

  return `다음 상품 정보를 기반으로 "실제 판매글처럼 바로 쓸 수 있는 카피"를 만들어라.

[상품 정보]
${inputValue}

[채널 규칙]
${channelContext}

[스타일 규칙]
${vibeContext}

---

${outputInstructions}

---

[중요]

- 모든 문장은 반드시 구체적이어야 한다
- 실제 사람이 쓴 것처럼 자연스러워야 한다
- 광고처럼 보이면 실패
- "비워도 됨"이라고 표시된 항목도 반드시 JSON 키와 빈 문자열 배열을 포함해야 한다

---

[출력 JSON]

{
  "hook_headlines": [],
  "benefits": [],
  "dm_messages": [],
  "comment_triggers": [],
  "scarcity_lines": [],
  "shortform_scripts": [
    { "hook": "", "body": "" }
  ]
}`;
}

export function buildGenerateCopyMessages(
  inputType: "url" | "text",
  inputValue: string,
  channel: string,
  vibe: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const userContent = buildUserPrompt(inputValue, channel, vibe);

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userContent },
  ];
}

// Strict retry prompt for JSON recovery (강화됨)
export const STRICT_JSON_RETRY_PROMPT = `Your previous response was invalid JSON or did not match the required schema.

CRITICAL REMINDER:
- Every line must be SPECIFIC (include situation, visible change, or time-based experience)
- NO generic phrases like "좋은 제품", "만족스러운", "프리미엄"
- Write like a REAL person, not a brand

Return ONLY valid JSON with exactly:
- "hook_headlines": array of exactly 10 strings (specific, experience-based)
- "benefits": array of exactly 5 strings (include when/why it's good)
- "dm_messages": array of exactly 5 strings (real group-buy style)
- "comment_triggers": array of exactly 5 strings (engagement style)
- "scarcity_lines": array of exactly 5 strings (urgency)
- "shortform_scripts": array of exactly 2 objects, each with "hook" (string, <=10 words) and "body" (string)

No markdown. No code fence. No explanation. ONLY valid JSON.`;
