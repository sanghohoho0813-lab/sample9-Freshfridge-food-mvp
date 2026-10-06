import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "검색",
  description: "식재료와 레시피를 한 번에 찾아요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
