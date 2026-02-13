import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

export default async function MePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return (
      <main className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">RLS test</h1>
        <p className="mt-2 text-gray-600">Not logged in.</p>
        <Link href="/login" className="mt-4 inline-block text-blue-600 underline">
          Log in
        </Link>
      </main>
    );
  }
  let profile: { id: string; email: string | null; plan: string; credit_balance: number } | null = null;
  let error: Error | null = null;
  let result = await supabase
    .from("users")
    .select("id, email, plan, credit_balance")
    .eq("id", user.id)
    .single();
  profile = result.data;
  error = result.error;

  // If no row (e.g. user signed up before trigger existed), create it and retry
  if (error && (result.error?.code === "PGRST116" || result.error?.message?.includes("single JSON object"))) {
    await supabase.from("users").insert({ id: user.id, email: user.email ?? undefined }).select().single();
    result = await supabase
      .from("users")
      .select("id, email, plan, credit_balance")
      .eq("id", user.id)
      .single();
    profile = result.data;
    error = result.error;
  }

  if (error || !profile) {
    return (
      <main className="p-8 max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900">RLS test</h1>
        <p className="mt-2 text-red-600">Error loading profile: {error?.message ?? "Unknown"}</p>
        <p className="mt-2 text-gray-600 text-sm">
          Ensure the auth trigger created your public.users row (sign up first).
        </p>
        <SignOutButton />
      </main>
    );
  }
  return (
    <main className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-900">RLS test</h1>
      <p className="mt-2 text-green-700 font-medium">Logged in. Your public.users row:</p>
      <dl className="mt-4 space-y-2 text-gray-700">
        <dt className="font-medium">id</dt>
        <dd className="font-mono text-sm break-all">{profile.id}</dd>
        <dt className="font-medium">email</dt>
        <dd>{profile.email ?? "—"}</dd>
        <dt className="font-medium">plan</dt>
        <dd>{profile.plan}</dd>
        <dt className="font-medium">credit_balance</dt>
        <dd>{profile.credit_balance}</dd>
      </dl>
      <SignOutButton />
    </main>
  );
}
