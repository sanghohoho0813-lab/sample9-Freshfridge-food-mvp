"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Check, ChefHat, ChevronRight, Plus } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import {
  daysLeft,
  formatWon,
  friendlyExpiryText,
  sortByExpiry,
} from "@/lib/expiry-calculator";
import { STORAGE_LABELS } from "@/lib/types";
import { recommendRecipes } from "@/lib/recommendation-engine";
import { rankRecipes } from "@/lib/recipe-matcher";
import { lastCookedByRecipe, relativeDay, weeklySummary } from "@/lib/stats";
import { formatAmount } from "@/lib/quantity";
import { joinNames } from "@/lib/text";
import ExpiryBadge from "@/components/ExpiryBadge";
import IngredientThumb from "@/components/IngredientThumb";
import SectionHeader from "@/components/SectionHeader";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";
import { useIngredientActions } from "@/components/useIngredientActions";

const URGENT_LIMIT = 4;

export default function HomePage() {
  const { ready, state } = useStore();
  const fridge = useFridge();
  const { eat, element: actionSheet } = useIngredientActions();

  const withDays = useMemo(
    () => sortByExpiry(fridge).map((i) => ({ i, d: daysLeft(i.expiresAt) })),
    [fridge]
  );
  const urgent = withDays.filter((x) => x.d !== null && x.d <= 3).map((x) => x.i);
  const todayTomorrow = withDays.filter((x) => x.d !== null && x.d <= 1).map((x) => x.i);

  const buckets = useMemo(() => {
    let soon = 0, week = 0, relaxed = 0;
    for (const { d } of withDays) {
      if (d !== null && d <= 3) soon++;
      else if (d !== null && d <= 7) week++;
      else relaxed++;
    }
    return { soon, week, relaxed };
  }, [withDays]);

  const storageCounts = useMemo(() => {
    const c = { fridge: 0, freezer: 0, pantry: 0 };
    for (const i of fridge) c[i.storage]++;
    return c;
  }, [fridge]);

  const recommendations = useMemo(() => recommendRecipes(RECIPES, fridge, 2), [fridge]);
  const ranked = useMemo(() => rankRecipes(RECIPES, fridge), [fridge]);
  const lastCooked = useMemo(() => lastCookedByRecipe(state.cooks), [state.cooks]);
  const week = useMemo(() => weeklySummary(state.logs, state.cooks), [state.logs, state.cooks]);
  const shopping = state.shopping.filter((s) => !s.checked);
  const latestCook = state.cooks[0];

  const recipeForIngredient = (name: string): string => {
    const found = ranked.find((m) => m.matched.some((mi) => mi.owned && mi.ingredient?.name === name));
    return found ? `/recipes/${found.recipe.id}` : `/recipes?with=${encodeURIComponent(name)}`;
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="skeleton h-16 w-2/3" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  const headline =
    todayTomorrow.length > 0
      ? `오늘은 ${joinNames(todayTomorrow.map((i) => i.name))} 먼저 먹어주세요.`
      : urgent.length > 0
        ? `${urgent.length}개 재료가 곧 기한이에요. 버리기 전에 먹어요.`
        : "오늘 냉장고는 여유로워요.";

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      {/* 인사 + 오늘의 한 줄 */}
      <section className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[28.5px] font-extrabold tracking-tight text-ink-900">
            안녕하세요, {state.userName}님 👋
          </h1>
          <p className="mt-1 text-[17.5px] text-ink-600">{headline}</p>
        </div>
        <Link href="/add" className="btn-primary hidden shrink-0 sm:inline-flex">
          <Plus size={21} />
          식재료 추가
        </Link>
      </section>

      <div className="mt-7 grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* 왼쪽: 오늘 할 일 */}
        <div className="min-w-0 space-y-9">
          {/* 1. 오늘 먼저 먹어야 할 재료 */}
          <section>
            <SectionHeader
              title="오늘 먼저 먹어야 해요"
              sub="유통기한이 3일 안에 끝나는 재료예요."
              moreHref="/priority"
              moreLabel={urgent.length > URGENT_LIMIT ? `${urgent.length - URGENT_LIMIT}개 더 보기` : "우선소비"}
            />
            {urgent.length === 0 ? (
              <EmptyState
                emoji="🌿"
                title="급하게 먹어야 할 재료가 없어요"
                description="냉장고가 잘 관리되고 있어요. 새 식재료를 등록해보세요."
                ctaLabel="식재료 추가하기"
                ctaHref="/add"
              />
            ) : (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                {urgent.slice(0, URGENT_LIMIT).map((ing) => (
                  <li key={ing.id} className="card p-4">
                    <Link href={`/ingredient/${ing.id}`} className="flex items-center gap-3.5">
                      <IngredientThumb
                        name={ing.name}
                        emoji={ing.emoji}
                        className="h-[70px] w-[70px] bg-coral-50 text-[34px]"
                        sizes="70px"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-[20.5px] font-bold text-ink-900">{ing.name}</p>
                          <ExpiryBadge expiresAt={ing.expiresAt} />
                        </div>
                        <p className="mt-0.5 text-[16.5px] text-ink-500">
                          {formatAmount(ing.quantity, ing.unit)} · {STORAGE_LABELS[ing.storage]} ·{" "}
                          <span className="font-medium text-coral-600">{friendlyExpiryText(ing.expiresAt)}</span>
                        </p>
                      </div>
                    </Link>
                    <div className="mt-3 flex gap-2">
                      <button type="button" onClick={() => eat(ing)} className="btn-soft flex-1">
                        <Check size={20} />
                        먹었어요
                      </button>
                      <Link href={recipeForIngredient(ing.name)} className="btn-ghost flex-1">
                        <ChefHat size={20} />
                        레시피 보기
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 2. 이 재료로 만들 수 있는 요리 */}
          <section>
            <SectionHeader
              title="이 재료로 만들 수 있는 요리"
              sub="급한 재료를 많이 쓰는 요리부터 골랐어요."
              moreHref="/recipes"
              moreLabel="레시피 더 보기"
            />
            {recommendations.length === 0 ? (
              <EmptyState
                emoji="🍳"
                title="현재 재료로 추천할 요리를 찾지 못했어요"
                description="장보기 목록을 확인해보세요."
                ctaLabel="장보기 리스트"
                ctaHref="/shopping"
              />
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {recommendations.map((m) => (
                  <RecipeCard key={m.recipe.id} match={m} lastCooked={lastCooked.get(m.recipe.id)} />
                ))}
              </div>
            )}
          </section>
        </div>

        {/* 오른쪽(데스크톱) / 아래(모바일): 상태 요약 */}
        <aside className="min-w-0 space-y-5">
          {/* 3. 냉장고 상태 */}
          <section className="card p-5">
            <PanelTitle title="냉장고 상태" href="/fridge" linkLabel="내 냉장고" />
            <p className="mt-1 flex flex-wrap gap-x-1.5 text-[16.5px] text-ink-600">
              <span className="whitespace-nowrap"><b className="text-ink-900">{fridge.length}개</b> 보관 중</span>
              <span className="whitespace-nowrap">· 냉장 {storageCounts.fridge}</span>
              <span className="whitespace-nowrap">· 냉동 {storageCounts.freezer}</span>
              <span className="whitespace-nowrap">· 실온 {storageCounts.pantry}</span>
            </p>
            {fridge.length > 0 && (
              <>
                <div className="mt-4 flex h-3 gap-0.5" aria-hidden>
                  {buckets.soon > 0 && (
                    <span className="rounded-[4px] bg-coral-500" style={{ width: `${(buckets.soon / fridge.length) * 100}%` }} />
                  )}
                  {buckets.week > 0 && (
                    <span className="rounded-[4px] bg-amberish-500" style={{ width: `${(buckets.week / fridge.length) * 100}%` }} />
                  )}
                  {buckets.relaxed > 0 && (
                    <span className="rounded-[4px] bg-ink-300/50" style={{ width: `${(buckets.relaxed / fridge.length) * 100}%` }} />
                  )}
                </div>
                <ul className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1 text-[15.5px] text-ink-600">
                  <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-coral-500" />3일 안 {buckets.soon}</li>
                  <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-amberish-500" />이번 주 {buckets.week}</li>
                  <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-ink-300/50" />여유 {buckets.relaxed}</li>
                </ul>
              </>
            )}
          </section>

          {/* 4. 장보기 */}
          <section className="card p-5">
            <PanelTitle title="장보기" href="/shopping" linkLabel="목록" />
            {shopping.length === 0 ? (
              <p className="mt-1 text-[16.5px] text-ink-500">지금은 살 것이 없어요.</p>
            ) : (
              <>
                <p className="mt-1 text-[16.5px] text-ink-600">
                  살 것 <b className="text-ink-900">{shopping.length}개</b>
                  {shopping.some((s) => s.fromRecipe) && " · 레시피에서 담은 재료 포함"}
                </p>
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {shopping.slice(0, 5).map((s) => (
                    <li key={s.id} className="rounded-chip bg-warmwhite px-3 py-1 text-[15.5px] font-medium text-ink-700 ring-1 ring-ink-300/25">
                      {s.name}
                    </li>
                  ))}
                  {shopping.length > 5 && (
                    <li className="px-1 py-1 text-[15.5px] text-ink-400">외 {shopping.length - 5}개</li>
                  )}
                </ul>
              </>
            )}
          </section>

          {/* 5. 이번 주 성과 */}
          <section className="card p-5">
            <PanelTitle title="이번 주 성과" href="/report" linkLabel="리포트" />
            <p className="mt-1 text-[17.5px] font-bold leading-snug text-ink-900">
              식재료 {week.usedCount}개를 버리지 않고 먹었어요
            </p>
            <p className="mt-1 flex flex-wrap gap-x-1.5 text-[15.5px] text-ink-500">
              <span className="whitespace-nowrap">{formatWon(week.savedAmount)} 절약</span>
              <span className="whitespace-nowrap">· 요리 {week.cookCount}번</span>
              {week.rescuedCount > 0 && (
                <span className="whitespace-nowrap">· 임박 재료 {week.rescuedCount}개 살림</span>
              )}
            </p>
            {latestCook && (
              <p className="mt-3 border-t border-ink-300/20 pt-3 text-[15.5px] text-ink-600">
                최근 요리 ·{" "}
                <Link href={`/recipes/${latestCook.recipeId}`} className="font-semibold text-ink-800 hover:underline">
                  {latestCook.recipeName}
                </Link>{" "}
                <span className="text-ink-400">{relativeDay(latestCook.date)}</span>
              </p>
            )}
          </section>
        </aside>
      </div>

      {actionSheet}
    </div>
  );
}

function PanelTitle({ title, href, linkLabel }: { title: string; href: string; linkLabel: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-[18.5px] font-extrabold text-ink-900">{title}</h2>
      <Link
        href={href}
        className="inline-flex min-h-[36px] items-center gap-0.5 text-[15.5px] font-semibold text-ink-500 hover:text-ink-800"
      >
        {linkLabel}
        <ChevronRight size={18} />
      </Link>
    </div>
  );
}
