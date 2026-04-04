"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    router.push("/");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="btn btn-ghost"
      style={{ marginTop: "1.5rem" }}
    >
      로그아웃
    </button>
  );
}
