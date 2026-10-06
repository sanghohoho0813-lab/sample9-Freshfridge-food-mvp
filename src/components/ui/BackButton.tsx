"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/**
 * 앱 안에서 온 경우에만 브라우저 뒤로가기, 바로 들어온 경우엔 fallback 으로 이동한다.
 * (공유 링크로 상세 화면에 들어왔을 때 앱 밖으로 튕겨 나가지 않게)
 */
export default function BackButton({ fallback, label = "뒤로" }: { fallback: string; label?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => {
        const pos = (window.history.state as { __miraePos?: unknown } | null)?.__miraePos;
        const canGoBack = typeof pos === "number" ? pos > 0 : window.history.length > 1;
        if (canGoBack) router.back();
        else router.push(fallback);
      }}
      className="-ml-2 inline-flex min-h-[44px] items-center gap-1 rounded-xl px-2 text-[16.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-300/10 hover:text-ink-800"
    >
      <ArrowLeft size={20} />
      {label}
    </button>
  );
}
