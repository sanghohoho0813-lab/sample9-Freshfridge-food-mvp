"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatKoreanDate } from "@/lib/expiry-calculator";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";

export default function HistoryPage() {
  const { ready, state } = useStore();
  const [tab, setTab] = useState<"consumed" | "discarded">("consumed");

  const logs = useMemo(
    () =>
      state.logs
        .filter((l) => l.type === tab)
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date)),
    [state.logs, tab]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof logs>();
    for (const l of logs) {
      const arr = map.get(l.date) ?? [];
      arr.push(l);
      map.set(l.date, arr);
    }
    return [...map.entries()];
  }, [logs]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-up space-y-5">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">소비 기록 📒</h1>
        <p className="mt-1 text-[13.5px] text-ink-500">
          먹은 재료와 버린 재료를 한눈에 확인해요.
        </p>
      </div>

      <div className="flex gap-1.5 rounded-2xl bg-fresh-50 p-1.5">
        {(
          [
            { key: "consumed", label: "사용" },
            { key: "discarded", label: "폐기" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-xl py-2 text-[13.5px] font-bold transition-all duration-200 ${
              tab === t.key ? "bg-white text-fresh-700 shadow-soft" : "text-ink-500"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          emoji={tab === "consumed" ? "🍽️" : "🗑️"}
          title={tab === "consumed" ? "아직 사용 기록이 없어요" : "폐기 기록이 없어요"}
          description={
            tab === "consumed"
              ? "식재료를 먹으면 여기에 기록돼요."
              : "폐기 없는 냉장고, 아주 좋아요!"
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(([date, items]) => (
            <section key={date}>
              <h2 className="mb-2 text-[13px] font-bold text-ink-400">
                {formatKoreanDate(date)}
              </h2>
              <ul className="space-y-2">
                {items.map((l) => (
                  <li key={l.id} className="card flex items-center gap-3 p-3.5">
                    <span
                      className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl ${
                        l.type === "consumed" ? "bg-fresh-50" : "bg-coral-50"
                      }`}
                    >
                      {l.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-ink-900">{l.ingredientName}</p>
                      <p className="text-[11.5px] text-ink-400">
                        {l.type === "consumed"
                          ? (l.via ?? "사용 완료")
                          : (l.reason ?? "폐기")}
                      </p>
                    </div>
                    <span
                      className={`rounded-chip px-2.5 py-1 text-[11px] font-bold ${
                        l.type === "consumed"
                          ? "bg-fresh-50 text-fresh-600"
                          : "bg-coral-50 text-coral-500"
                      }`}
                    >
                      {l.type === "consumed" ? "사용 완료" : "폐기"}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
