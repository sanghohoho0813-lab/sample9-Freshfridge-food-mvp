import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "절약 리포트",
  description: "버리지 않고 먹어서 아낀 금액과 낭비 패턴.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
