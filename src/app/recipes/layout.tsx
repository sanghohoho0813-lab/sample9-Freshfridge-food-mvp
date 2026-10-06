import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "레시피 추천",
  description: "지금 냉장고 재료로, 급한 재료부터 쓰는 요리를 추천해요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
