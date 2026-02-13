import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VibeCopy — URL만 넣으면 바로 팔리는 카피 세트",
  description:
    "스마트스토어·쿠팡·공동구매 셀러 전용 AI 카피 생성기. 상품 URL 또는 설명만 입력하면 후킹 헤드라인, 베네핏, 숏폼 대본, CTA까지 한 번에 완성.",
  openGraph: {
    title: "VibeCopy — URL만 넣으면 바로 팔리는 카피 세트",
    description:
      "스마트스토어·쿠팡·공동구매 셀러 전용 AI 카피 생성기. 상품 URL 또는 설명만 입력하면 판매 카피 패키지를 즉시 생성.",
    type: "website",
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <>{children}</>;
}
