"use client";

import { useEffect, type ReactNode } from "react";

/**
 * 상세 화면의 주요 행동 바.
 * 모바일에선 화면 아래에 고정되고(떠 있는 동안 하단 탭은 숨긴다), 데스크톱에선 본문 흐름 안 제자리에 놓인다.
 */
export default function StickyActionBar({ children, className = "" }: { children: ReactNode; className?: string }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("has-action-bar");
    return () => root.classList.remove("has-action-bar");
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 bg-white/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 shadow-bar backdrop-blur-md sm:px-6 lg:static lg:z-auto lg:bg-transparent lg:p-0 lg:shadow-none lg:backdrop-blur-none ${className}`}
    >
      <div className="mx-auto w-full max-w-3xl">{children}</div>
    </div>
  );
}
