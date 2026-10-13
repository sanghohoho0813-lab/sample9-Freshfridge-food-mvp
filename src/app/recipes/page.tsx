"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChefHat, ShoppingBasket, X } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import { lastCookedByRecipe } from "@/lib/stats";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import SegmentedControl from "@/components/ui/SegmentedControl";

type View = "recommended" | "ready" | "quick";
const QUICK_MINUTES = 15;
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
  const [view, setView] = useState<View>("recommended");

  if (!ready) return <RecipesSkeleton />;

  const readyList = ranked.filter((m) => m.readyToCook);
  const quickList = readyList.filter((m) => m.recipe.minutes <= QUICK_MINUTES);
  // 사야 하는 재료가 적은 순 → 같은 수면 추천 점수 순
  const needToBuy = ranked
    .filter((m) => !m.readyToCook)
    .sort((a, b) => a.missingEssential.length - b.missingEssential.length || b.score - a.score);
  const shown = view === "ready" ? readyList : view === "quick" ? quickList : readyList;

  const grid = (list: typeof ranked, firstPriority = false) => (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {list.map((m, i) => (
        <RecipeCard
          key={m.recipe.id}
          match={m}
          lastCooked={lastCooked.get(m.recipe.id)}
          priority={firstPriority && i < 2}
        />
      ))}
    </div>
  );

  return (
    <div className="mx-auto max-w-6xl space-y-5 sm:space-y-6">
      <div>
        <PageHeader
          title={withName ? `${josa(withName, "으로/로")} 만들 요리` : "레시피 추천"}
          description="급한 재료를 많이 쓰는 요리 → 살 재료가 적은 요리 → 빨리 되는 요리 순이에요."
        />
        {withName && (
          <Link
            href="/recipes"
            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-chip border border-ink-300/40 bg-white px-4 text-[15.5px] font-semibold text-ink-700 hover:border-ink-300"
          >
            {withName} 필터 해제
            <X size={16} aria-hidden />
          </Link>
        )}
      </div>

      {fridge.length > 0 && ranked.length > 0 && (
        <SegmentedControl
          label="레시피 보기"
          panelId="recipe-panel"
          value={view}
          onChange={setView}
          segments={[
            { value: "recommended", label: "추천순" },
            { value: "ready", label: "바로 가능", count: readyList.length },
            { value: "quick", label: `${QUICK_MINUTES}분 이내`, count: quickList.length },
          ]}
        />
      )}

      <div id="recipe-panel" role="tabpanel" aria-label="레시피 목록" className="space-y-7">
        {fridge.length === 0 ? (
          <EmptyState
            icon={ShoppingBasket}
            title="냉장고에 재료가 없어요"
            description="재료를 등록하면 지금 만들 수 있는 요리부터 골라드려요."
            ctaLabel="식재료 추가하기"
            ctaHref="/add"
          />
        ) : shown.length === 0 ? (
          <EmptyState
            compact
            icon={ChefHat}
            title={
              withName
                ? `${josa(withName, "을/를")} 쓰는 요리 중 바로 만들 수 있는 게 없어요`
                : view === "quick"
                  ? `${QUICK_MINUTES}분 안에 바로 되는 요리가 없어요`
                  : "지금 재료만으로 만들 요리가 없어요"
            }
            description={needToBuy.length > 0 ? "아래 요리는 재료를 조금만 사면 만들 수 있어요." : undefined}
          />
        ) : (
          grid(shown, true)
        )}

        {view === "recommended" && needToBuy.length > 0 && (
          <section aria-labelledby="need-to-buy">
            <h2 id="need-to-buy" className="mb-1 text-[20.5px] font-extrabold text-ink-900">
              조금만 사면 만들 수 있어요
            </h2>
            <p className="mb-3 text-[15px] text-ink-500">살 재료가 적은 순이에요.</p>
            {grid(needToBuy)}
          </section>
        )}
      </div>
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
