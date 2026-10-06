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
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import { josa } from "@/lib/text";

function RecipesSkeleton() {
  return (
    <PageLoading title="레시피 추천" width="6xl">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-[104px] w-full sm:aspect-[4/3] sm:h-auto" />
        ))}
      </div>
    </PageLoading>
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
      m.recipe.ingredients.some(
        (ri) => ri.name === withName || ri.name.includes(withName) || withName.includes(ri.name)
      )
    );
  }, [fridge, withName]);
  const lastCooked = useMemo(() => lastCookedByRecipe(state.cooks), [state.cooks]);

  if (!ready) return <RecipesSkeleton />;

  const good = ranked.filter((m) => m.matchPercent >= 40);
  const others = ranked.filter((m) => m.matchPercent < 40);

  return (
    <div className="mx-auto max-w-6xl space-y-6 sm:space-y-7">
      <div>
        <PageHeader
          title={withName ? `${josa(withName, "으로/로")} 만들 요리` : "레시피 추천"}
          description="기한이 급한 재료를 많이 쓰는 요리부터 보여드려요."
        />
        {withName && (
          <Link
            href="/recipes"
            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-chip border border-ink-300/40 bg-white px-4 text-[15.5px] font-semibold text-ink-700 hover:border-ink-300"
          >
            {withName} 필터 해제
            <X size={16} />
          </Link>
        )}
      </div>

      {good.length === 0 ? (
        fridge.length === 0 ? (
          <EmptyState
            emoji="🧺"
            title="냉장고에 재료가 없어요"
            description="재료를 등록하면 지금 만들 수 있는 요리부터 골라드려요."
            ctaLabel="식재료 추가하기"
            ctaHref="/add"
          />
        ) : (
          <EmptyState
            emoji="🍳"
            title={withName ? `${josa(withName, "을/를")} 쓰는 요리가 아직 없어요` : "지금 재료로 만들 요리가 없어요"}
            description={
              others.length > 0 ? "아래 요리는 재료를 조금만 더 사면 만들 수 있어요." : "다른 재료로 찾아보세요."
            }
            ctaLabel={withName ? "전체 레시피 보기" : undefined}
            ctaHref={withName ? "/recipes" : undefined}
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {good.map((m, i) => (
            <RecipeCard key={m.recipe.id} match={m} lastCooked={lastCooked.get(m.recipe.id)} priority={i < 2} />
          ))}
        </div>
      )}

      {others.length > 0 && (
        <section>
          <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">
            {fridge.length === 0 ? "이런 요리를 만들 수 있어요" : "재료를 조금 더 사면 돼요"}
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
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
