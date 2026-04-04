import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

/** Extract og:title, meta description, and <title> from a URL. */
export async function POST(req: NextRequest) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }

  const rawUrl = (body.url ?? "").trim();
  if (!rawUrl) {
    return NextResponse.json(
      { ok: false, error: "URL을 입력해주세요." },
      { status: 400 }
    );
  }

  // Validate URL format
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return NextResponse.json(
      { ok: false, error: "올바른 URL 형식이 아닙니다." },
      { status: 400 }
    );
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    return NextResponse.json(
      { ok: false, error: "http 또는 https URL만 지원합니다." },
      { status: 400 }
    );
  }

  // Fetch the page
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(parsed.href, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; VibeCopyBot/1.0; +https://vibecopy.com)",
        Accept: "text/html",
      },
      redirect: "follow",
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, error: `페이지를 불러올 수 없습니다. (${res.status})` },
        { status: 502 }
      );
    }

    // Only accept HTML responses
    const ct = res.headers.get("content-type") ?? "";
    if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
      return NextResponse.json(
        { ok: false, error: "HTML 페이지가 아닙니다." },
        { status: 422 }
      );
    }

    // Limit read size to 512KB
    const reader = res.body?.getReader();
    if (!reader) {
      return NextResponse.json(
        { ok: false, error: "응답을 읽을 수 없습니다." },
        { status: 502 }
      );
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    const MAX_BYTES = 512 * 1024;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      totalBytes += value.length;
      if (totalBytes >= MAX_BYTES) break;
    }
    reader.cancel();
    html = new TextDecoder("utf-8").decode(
      concatUint8Arrays(chunks, totalBytes)
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.name === "AbortError"
        ? "페이지 응답이 너무 느립니다."
        : "페이지를 불러오는 중 오류가 발생했습니다.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }

  // Extract meta info with simple regex (no DOM parser needed)
  const ogTitle = extractMeta(html, "og:title");
  const ogDesc = extractMeta(html, "og:description");
  const metaDesc =
    extractMetaName(html, "description") ?? extractMetaName(html, "Description");
  const title = extractTag(html, "title");

  const finalTitle = ogTitle || title || "";
  const finalDesc = ogDesc || metaDesc || "";

  if (!finalTitle && !finalDesc) {
    return NextResponse.json({
      ok: true,
      data: { title: "", description: "", text: "" },
      warning: "메타 정보를 찾을 수 없습니다. 직접 상품 정보를 입력해주세요.",
    });
  }

  // Build a simple text for the textarea
  const parts: string[] = [];
  if (finalTitle) parts.push(finalTitle);
  if (finalDesc) parts.push(finalDesc);
  const text = parts.join("\n");

  return NextResponse.json({
    ok: true,
    data: { title: finalTitle, description: finalDesc, text },
  });
}

// ── Helpers ──

function concatUint8Arrays(chunks: Uint8Array[], total: number): Uint8Array {
  const result = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/** Extract <meta property="og:X" content="…"> */
function extractMeta(html: string, property: string): string | null {
  const re = new RegExp(
    `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const match = html.match(re);
  if (match) return decodeEntities(match[1]);
  // Try reversed attribute order
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
    "i"
  );
  const match2 = html.match(re2);
  return match2 ? decodeEntities(match2[1]) : null;
}

/** Extract <meta name="X" content="…"> */
function extractMetaName(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i"
  );
  const match = html.match(re);
  if (match) return decodeEntities(match[1]);
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
    "i"
  );
  const match2 = html.match(re2);
  return match2 ? decodeEntities(match2[1]) : null;
}

/** Extract <title>…</title> */
function extractTag(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "i");
  const match = html.match(re);
  return match ? decodeEntities(match[1].trim()) : null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'");
}
