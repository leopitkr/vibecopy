import { GeneratePageClient } from "@/components/GeneratePageClient";

/*
 * Manual test steps:
 * (UI-1) Authenticated user with credits >0 can generate and sees results
 * (UI-2) Free user on 4th generation -> API returns 429; UI shows upgrade modal
 * (UI-3) Network / AI failure -> shows error and retry button; retry reuses idempotencyKey and does not double-charge
 * (UI-4) Copy buttons copy correct text (unit test or manual)
 * (UI-5) Loading state appears and prevents duplicate submits
 */

export default function GeneratePage() {
  return <GeneratePageClient />;
}
