import Link from "next/link";
import { GenerationsList } from "@/components/GenerationsList";

/*
 * Manual test steps:
 * (H-1) Create 2-3 generations in /generate
 * (H-2) /history shows them in newest-first order
 * (H-3) Open detail shows correct output sections and copy works
 * (H-4) Regenerate creates a NEW generation record and does not double-charge (new idempotency_key)
 * (H-5) /dashboard shows plan + credits and recent generations
 * (H-6) Pagination works (limit 20 + nextCursor)
 */

export default function HistoryPage() {
  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            생성 기록
          </h1>
          <Link
            href="/generate"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            새로 생성
          </Link>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
          <GenerationsList />
        </div>
        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/dashboard" className="underline focus:ring-2 focus:ring-blue-500">
            대시보드
          </Link>
          {" · "}
          <Link href="/me" className="underline focus:ring-2 focus:ring-blue-500">
            내 정보
          </Link>
        </p>
      </div>
    </main>
  );
}
