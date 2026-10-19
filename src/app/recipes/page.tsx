"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { AlarmClock, ArrowRight, ChefHat, Clock3, ShoppingBasket, X } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { explainMatch, rankRecipes, type RecipeMatch } from "@/lib/recipe-matcher";
import { daysLeft } from "@/lib/expiry-calculator";
import { recipeImage } from "@/lib/images";
import { lastCookedByRecipe, relativeDay } from "@/lib/stats";
import RecipeCard, { RecipeList } from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import SegmentedControl from "@/components/ui/SegmentedControl";

import { josa } from "@/lib/text";

type View = "recommended" | "ready" | "quick";
const QUICK_MINUTES = 15;

/** 맨 위 한 가지 — 사진을 크게, 추천 이유를 줄마다 하나씩 */
function FeaturedRecipe({ match, lastCooked }: { match: RecipeMatch; lastCooked?: string }) {
  const { recipe } = match;
  const why = explainMatch(match);
  const recentCook = !!lastCooked && -(daysLeft(lastCooked) ?? 99) < 7;
  return (
    <Link href={`/recipes/${recipe.id}`} className="card card-hover group flex flex-col overflow-hidden sm:flex-row">
      <span className="relative block aspect-[16/10] w-full bg-cream sm:aspect-auto sm:min-h-[280px] sm:w-[48%] sm:shrink-0">
        <Image
          src={recipeImage(recipe.image)}
          alt=""
          fill
          priority
          sizes="(max-width: 640px) 100vw, 520px"
          className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.03] sm:p-6"
        />
        <span className="absolute left-3.5 top-3.5 rounded-full bg-white/90 px-3 py-1 text-[14px] font-semibold text-ink-700 shadow-sm backdrop-blur">
          지금 가장 추천해요
        </span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center p-5 sm:p-7">
        <span className="text-[24px] font-bold tracking-[-0.02em] text-ink-900 sm:text-[27px]">{recipe.name}</span>
        <span className="mt-1 line-clamp-2 text-[16px] leading-relaxed text-ink-500">{recipe.description}</span>
        <span className="mt-4 flex flex-col gap-2 text-[16px] leading-snug">
          {why.urgent && (
            <span className="flex items-start gap-2.5 font-medium text-amberish-700">
              <AlarmClock size={19} className="mt-px shrink-0" aria-hidden />
              {why.urgent}
            </span>
          )}
          <span
            className={`flex items-start gap-2.5 ${why.ready ? "font-medium text-fresh-700" : "font-semibold text-ink-800"}`}
          >
            <ShoppingBasket size={19} className="mt-px shrink-0" aria-hidden />
            {why.shopping}
          </span>
          <span className="flex items-start gap-2.5 text-ink-600">
            <Clock3 size={19} className="mt-px shrink-0" aria-hidden />
            {why.minutes} · {recipe.difficulty}
            {recentCook && ` · ${relativeDay(lastCooked!)} 만듦`}
          </span>
        </span>
        <span className="mt-5 inline-flex items-center gap-1 text-[16.5px] font-semibold text-fresh-700">
          레시피 보기
          <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" aria-hidden />
        </span>
      </span>
    </Link>
  );
}

function RecipesSkeleton() {
  return (
    <PageLoading title="레시피 추천" width="6xl">
      <div className="skeleton h-[300px] w-full sm:h-[280px]" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-[116px] w-full sm:aspect-[4/3] sm:h-auto" />
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

  const list = (items: typeof ranked) => (
    <RecipeList>
      {items.map((m) => (
        <li key={m.recipe.id}>
          <RecipeCard match={m} lastCooked={lastCooked.get(m.recipe.id)} />
        </li>
      ))}
    </RecipeList>
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
            className="mt-3 inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-fresh-600 bg-fresh-50 px-4 text-[15.5px] font-semibold text-fresh-800 hover:bg-fresh-100"
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

      <div id="recipe-panel" role="tabpanel" aria-label="레시피 목록" className="space-y-9">
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
          <div className="space-y-4 sm:space-y-5">
            <FeaturedRecipe match={shown[0]} lastCooked={lastCooked.get(shown[0].recipe.id)} />
            {shown.length > 1 && list(shown.slice(1))}
          </div>
        )}

        {view === "recommended" && needToBuy.length > 0 && (
          <section aria-labelledby="need-to-buy">
            <h2 id="need-to-buy" className="section-title">
              조금만 사면 만들 수 있어요
            </h2>
            <p className="mb-3.5 mt-0.5 text-[15.5px] text-ink-500">살 재료가 적은 순이에요.</p>
            {list(needToBuy)}
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
