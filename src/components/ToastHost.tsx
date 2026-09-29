"use client";

import { useStore } from "@/lib/store";

export default function ToastHost() {
  const { toasts, dismissToast } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 pb-[env(safe-area-inset-bottom)] lg:bottom-10"
      role="status"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex max-w-full animate-toast-in items-center gap-2 rounded-2xl bg-ink-900/95 py-3 pl-4 text-[16.5px] font-medium text-white shadow-lift ${
            t.action ? "pointer-events-auto pr-2" : "pr-4"
          }`}
        >
          {t.emoji && <span className="shrink-0 text-base">{t.emoji}</span>}
          <span className="min-w-0">{t.text}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action?.onClick();
                dismissToast(t.id);
              }}
              className="ml-1 shrink-0 rounded-xl px-3 py-1.5 text-[16.5px] font-bold text-mint-300 transition-colors hover:bg-white/10"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
