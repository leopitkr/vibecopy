import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { HISTORY_LIMITS, type PlanType } from "@/lib/constants/limits";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

export type GenerationSummary = {
  id: string;
  created_at: string;
  channel: string;
  vibe: string;
  input_preview: string;
  has_output: boolean;
};

function inputPreview(value: string, maxLen: number = 80): string {
  const s = value.trim();
  if (s.length <= maxLen) return s;
  return s.slice(0, maxLen) + "…";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not logged in" } },
      { status: 401 }
    );
  }

  // Fetch user plan for history limit
  const { data: profile } = await supabase
    .from("users")
    .select("plan")
    .eq("id", user.id)
    .single();
  const userPlan = ((profile?.plan as PlanType) || "free") as PlanType;
  const historyMax = HISTORY_LIMITS[userPlan]; // null = unlimited

  const { searchParams } = new URL(request.url);
  const requestedLimit = Math.min(
    Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
    MAX_LIMIT
  );
  const limit = historyMax ? Math.min(requestedLimit, historyMax) : requestedLimit;
  const cursor = searchParams.get("cursor"); // opaque: "created_at|id"

  // Track total items loaded (from offset param for free plan cap)
  const offset = parseInt(searchParams.get("offset") ?? "0", 10) || 0;
  const totalAfterLoad = offset + limit;
  const capReached = historyMax ? totalAfterLoad >= historyMax : false;

  let query = supabase
    .from("generations")
    .select("id, created_at, channel, vibe, input_value, output_json")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  if (cursor) {
    try {
      const [createdAt, id] = cursor.split("|");
      if (createdAt && id) {
        query = query.lt("created_at", decodeURIComponent(createdAt));
      }
    } catch {
      // ignore invalid cursor
    }
  }

  const { data: rows, error } = await query;
  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to load generations" } },
      { status: 500 }
    );
  }

  const hasMore = (rows?.length ?? 0) > limit;
  const items = (hasMore ? rows?.slice(0, limit) : rows) ?? [];
  const nextCursor =
    hasMore && items.length > 0
      ? `${encodeURIComponent((items[items.length - 1] as { created_at: string }).created_at)}|${(items[items.length - 1] as { id: string }).id}`
      : null;

  const result: GenerationSummary[] = items.map((r) => {
    const row = r as {
      id: string;
      created_at: string;
      channel: string;
      vibe: string;
      input_value: string;
      output_json: unknown;
    };
    return {
      id: row.id,
      created_at: row.created_at,
      channel: row.channel,
      vibe: row.vibe,
      input_preview: inputPreview(row.input_value),
      has_output: Boolean(row.output_json),
    };
  });

  // If free plan cap reached, suppress nextCursor to prevent further loading
  const effectiveNextCursor = capReached ? null : nextCursor;

  return NextResponse.json({
    ok: true,
    data: {
      items: result,
      nextCursor: effectiveNextCursor,
      ...(historyMax ? { historyLimit: historyMax, historyLimitReached: capReached } : {}),
    },
  });
}
