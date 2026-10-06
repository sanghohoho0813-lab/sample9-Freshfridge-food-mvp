import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "식재료 추가",
  description: "직접 입력하거나 사진으로 식재료를 등록해요.",
};

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
