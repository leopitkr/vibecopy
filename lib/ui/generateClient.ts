/**
 * Client-side fetch wrapper for POST /api/generate.
 * Maps API error contract (400/401/402/409/429/500) to a UI-friendly shape.
 */

export type Channel =
  | "smartstore"
  | "coupang"
  | "affiliate"
  | "social"
  | "shortform";
export type Vibe = "trust" | "review" | "impulse" | "premium" | "groupbuy";

export type GenerateRequestBody = {
  idempotency_key: string;
  input_type: "url" | "text";
  input_value: string;
  channel: Channel;
  vibe: Vibe;
};

export type GenerateOutput = {
  headlines: string[];
  benefits: string[];
  shortform_scripts: Array<{ hook: string; script: string }>;
  ctas: string[];
  risk_check: { level: string; flags: string[]; notes: string[] };
};

export type GenerateSuccess = {
  ok: true;
  data: {
    generationId: string;
    output: GenerateOutput;
    credits: { before: number; after: number };
  };
};

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "INPUT_TOO_LONG"
  | "UNAUTHORIZED"
  | "INSUFFICIENT_CREDITS"
  | "IDEMPOTENCY_CONFLICT"
  | "DAILY_LIMIT_EXCEEDED"
  | "RATE_LIMIT_EXCEEDED"
  | "SERVER_MISCONFIGURED"
  | "PRICE_NOT_CONFIGURED"
  | "AI_FAILED"
  | "INTERNAL";

export type GenerateError = {
  ok: false;
  error: { code: ApiErrorCode; message: string };
};

export type GenerateResponse = GenerateSuccess | GenerateError;

export async function generate(
  body: GenerateRequestBody
): Promise<GenerateResponse> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => ({}))) as
    | GenerateSuccess
    | { error?: { code?: string; message?: string } };
  if (res.ok && "data" in data && data.data) {
    return data as GenerateSuccess;
  }
  const err = "error" in data ? data.error : null;
  const code = (err?.code ?? mapStatusToCode(res.status)) as ApiErrorCode;
  const message = err?.message ?? "요청 처리 중 오류가 발생했습니다.";
  return { ok: false, error: { code, message } };
}

function mapStatusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";
    case 401:
      return "UNAUTHORIZED";
    case 402:
      return "INSUFFICIENT_CREDITS";
    case 409:
      return "IDEMPOTENCY_CONFLICT";
    case 429:
      return "DAILY_LIMIT_EXCEEDED";
    case 500:
    case 502:
      return "AI_FAILED";
    default:
      return "INTERNAL";
  }
}

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
