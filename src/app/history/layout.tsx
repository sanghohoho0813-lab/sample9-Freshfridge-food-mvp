import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "소비 기록",
  description: "먹은 재료와 버린 재료 기록.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
