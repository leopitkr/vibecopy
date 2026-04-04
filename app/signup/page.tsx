import { redirect } from "next/navigation";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { returnUrl?: string };
}) {
  const returnUrl = searchParams.returnUrl || "/generate";
  redirect(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
}
