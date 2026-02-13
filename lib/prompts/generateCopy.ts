import type OpenAI from "openai";

/**
 * Prompt for strict JSON copy generation (Korean e-commerce).
 * Response must match the schema: headlines[10], benefits[5], shortform_scripts[2], ctas[5], risk_check.
 */

const RESPONSE_SCHEMA_DESC = `
You must respond with ONLY a single JSON object (no markdown, no code fence) with exactly these keys:
- "headlines": array of exactly 10 strings (ad headlines)
- "benefits": array of exactly 5 strings (product benefits)
- "shortform_scripts": array of exactly 2 objects, each with "hook" (string) and "script" (string)
- "ctas": array of exactly 5 strings (call-to-action phrases)
- "risk_check": object with "level" (one of "low", "medium", "high"), "flags" (array of strings), "notes" (array of strings)
`;

// --- Vibe presets (tone, length, taboo handling, CTA style) ---
export const VIBE_PRESETS = {
  trust: {
    tone: "Factual, expert, reassuring. Use evidence and clear benefits.",
    length: "Medium; benefit-led, no hype.",
    tabooHandling:
      "Avoid 최고/1등/완벽/100%. Prefer 도움/개선/경험. No false guarantees.",
    ctaStyle: "Soft: 자세히 보기, 검토해 보세요, 알아보기.",
  },
  review: {
    tone: "Social proof, other users' experience. Review-oriented language.",
    length: "Short quotes and stats-friendly; easy to pair with review snippets.",
    tabooHandling:
      "No fake review language. Use 후기 기반, 사용자 경험 only when implied.",
    ctaStyle: "후기 확인하기, 리뷰 보기, 실제 후기 보기.",
  },
  impulse: {
    tone: "Urgent, scarcity, FOMO. Time- or quantity-limited feel.",
    length: "Short and punchy; high impact per line.",
    tabooHandling:
      "No false scarcity. 한정/기회/마감 only when clearly justified.",
    ctaStyle: "지금 보기, 바로 가기, 지금 확인하기.",
  },
  premium: {
    tone: "Refined, brand-focused, quality over price.",
    length: "Longer, polished phrases; emphasize value and experience.",
    tabooHandling:
      "No 가성비/저가 emphasis. Focus on quality, craftsmanship, experience.",
    ctaStyle: "경험하기, 만나보기, 더 알아보기.",
  },
  groupbuy: {
    tone: "Community, together, special deal. Group/deal focused.",
    length: "Deal-focused; clear discount or group benefit.",
    tabooHandling:
      "No 무조건/무한. Specify quantity or period when relevant.",
    ctaStyle: "참여하기, 특가 보기, 함께하기.",
  },
} as const;

export type VibeKey = keyof typeof VIBE_PRESETS;

// --- Channel constraints (headline length, format, other) ---
export const CHANNEL_CONSTRAINTS = {
  smartstore: {
    headlineLength: "About 50–80 characters; Naver-friendly. One-line summary.",
    format:
      "Product name and keyword friendly; bullet-style benefits acceptable.",
    other: "Comply with Naver ad policies; avoid platform-prohibited phrases.",
  },
  coupang: {
    headlineLength: "Match Coupang display rules; keyword-rich title length.",
    format:
      "Rocket delivery / Rocket Wow style phrases allowed where relevant.",
    other: "Follow Coupang seller guidelines.",
  },
  affiliate: {
    headlineLength: "Blog/cafe friendly; click-inducing title.",
    format:
      "Subheadings and list structure; natural sentence flow for long-form.",
    other: "No keyword stuffing; focus on genuine appeal and clarity.",
  },
  social: {
    headlineLength: "Short catchphrase; emoji/hashtag allowed where natural.",
    format: "Feed/story style; 1–2 sentences.",
    other: "Avoid overstated claims; align with general SNS ad norms.",
  },
  shortform: {
    headlineLength: "Hook in first 3–5 seconds; short script sentences.",
    format: "hook + script; spoken, conversational Korean.",
    other: "Avoid prohibited claims; tone suitable for short-form video.",
  },
} as const;

export type ChannelKey = keyof typeof CHANNEL_CONSTRAINTS;

// --- Risk check policy (instruct model to self-assess) ---
const RISK_CHECK_POLICY = `
risk_check: You must self-assess the generated copy.
- Exaggerated claims: flag 최고/1등/완벽/100%, 치료/완치, 무조건/무한/절대.
- Medical/health claims: flag disease cure/prevention/improvement or efficacy guarantees (especially for food/cosmetics).
- Prohibited phrases: flag any platform or legal prohibited terms.
Set "level" to "low" (none), "medium" (minor fixes suggested), or "high" (must fix). Put specific issues in "flags" and brief fix suggestions in "notes".
`;

function getVibePreset(vibe: string): (typeof VIBE_PRESETS)[VibeKey] | null {
  if (vibe in VIBE_PRESETS) return VIBE_PRESETS[vibe as VibeKey];
  return null;
}

function getChannelConstraint(
  channel: string
): (typeof CHANNEL_CONSTRAINTS)[ChannelKey] | null {
  if (channel in CHANNEL_CONSTRAINTS)
    return CHANNEL_CONSTRAINTS[channel as ChannelKey];
  return null;
}

function buildSystemContent(channel: string, vibe: string): string {
  const role =
    "You are a Korean e-commerce copywriter. Generate marketing copy in Korean. Output only valid JSON; no markdown or code fence.";
  const channelBlock = getChannelConstraint(channel);
  const channelText = channelBlock
    ? `\nChannel "${channel}" rules:\n- Headline/length: ${channelBlock.headlineLength}\n- Format: ${channelBlock.format}\n- Other: ${channelBlock.other}`
    : `\nChannel: ${channel}. Follow platform-appropriate length and format.`;
  const vibeBlock = getVibePreset(vibe);
  const vibeText = vibeBlock
    ? `\nVibe "${vibe}" preset:\n- Tone: ${vibeBlock.tone}\n- Length: ${vibeBlock.length}\n- Taboo: ${vibeBlock.tabooHandling}\n- CTA style: ${vibeBlock.ctaStyle}`
    : `\nVibe: ${vibe}. Use clear, compliant copy.`;
  return [
    role,
    RESPONSE_SCHEMA_DESC.trim(),
    channelText,
    vibeText,
    RISK_CHECK_POLICY.trim(),
  ].join("\n");
}

function buildUserContent(
  inputType: "url" | "text",
  inputValue: string,
  channel: string,
  vibe: string
): string {
  const inputLabel = inputType === "url" ? "Product/source URL or context" : "Product/input text";
  return [
    `Channel: ${channel}. Vibe: ${vibe}.`,
    `${inputLabel}:`,
    inputValue,
  ].join("\n");
}

export function buildGenerateCopyMessages(
  inputType: "url" | "text",
  inputValue: string,
  channel: string,
  vibe: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  const systemContent = buildSystemContent(channel, vibe);
  const userContent = buildUserContent(inputType, inputValue, channel, vibe);
  return [
    { role: "system", content: systemContent },
    { role: "user", content: userContent },
  ];
}
