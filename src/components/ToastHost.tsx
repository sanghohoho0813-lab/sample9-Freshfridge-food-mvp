"use client";

import { CircleCheck } from "lucide-react";
import { useToast, useToastList } from "@/lib/toast";

/**
 * 화면 아래쪽에 뜨는 알림 — 하단 탭·고정 행동 바, 그리고 모바일 오른쪽 아래의 공용 뒤로·앞으로 버튼을 가리지 않는 높이.
 * 되돌리기가 있는 알림은 남은 시간을 얇은 막대로 보여준다.
 */
export default function ToastHost() {
  const toasts = useToastList();
  const { dismissToast } = useToast();
  if (toasts.length === 0) return null;
  return (
    <div
      className="toast-host pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+186px)] z-[60] flex flex-col items-center gap-2 px-4 sm:bottom-[calc(env(safe-area-inset-bottom)+96px)] lg:bottom-8"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`relative flex w-full max-w-md animate-toast-in items-center gap-2.5 overflow-hidden rounded-2xl bg-ink-900 py-3 pl-4 text-[16.5px] font-medium leading-snug text-white shadow-lift lg:w-auto lg:min-w-[360px] ${
            t.action ? "pointer-events-auto pr-2" : "pr-4"
          }`}
        >
          <CircleCheck size={20} className="shrink-0 text-mint-300" aria-hidden />
          <span className="min-w-0 flex-1">{t.text}</span>
          {t.action && (
            <>
              <button
                type="button"
                onClick={() => {
                  t.action?.onClick();
                  dismissToast(t.id);
                }}
                className="ml-1 min-h-[40px] shrink-0 rounded-full px-3 text-[16.5px] font-bold text-mint-300 transition-colors hover:bg-white/10"
              >
                {t.action.label}
              </button>
              <span
                className="absolute inset-x-0 bottom-0 h-[3px] origin-left animate-toast-timer bg-mint-300/70"
                style={{ animationDuration: `${t.duration}ms` }}
                aria-hidden
              />
            </>
          )}
        </div>
      ))}
    </div>
  );
}
