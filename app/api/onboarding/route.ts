import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { z } from "zod";

const onboardingSchema = z.object({
  nickname: z
    .string()
    .min(2, "닉네임은 2자 이상이어야 합니다")
    .max(20, "닉네임은 20자 이하여야 합니다")
    .regex(/^[a-zA-Z0-9가-힣_]+$/, "한글, 영문, 숫자, 밑줄만 사용할 수 있습니다"),
});

export async function POST(request: Request) {
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: firstError } },
      { status: 400 }
    );
  }

  const { nickname } = parsed.data;

  // Check nickname uniqueness
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("nickname", nickname)
    .neq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: { code: "NICKNAME_TAKEN", message: "이미 사용 중인 닉네임입니다" } },
      { status: 409 }
    );
  }

  // Use upsert to handle case where user row may not exist yet
  const { error } = await supabase
    .from("users")
    .upsert(
      {
        id: user.id,
        email: user.email ?? "",
        nickname,
        onboarding_completed: true,
      },
      { onConflict: "id" }
    );

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: "Failed to save profile" } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
