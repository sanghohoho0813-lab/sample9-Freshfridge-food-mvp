import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "우선소비",
  description: "3일 안에 기한이 끝나는 재료를 먼저 챙겨요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
