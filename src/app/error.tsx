"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * 화면을 그리다 예기치 못한 오류가 나면 앱 전체가 하얗게 멈추지 않고 이 화면으로 대신한다.
 * (상단 메뉴·하단 탭은 그대로 남아 다른 화면으로 이동할 수 있다)
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div
      role="alert"
      className="mx-auto flex max-w-xl animate-fade-up flex-col items-center px-2 py-10 text-center sm:py-16"
    >
      <span className="text-[52px]" aria-hidden>
        🥲
      </span>
      <h1 className="mt-3 text-[26px] font-extrabold leading-tight text-ink-900">화면을 불러오지 못했어요</h1>
      <p className="mt-2 text-[17px] text-ink-500">잠시 후 다시 시도해주세요. 저장된 재료와 기록은 그대로 있어요.</p>
      <div className="mt-7 grid w-full max-w-sm grid-cols-2 gap-2">
        <button type="button" onClick={reset} className="btn-primary min-h-[52px]">
          다시 시도
        </button>
        <Link href="/" className="btn-ghost min-h-[52px]">
          홈으로
        </Link>
      </div>
    </div>
  );
}
