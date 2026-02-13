import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
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

  const { data: row, error } = await supabase
    .from("generations")
    .select("id, created_at, channel, vibe, input_type, input_value, output_json")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !row) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Generation not found" } },
      { status: 404 }
    );
  }

  const r = row as {
    id: string;
    created_at: string;
    channel: string;
    vibe: string;
    input_type: string;
    input_value: string;
    output_json: unknown;
  };
  return NextResponse.json({
    ok: true,
    data: {
      id: r.id,
      created_at: r.created_at,
      channel: r.channel,
      vibe: r.vibe,
      input_type: r.input_type,
      input_value: r.input_value,
      output: r.output_json,
    },
  });
}
