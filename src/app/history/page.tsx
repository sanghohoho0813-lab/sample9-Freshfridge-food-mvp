"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { RECIPES, isRescue } from "@/lib/demo-data";
import { formatKoreanDate, formatWon } from "@/lib/expiry-calculator";
import { recipeImage } from "@/lib/images";
import { formatAmount } from "@/lib/quantity";
import { periodSummary, relativeDay } from "@/lib/stats";
import type { ConsumptionLog } from "@/lib/types";
import IngredientThumb from "@/components/IngredientThumb";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SkeletonList from "@/components/SkeletonList";

type Row =
  | { kind: "single"; log: ConsumptionLog }
  | { kind: "cook"; cookId: string; recipeName: string; logs: ConsumptionLog[] };

const amountText = (l: ConsumptionLog) =>
  l.amount !== undefined ? formatAmount(l.amount, l.unit ?? "") : "";

export default function HistoryPage() {
  const { ready, state } = useStore();
  const [tab, setTab] = useState<"consumed" | "discarded">("consumed");

  const summary = useMemo(() => periodSummary(state.logs, state.cooks, 0, 29), [state.logs, state.cooks]);
  const counts = useMemo(
    () => ({
      consumed: state.logs.filter((l) => l.type === "consumed").length,
      discarded: state.logs.filter((l) => l.type === "discarded").length,
    }),
    [state.logs]
  );

  // 날짜별 → 같은 요리에서 나온 기록은 한 줄로 묶기
  const grouped = useMemo(() => {
    const logs = state.logs
      .filter((l) => l.type === tab)
      .slice()
      .sort((a, b) => b.date.localeCompare(a.date));
    const byDate = new Map<string, Row[]>();
    for (const l of logs) {
      const rows = byDate.get(l.date) ?? [];
      if (l.cookId) {
        const existing = rows.find((r) => r.kind === "cook" && r.cookId === l.cookId);
        if (existing && existing.kind === "cook") existing.logs.push(l);
        else rows.push({ kind: "cook", cookId: l.cookId, recipeName: l.via ?? "요리", logs: [l] });
      } else {
        rows.push({ kind: "single", log: l });
      }
      byDate.set(l.date, rows);
    }
    return [...byDate.entries()];
  }, [state.logs, tab]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-5">
      <PageHeader
        title="소비 기록"
        description={`최근 30일 먹은 재료 ${summary.usedCount}개 · 버린 재료 ${summary.wastedCount}개`}
      />

      <div className="flex gap-1 rounded-2xl bg-ink-300/15 p-1" role="tablist" aria-label="기록 종류">
        {(
          [
            { key: "consumed", label: "먹은 기록" },
            { key: "discarded", label: "버린 기록" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl text-[17px] font-bold transition-all duration-200 ${
              tab === t.key ? "bg-white text-ink-900 shadow-soft" : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {t.label}
            <span className={`text-[14.5px] font-semibold ${tab === t.key ? "text-fresh-600" : "text-ink-400"}`}>
              {counts[t.key]}
            </span>
          </button>
        ))}
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          emoji={tab === "consumed" ? "🍽️" : "🗑️"}
          title={tab === "consumed" ? "아직 먹은 기록이 없어요" : "버린 기록이 없어요"}
          description={tab === "consumed" ? "식재료를 먹거나 요리하면 여기에 기록돼요." : "폐기 없는 냉장고, 아주 좋아요!"}
          ctaLabel={tab === "consumed" ? "우선소비 재료 보기" : undefined}
          ctaHref={tab === "consumed" ? "/priority" : undefined}
        />
      ) : (
        <div className="space-y-6">
          {grouped.map(([date, rows]) => (
            <section key={date}>
              <h2 className="mb-2 text-[16.5px] font-bold text-ink-700">
                {formatKoreanDate(date)} <span className="font-medium text-ink-500">· {relativeDay(date)}</span>
              </h2>
              <ul className="divide-y divide-ink-300/20 overflow-hidden rounded-card border border-ink-300/25 bg-white">
                {rows.map((row) =>
                  row.kind === "cook" ? (
                    <CookRow key={row.cookId} recipeName={row.recipeName} logs={row.logs} />
                  ) : (
                    <SingleRow key={row.log.id} log={row.log} />
                  )
                )}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Link href="/report" className="btn-ghost min-h-[52px] w-full">
        절약 리포트 보기
        <ArrowRight size={20} />
      </Link>
    </div>
  );
}

function CookRow({ recipeName, logs }: { recipeName: string; logs: ConsumptionLog[] }) {
  const recipe = RECIPES.find((r) => r.name === recipeName);
  const total = logs.reduce((s, l) => s + l.price, 0);
  const rescued = logs.filter((l) => isRescue(l.dLeft)).length;
  return (
    <li className="flex items-center gap-3 p-3.5">
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream">
        {recipe ? (
          <Image src={recipeImage(recipe.image)} alt={recipeName} fill sizes="56px" className="object-contain p-1" />
        ) : (
          <span className="grid h-full place-items-center text-2xl">🍳</span>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[18.5px] font-bold text-ink-900">
          {recipe ? (
            <Link href={`/recipes/${recipe.id}`} className="hover:underline">{recipeName}</Link>
          ) : (
            recipeName
          )}{" "}
          <span className="font-medium text-ink-400">요리</span>
        </p>
        <p className="text-[15.5px] text-ink-500">
          {logs.map((l) => `${l.ingredientName} ${amountText(l)}`.trim()).join(" · ")}
        </p>
        {rescued > 0 && (
          <p className="text-[14.5px] font-semibold text-amberish-600">임박 재료 {rescued}개를 살렸어요</p>
        )}
      </div>
      <span className="shrink-0 text-[15.5px] font-semibold tabular-nums text-ink-700">{formatWon(total)}</span>
    </li>
  );
}

function SingleRow({ log }: { log: ConsumptionLog }) {
  const eaten = log.type === "consumed";
  return (
    <li className="flex items-center gap-3 p-3.5">
      <IngredientThumb
        name={log.ingredientName}
        emoji={log.emoji}
        className={`h-14 w-14 rounded-xl text-xl ${eaten ? "bg-warmwhite" : "bg-coral-50 opacity-70 grayscale"}`}
        sizes="56px"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[18.5px] font-bold text-ink-900">
          {log.ingredientName} <span className="font-medium text-ink-400">{amountText(log)}</span>
        </p>
        <p className={`text-[15.5px] ${eaten ? "text-ink-500" : "text-coral-600"}`}>
          {eaten ? log.via ?? "그대로 먹었어요" : log.reason ?? "폐기"}
        </p>
        {eaten && isRescue(log.dLeft) && (
          <p className="text-[14.5px] font-semibold text-amberish-600">기한 임박 재료를 살렸어요</p>
        )}
      </div>
      <span className={`shrink-0 text-[15.5px] font-semibold tabular-nums ${eaten ? "text-ink-700" : "text-coral-600"}`}>
        {eaten ? "" : "−"}
        {formatWon(log.price)}
      </span>
    </li>
  );
}
