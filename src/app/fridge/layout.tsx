import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "내 냉장고",
  description: "보관 중인 식재료를 기한이 가까운 순서로 봐요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
