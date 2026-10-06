import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "마이페이지",
  description: "내 기록 요약과 바로가기.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
