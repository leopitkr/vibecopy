import Link from "next/link";

const PAIN_POINTS = [
  "상세페이지 문구 작성이 오래 걸림",
  "숏폼 대본 제작이 번거로움",
  "매번 카피를 새로 고민해야 함",
  "ChatGPT는 범용적이라 결과가 들쭉날쭉",
];

const EXAMPLE_HEADLINES = [
  "이 가격에 이 스펙? 1+1 기대하시는 분만",
  "오늘만 30% 추가 할인, 재고 소진 시 종료",
  "리뷰 2만 개 돌파, 셀러 인증 상품",
];

const EXAMPLE_CTAS = [
  "지금 구매하고 리뷰 작성 시 2천 원 적립",
  "장바구니 담고 쿠폰 받기",
];

const FAQ_ITEMS = [
  {
    q: "무료는 정말 3회만 사용할 수 있나요?",
    a: "네. 무료 플랜은 하루 3회까지 생성할 수 있습니다. 더 많이 쓰시려면 Standard(월 19,000원) 또는 Pro(월 49,000원) 요금제를 이용해 주세요.",
  },
  {
    q: "크레딧은 언제 리셋되나요?",
    a: "Standard·Pro 플랜의 크레딧은 매월 결제일 기준으로 리셋됩니다. 무료 플랜은 매일 자정에 일 3회 한도가 리셋됩니다.",
  },
  {
    q: "생성 결과는 저장되나요?",
    a: "네. 생성한 카피 패키지는 히스토리에서 언제든 다시 볼 수 있고, 재생성·복사 버튼으로 재활용할 수 있습니다.",
  },
  {
    q: "결제는 안전한가요?",
    a: "Stripe를 통해 결제를 처리하며, 카드 정보는 저장하지 않습니다. 정기 결제는 언제든 해지할 수 있습니다.",
  },
  {
    q: "어떤 채널을 지원하나요?",
    a: "스마트스토어, 쿠팡, 제휴마케팅, SNS, 숏폼 등 채널별로 맞춤 톤으로 생성됩니다.",
  },
  {
    q: "입력은 어떻게 하나요?",
    a: "상품 URL만 넣거나, 상품명·특징·가격·타겟을 직접 입력하면 됩니다. 1,000자 이내로 요약해 주시면 좋습니다.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero */}
      <header className="border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              VibeCopy
            </span>
            <nav className="flex gap-4">
              <Link
                href="/pricing"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                요금제
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                로그인
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl md:text-5xl">
            URL만 넣으면 바로 팔리는 카피 세트 완성
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 sm:text-xl">
            스마트스토어 · 쿠팡 · 공동구매 셀러 전용 AI 카피 생성기
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/generate"
              className="w-full rounded-lg bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
            >
              지금 무료로 3회 사용하기
            </Link>
            <Link
              href="/pricing"
              className="w-full rounded-lg border border-gray-300 bg-white px-6 py-3 text-base font-semibold text-gray-700 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 sm:w-auto"
            >
              요금제 보기
            </Link>
          </div>
        </section>

        {/* Problem */}
        <section className="border-t border-gray-200 bg-gray-50/50 py-16 dark:border-gray-800 dark:bg-gray-900/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              이런 고민 있으시죠?
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {PAIN_POINTS.map((point, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <span className="text-red-500 dark:text-red-400">×</span>
                  <span className="text-gray-700 dark:text-gray-300">
                    {point}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
              URL 또는 상품 정보만 입력하면 → 즉시 판매 가능한 카피 패키지 생성
            </p>
          </div>
        </section>

        {/* Result Example */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              이렇게 나와요
            </h2>
            <p className="mt-2 text-center text-gray-600 dark:text-gray-400">
              헤드라인, 베네핏, 숏폼 대본, CTA까지 한 번에
            </p>
            <div className="mx-auto mt-8 max-w-2xl space-y-4">
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  헤드라인 예시
                </h3>
                <ul className="list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {EXAMPLE_HEADLINES.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <h3 className="mb-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                  CTA 예시
                </h3>
                <ul className="list-inside list-decimal space-y-1 text-sm text-gray-700 dark:text-gray-300">
                  {EXAMPLE_CTAS.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/generate"
                className="inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
              >
                직접 생성해 보기
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Preview */}
        <section className="border-t border-gray-200 bg-gray-50/50 py-16 dark:border-gray-800 dark:bg-gray-900/30">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              요금제
            </h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Free
                </h3>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  0원
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  일 3회 생성
                </p>
                <ul className="mt-4 list-inside list-disc text-sm text-gray-600 dark:text-gray-300">
                  <li>기본 바이브 사용</li>
                  <li>생성 기록 저장</li>
                </ul>
                <Link
                  href="/generate"
                  className="mt-6 block w-full rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  시작하기
                </Link>
              </div>
              <div className="rounded-xl border-2 border-blue-500 bg-white p-6 shadow-sm dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Standard
                </h3>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  19,000원<span className="text-sm font-normal text-gray-500">/월</span>
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  월 500 크레딧
                </p>
                <ul className="mt-4 list-inside list-disc text-sm text-gray-600 dark:text-gray-300">
                  <li>전체 바이브 사용</li>
                  <li>히스토리 저장</li>
                </ul>
                <Link
                  href="/pricing"
                  className="mt-6 block w-full rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
                >
                  요금제 보기
                </Link>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Pro
                </h3>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  49,000원<span className="text-sm font-normal text-gray-500">/월</span>
                </p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  무제한 생성
                </p>
                <ul className="mt-4 list-inside list-disc text-sm text-gray-600 dark:text-gray-300">
                  <li>브랜드 보이스 저장</li>
                  <li>CSV 다운로드</li>
                </ul>
                <Link
                  href="/pricing"
                  className="mt-6 block w-full rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  요금제 보기
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <h2 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
              자주 묻는 질문
            </h2>
            <dl className="mt-8 space-y-6">
              {FAQ_ITEMS.map((item, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800"
                >
                  <dt className="font-semibold text-gray-900 dark:text-white">
                    {item.q}
                  </dt>
                  <dd className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {item.a}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        {/* Final CTA */}
        <section className="border-t border-gray-200 bg-blue-600 py-16 dark:border-gray-800">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
            <h2 className="text-2xl font-bold text-white">
              지금 바로 카피 패키지를 만들어 보세요
            </h2>
            <p className="mt-2 text-blue-100">
              가입 후 무료 3회 생성 가능
            </p>
            <Link
              href="/generate"
              className="mt-8 inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-blue-600 shadow-sm transition hover:bg-blue-50"
            >
              무료로 시작하기
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-200 py-8 dark:border-gray-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              © VibeCopy. 셀러 전용 AI 카피 생성기.
            </span>
            <div className="flex flex-wrap items-center justify-center gap-6">
              <Link
                href="/pricing"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                요금제
              </Link>
              <Link
                href="/feedback"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                피드백 보내기
              </Link>
              <Link
                href="/login"
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                로그인
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
