import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const purposeEnum = z.enum(["smartstore", "coupang", "groupbuy", "shortform"]);

const bodySchema = z.object({
  purpose: purposeEnum,
  rating: z.number().int().min(1).max(5),
  good: z.string().max(2000).optional(),
  bad: z.string().max(2000).optional(),
  request: z.string().max(2000).optional(),
  email: z.string().email().max(256).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "로그인이 필요합니다." } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Request body must be JSON" } },
      { status: 400 }
    );
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const msg =
      parsed.error.issues?.map((i) => i.message).join("; ") ??
      parsed.error.message;
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: msg } },
      { status: 400 }
    );
  }

  const { purpose, rating, good, bad, request: requestText, email } =
    parsed.data;

  const { error } = await supabase.from("feedback").insert({
    user_id: user.id,
    purpose,
    rating,
    good: good ?? null,
    bad: bad ?? null,
    request: requestText ?? null,
    email: email?.trim() || null,
  });

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to save feedback" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
