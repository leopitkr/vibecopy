import Link from "next/link";

export default function GuidePage() {
  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
          VibeCopy 사용 가이드
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          URL 또는 상품 정보만 넣으면 판매 카피 패키지를 한 번에 만듭니다.
        </p>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            이렇게 입력하세요
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                URL 입력 예시
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                스마트스토어·쿠팡 등 상품 상세 URL을 그대로 붙여넣으면 됩니다.
                예: https://smartstore.naver.com/...
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-800 dark:text-gray-200">
                상품 특징 5줄 작성 예시
              </h3>
              <ul className="mt-1 list-inside list-disc text-sm text-gray-600 dark:text-gray-400">
                <li>상품명: 예) 무선 이어폰 Pro 3</li>
                <li>특징 1~5: 핵심 스펙·혜택을 한 줄씩 (예: 40시간 재생, 노이즈캔슬링)</li>
                <li>가격·타겟: 선택 입력 (예: 59,000원, 20~30대)</li>
              </ul>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
              <h3 className="text-sm font-medium text-amber-800 dark:text-amber-200">
                잘못된 입력 vs 좋은 입력
              </h3>
              <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                <strong>피하기:</strong> 너무 짧은 한 단어만, 또는 1,000자 초과.
                <br />
                <strong>추천:</strong> 상품의 차별점·혜택을 3~10줄 정도로 요약 (1,000자 이내).
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            채널 선택 가이드
          </h2>
          <ul className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li>
              <strong>스마트스토어</strong> → 상세페이지형. 구매 전 읽는 긴 문구에 맞춤.
            </li>
            <li>
              <strong>쿠팡</strong> → 검색 친화형. 키워드·검색 노출을 고려한 문구.
            </li>
            <li>
              <strong>공동구매</strong> → 마감/한정 강조. 수량·기한·선착순 톤.
            </li>
            <li>
              <strong>숏폼</strong> → 짧고 강한 후킹. 15초 안에 끌어당기는 문장.
            </li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            바이브 설명
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            생성 톤을 선택하면 그에 맞는 카피가 나옵니다.
          </p>
          <ul className="mt-4 space-y-3 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>신뢰형</strong> — 사실·스펙 중심, 신뢰감 있는 설명.</li>
            <li><strong>후기형</strong> — 리뷰·사용 후기 느낌의 설득.</li>
            <li><strong>자극형</strong> — 한정·할인·FOMO를 살린 유도.</li>
            <li><strong>프리미엄형</strong> — 고급감·품질 강조.</li>
            <li><strong>공구특화</strong> — 공동구매·단체 구매에 맞는 멘트.</li>
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            리스크 체크란?
          </h2>
          <p className="mt-4 text-sm text-gray-700 dark:text-gray-300">
            생성 결과 하단의 <strong>리스크 체크</strong>는 광고·상세 문구에서 주의해야 할 표현을 표시합니다.
            과장·허위·금칙어에 가까운 문구가 있으면 수준(낮음/중간/높음)과 함께 안내하므로,
            그대로 사용하기 전에 한 번씩 확인하고 수정해 주세요.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            크레딧 정책
          </h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <li><strong>Free</strong> — 하루 3회 생성 제한.</li>
            <li><strong>Standard</strong> — 월 500 크레딧 (결제일 기준 리셋).</li>
            <li><strong>Pro</strong> — 무제한 생성.</li>
          </ul>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            자세한 요금은 <Link href="/pricing" className="underline focus:ring-2 focus:ring-blue-500">요금제</Link>에서 확인하세요.
          </p>
        </section>

        <section className="mt-12 rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            지금 카피 생성하러 가기
          </h2>
          <Link
            href="/generate"
            className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            지금 카피 생성하러 가기
          </Link>
        </section>

        <p className="mt-10 text-center text-sm text-gray-500 dark:text-gray-400">
          <Link href="/" className="underline focus:ring-2 focus:ring-blue-500">
            홈으로
          </Link>
        </p>
      </div>
    </main>
  );
}
