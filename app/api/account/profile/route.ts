import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
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

  let body: { nickname?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const nickname = body.nickname?.trim();
  if (!nickname || nickname.length < 1 || nickname.length > 20) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "닉네임은 1~20자여야 합니다." } },
      { status: 400 }
    );
  }

  const { error } = await supabase
    .from("users")
    .update({ nickname })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json(
      { error: { code: "INTERNAL", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
