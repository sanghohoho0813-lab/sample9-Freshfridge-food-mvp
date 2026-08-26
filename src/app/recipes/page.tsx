"use client";

import { useMemo } from "react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";

export default function RecipesPage() {
  const { ready } = useStore();
  const fridge = useFridge();
  const ranked = useMemo(() => rankRecipes(RECIPES, fridge), [fridge]);
  const good = ranked.filter((m) => m.matchPercent >= 40);
  const others = ranked.filter((m) => m.matchPercent < 40);

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/3] w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-7">
      <div>
        <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">레시피 추천 🍳</h1>
        <p className="mt-1 text-[13.5px] text-ink-500">
          지금 냉장고에 있는 재료로 만들 수 있는 요리를 골라봤어요. 유통기한이 임박한 재료를
          쓰는 요리가 먼저 나와요.
        </p>
      </div>

      {good.length === 0 ? (
        <EmptyState
          emoji="🍳"
          title="현재 재료로 추천할 요리를 찾지 못했어요"
          description="장보기 목록을 확인해보세요."
          ctaLabel="장보기 리스트"
          ctaHref="/shopping"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {good.map((m) => (
            <RecipeCard key={m.recipe.id} match={m} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-[16px] font-extrabold text-ink-900">
            재료를 조금 더 사면 만들 수 있어요 🛒
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {others.map((m) => (
              <RecipeCard key={m.recipe.id} match={m} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
