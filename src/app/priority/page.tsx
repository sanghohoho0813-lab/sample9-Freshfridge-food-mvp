"use client";

import { useMemo } from "react";
import { useFridge, useStore } from "@/lib/store";
import {
  PRIORITY_GROUP_META,
  priorityGroup,
  sortByExpiry,
  type PriorityGroup,
} from "@/lib/expiry-calculator";
import IngredientCard from "@/components/IngredientCard";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";

const GROUP_ORDER: PriorityGroup[] = ["veryUrgent", "soon", "thisWeek"];

const GROUP_ACCENT: Record<PriorityGroup, string> = {
  veryUrgent: "bg-coral-500",
  soon: "bg-amberish-500",
  thisWeek: "bg-fresh-500",
  later: "bg-ink-300",
};

export default function PriorityPage() {
  const { ready } = useStore();
  const fridge = useFridge();

  const groups = useMemo(() => {
    const sorted = sortByExpiry(fridge);
    const map: Record<PriorityGroup, typeof sorted> = {
      veryUrgent: [],
      soon: [],
      thisWeek: [],
      later: [],
    };
    for (const ing of sorted) {
      const g = priorityGroup(ing.expiresAt);
      if (g) map[g].push(ing);
    }
    return map;
  }, [fridge]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={5} />
      </div>
    );
  }

  const totalUrgent = groups.veryUrgent.length + groups.soon.length;
  const isEmpty = GROUP_ORDER.every((g) => groups[g].length === 0);

  return (
    <div className="mx-auto max-w-6xl animate-fade-up space-y-6">
      <div>
        <h1 className="text-[28.6px] font-extrabold tracking-tight text-ink-900">
          먼저 먹어주세요 ⏰
        </h1>
        <p className="mt-1 text-[17.6px] text-ink-500">
          {totalUrgent > 0
            ? `${totalUrgent}개의 재료가 기다리고 있어요. 버리기 전에 맛있게 먹어요.`
            : "이번 주 안에 먹으면 좋은 재료를 모아 보여드려요."}
        </p>
      </div>

      {isEmpty ? (
        <EmptyState
          emoji="🌿"
          title="지금은 급한 재료가 없어요"
          description="냉장고가 잘 관리되고 있어요!"
          ctaLabel="내 냉장고 보기"
          ctaHref="/fridge"
        />
      ) : (
        GROUP_ORDER.map((g) => {
          const list = groups[g];
          if (list.length === 0) return null;
          const meta = PRIORITY_GROUP_META[g];
          return (
            <section key={g}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className={`h-3 w-3 rounded-full ${GROUP_ACCENT[g]}`} />
                <h2 className="text-[20.8px] font-extrabold text-ink-900">{meta.title}</h2>
                <span className="text-[15.6px] text-ink-400">{meta.sub}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {list.map((ing) => (
                  <IngredientCard key={ing.id} ingredient={ing} />
                ))}
              </div>
            </section>
          );
        })
      )}
    </div>
  );
}
