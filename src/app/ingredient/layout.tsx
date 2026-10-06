import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "식재료 상세",
  description: "식재료 기한·수량·관련 요리.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
