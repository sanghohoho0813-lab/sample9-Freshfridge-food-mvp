import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "알림",
  description: "유통기한·추천 요리 알림.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
