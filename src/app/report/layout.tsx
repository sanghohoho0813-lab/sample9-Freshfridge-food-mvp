import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "낭비 리포트",
  description: "이번 달 버린 금액, 자주 버리는 재료와 이유, 다음 달에 줄이는 방법.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
