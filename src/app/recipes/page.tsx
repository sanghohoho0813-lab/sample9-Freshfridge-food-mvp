"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import { lastCookedByRecipe } from "@/lib/stats";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";

function RecipesSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div className="skeleton h-10 w-1/2" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton aspect-[4/3] w-full" />
        ))}
      </div>
    </div>
  );
}

function RecipesContent() {
  const { ready, state } = useStore();
  const fridge = useFridge();
  const params = useSearchParams();
  const withName = params.get("with")?.trim() || null;

  const ranked = useMemo(() => {
    const all = rankRecipes(RECIPES, fridge);
    if (!withName) return all;
    return all.filter((m) =>
      m.recipe.ingredients.some((ri) => ri.name === withName || ri.name.includes(withName) || withName.includes(ri.name))
    );
  }, [fridge, withName]);
  const lastCooked = useMemo(() => lastCookedByRecipe(state.cooks), [state.cooks]);

  if (!ready) return <RecipesSkeleton />;

  const good = ranked.filter((m) => m.matchPercent >= 40);
  const others = ranked.filter((m) => m.matchPercent < 40);

  return (
    <div className="mx-auto max-w-6xl animate-fade-up space-y-7">
      <div>
        <h1 className="text-[28.5px] font-extrabold tracking-tight text-ink-900">
          {withName ? `${withName}(으)로 만들 수 있는 요리` : "레시피 추천 🍳"}
        </h1>
        <p className="mt-1 text-[17.5px] text-ink-500">
          지금 냉장고 재료로 만들 수 있는 순서예요. 유통기한이 임박한 재료를 쓰는 요리가 먼저 나와요.
        </p>
        {withName && (
          <Link
            href="/recipes"
            className="mt-3 inline-flex min-h-[40px] items-center gap-1.5 rounded-chip border border-ink-300/40 bg-white px-3.5 text-[15.5px] font-semibold text-ink-700 hover:border-ink-300"
          >
            {withName} 필터 해제
            <X size={16} />
          </Link>
        )}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {good.map((m) => (
            <RecipeCard key={m.recipe.id} match={m} lastCooked={lastCooked.get(m.recipe.id)} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">
            재료를 조금 더 사면 만들 수 있어요
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((m) => (
              <RecipeCard key={m.recipe.id} match={m} lastCooked={lastCooked.get(m.recipe.id)} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={<RecipesSkeleton />}>
      <RecipesContent />
    </Suspense>
  );
}
