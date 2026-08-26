"use client";

import { useStore } from "@/lib/store";

export default function ToastHost() {
  const { toasts } = useStore();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 lg:bottom-10">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex animate-toast-in items-center gap-2 rounded-2xl bg-ink-900/95 px-4 py-3 text-sm font-medium text-white shadow-lift"
        >
          {t.emoji && <span className="text-base">{t.emoji}</span>}
          {t.text}
        </div>
      ))}
    </div>
  );
}
