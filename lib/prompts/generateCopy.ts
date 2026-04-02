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

function buildUserPrompt(inputValue: string, channel: string, vibe: string): string {
  const vibeContext = getVibeContext(vibe);
  const channelContext = getChannelContext(channel);

  return `다음 상품 정보를 기반으로 "실제 판매글처럼 바로 쓸 수 있는 카피"를 만들어라.

[상품 정보]
${inputValue}

[채널 규칙]
${channelContext}

[스타일 규칙]
${vibeContext}

---

[요구사항]

1. 후킹 헤드라인 10개
- 반드시 클릭 유도
- 경험 기반 문장
- 최대 15단어

2. 핵심 베네핏 5개
- 기능 설명 금지
- 반드시 상황 + 변화 포함

3. DM 유도 멘트 5개
- 실제 공구 상황처럼
- 자연스럽게 구매 유도

4. 댓글 유도 멘트 5개
- 참여 유도
- 실제 후기 느낌

5. 마감/희소성 문구 5개
- 긴급성 포함
- 현실적인 톤

6. 숏폼 스크립트 2개
- hook: 10단어 이하
- body: 짧고 구어체

---

[중요]

- 모든 문장은 반드시 구체적이어야 한다
- 실제 사람이 쓴 것처럼 자연스러워야 한다
- 광고처럼 보이면 실패

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
