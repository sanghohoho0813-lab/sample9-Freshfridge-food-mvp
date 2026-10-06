"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import {
  dDayLabel,
  PRIORITY_GROUP_META,
  priorityGroup,
  sortByExpiry,
  type PriorityGroup,
} from "@/lib/expiry-calculator";
import { RECIPES } from "@/lib/demo-data";
import { recommendRecipes } from "@/lib/recommendation-engine";
import { recipeImage } from "@/lib/images";
import IngredientRow from "@/components/IngredientRow";
import ListGroup from "@/components/ui/ListGroup";
import PageHeader from "@/components/ui/PageHeader";
import { useIngredientActions } from "@/components/useIngredientActions";
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
  const { eat, element: actionSheet } = useIngredientActions();

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

  const rescue = useMemo(() => {
    const top = recommendRecipes(RECIPES, fridge, 1)[0];
    return top && top.urgentOwned.length > 0 ? top : null;
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
      <PageHeader
        title="우선소비"
        description={
          totalUrgent > 0
            ? `${totalUrgent}개 재료가 3일 안에 기한이 끝나요.`
            : "이번 주 안에 먹으면 좋은 재료를 모았어요."
        }
      />

      {rescue && (
        <Link
          href={`/recipes/${rescue.recipe.id}`}
          className="card card-hover flex items-center gap-3.5 p-3 sm:gap-4 sm:p-4"
        >
          <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-20 sm:w-20">
            <Image src={recipeImage(rescue.recipe.image)} alt={rescue.recipe.name} fill sizes="80px" className="object-contain p-1.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-amberish-600">급한 재료를 한 번에 쓰는 요리</p>
            <p className="truncate text-[19.5px] font-extrabold text-ink-900">{rescue.recipe.name}</p>
            <p className="line-clamp-2 text-[15.5px] leading-snug text-ink-500">
              {rescue.urgentOwned.map((m) => `${m.name} ${dDayLabel(m.ingredient?.expiresAt ?? null)}`).join(" · ")}
              {" "}· {rescue.recipe.minutes}분
            </p>
          </div>
          <ChevronRight size={22} className="shrink-0 text-ink-300" aria-hidden />
        </Link>
      )}

      {isEmpty ? (
        <EmptyState
          emoji="🌿"
          title="지금은 급한 재료가 없어요"
          description="냉장고가 잘 관리되고 있어요."
          ctaLabel="내 냉장고 보기"
          ctaHref="/fridge"
        />
      ) : (
        GROUP_ORDER.map((g) => {
          const list = groups[g];
          if (list.length === 0) return null;
          const meta = PRIORITY_GROUP_META[g];
          return (
            <section key={g} aria-labelledby={`group-${g}`}>
              <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <h2 id={`group-${g}`} className="flex items-center gap-2 text-[20.5px] font-extrabold text-ink-900">
                  <span className={`h-2.5 w-2.5 rounded-full ${GROUP_ACCENT[g]}`} aria-hidden />
                  {meta.title}
                  <span className="text-[16.5px] font-bold text-ink-400">{list.length}</span>
                </h2>
                <span className="text-[15.5px] text-ink-500">{meta.sub}</span>
              </div>
              <ListGroup columns={2}>
                {list.map((ing) => (
                  <IngredientRow key={ing.id} ingredient={ing} onEat={eat} />
                ))}
              </ListGroup>
            </section>
          );
        })
      )}

      {actionSheet}
    </div>
  );
}
