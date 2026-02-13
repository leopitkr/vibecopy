"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="mt-6 rounded bg-gray-200 px-4 py-2 text-gray-800 font-medium hover:bg-gray-300"
    >
      Sign out
    </button>
  );
}
