import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "장보기 리스트",
  description: "냉장고에 없는 재료만 골라 사요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
