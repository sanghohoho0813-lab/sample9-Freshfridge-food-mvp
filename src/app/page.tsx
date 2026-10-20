"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight, Leaf, Plus, Refrigerator } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { daysLeft, formatWon, sortByExpiry } from "@/lib/expiry-calculator";
import { recommendRecipes } from "@/lib/recommendation-engine";
import { restockSuggestions, todayFocus } from "@/lib/insights";
import { daysSinceLastWaste, lastCookedByRecipe, weeklySummary } from "@/lib/stats";
import IngredientTile from "@/components/IngredientTile";
import SectionHeader from "@/components/SectionHeader";
import RecipeCard from "@/components/RecipeCard";
import RestockList from "@/components/RestockList";
import TodayFocusCard from "@/components/TodayFocusCard";
import EmptyState from "@/components/EmptyState";
import { useIngredientActions } from "@/components/useIngredientActions";

const URGENT_LIMIT = 4;

/**
 * 홈 = 오늘 할 일.
 * 맨 위에 가장 중요한 행동 하나 → 먼저 먹을 재료 → 오늘 해먹기 좋은 요리 → 장보기에 넣을 것 → 한 줄 성과.
 */
export default function HomePage() {
  const { ready, state } = useStore();
  const fridge = useFridge();
  const { eat, element: actionSheet } = useIngredientActions();

  const urgent = useMemo(
    () =>
      sortByExpiry(fridge).filter((i) => {
        const d = daysLeft(i.expiresAt);
        return d !== null && d <= 3;
      }),
    [fridge]
  );
  const focus = useMemo(() => todayFocus(state, fridge, RECIPES), [state, fridge]);
  const focusRecipeId =
    focus.kind === "cook" ? focus.match.recipe.id : focus.kind === "relaxed" ? focus.match?.recipe.id : undefined;
  const recipes = useMemo(
    () =>
      recommendRecipes(RECIPES, fridge, 3)
        .filter((m) => m.recipe.id !== focusRecipeId)
        .slice(0, 2),
    [fridge, focusRecipeId]
  );
  const restock = useMemo(
    () =>
      restockSuggestions(state, fridge, 3).filter(
        (s) => !(focus.kind === "restock" && focus.suggestion.name === s.name)
      ),
    [state, fridge, focus]
  );
  const lastCooked = useMemo(() => lastCookedByRecipe(state.cooks), [state.cooks]);
  const week = useMemo(() => weeklySummary(state.logs, state.cooks), [state.logs, state.cooks]);
  const sinceWaste = useMemo(() => daysSinceLastWaste(state.logs), [state.logs]);
  const toBuy = state.shopping.filter((s) => !s.checked).length;
  const empty = fridge.length === 0;

  const headline = empty
    ? "산 재료를 등록하면 기한을 대신 챙겨드려요"
    : urgent.length > 0
      ? `먼저 먹어야 할 재료가 ${urgent.length}개 있어요`
      : `냉장고에 ${fridge.length}개를 보관 중이에요`;

  return (
    <div className="mx-auto max-w-6xl">
      <section className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[16.5px] font-medium text-ink-500">안녕하세요, {state.userName}님</p>
          {ready ? (
            <h1 className="mt-1 text-[27px] font-bold leading-[1.22] tracking-[-0.025em] text-ink-900 sm:text-[30px]">
              {headline}
            </h1>
          ) : (
            <h1 className="mt-1 h-[33px] sm:h-[37px]">
              <span className="sr-only">오늘의 냉장고</span>
              <span className="skeleton inline-block h-[28px] w-72 max-w-full" aria-hidden />
            </h1>
          )}
        </div>
        <Link href="/add" className="btn-primary hidden min-h-[50px] shrink-0 sm:inline-flex">
          <Plus size={21} aria-hidden />
          식재료 추가
        </Link>
      </section>

      {!ready ? (
        // 저장된 데이터를 읽기 전 — 예시 데이터가 잠깐 보였다 바뀌지 않도록 자리만 잡는다
        <div className="mt-5 grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]" aria-busy="true">
          <div className="space-y-6">
            <div className="skeleton h-[420px] w-full sm:h-72" />
            <div className="flex gap-3 overflow-hidden">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="skeleton h-56 w-[150px] shrink-0 sm:w-auto sm:flex-1" />
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="skeleton h-40 w-full" />
            <div className="skeleton h-28 w-full" />
          </div>
        </div>
      ) : empty ? (
        <div className="mt-5">
          <EmptyState
            icon={Refrigerator}
            illustration={["토마토", "우유", "계란"]}
            title="냉장고가 비어 있어요"
            description="재료를 등록하면 먼저 먹어야 할 순서와 지금 만들 수 있는 요리를 매일 알려드려요."
            ctaLabel="첫 식재료 추가하기"
            ctaHref="/add"
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-9 sm:mt-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:gap-8">
          <div className="min-w-0 space-y-9">
            <TodayFocusCard focus={focus} onEat={eat} />

            <section aria-labelledby="urgent-title">
              <SectionHeader
                id="urgent-title"
                title="먼저 먹어야 할 재료"
                moreHref="/priority"
                moreLabel={urgent.length > URGENT_LIMIT ? `${urgent.length - URGENT_LIMIT}개 더 보기` : "우선소비"}
              />
              {urgent.length === 0 ? (
                <EmptyState
                  compact
                  icon={Leaf}
                  title="급하게 먹어야 할 재료가 없어요"
                  description="기한이 3일 안으로 다가오면 여기에 먼저 알려드려요."
                />
              ) : (
                <ul className="rail sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
                  {urgent.slice(0, URGENT_LIMIT).map((ing) => (
                    <IngredientTile key={ing.id} ingredient={ing} onEat={eat} />
                  ))}
                </ul>
              )}
            </section>

            {recipes.length > 0 && (
              <section aria-labelledby="recipes-title">
                <SectionHeader
                  id="recipes-title"
                  title="오늘 해먹기 좋은 요리"
                  sub="급한 재료를 쓰고, 지금 있는 재료로 만들 수 있어요"
                  moreHref="/recipes"
                  moreLabel="전체 보기"
                />
                <ul className="rail sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0">
                  {recipes.map((m) => (
                    <li key={m.recipe.id} className="w-[256px] shrink-0 sm:w-auto">
                      <RecipeCard match={m} lastCooked={lastCooked.get(m.recipe.id)} layout="tile" />
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <aside className="min-w-0 space-y-9 xl:space-y-8">
            {restock.length > 0 && (
              <section aria-labelledby="restock-title">
                <SectionHeader
                  id="restock-title"
                  title="장보기에 넣을 것"
                  moreHref="/shopping"
                  moreLabel={toBuy > 0 ? `살 것 ${toBuy}개` : "장보기"}
                />
                <RestockList items={restock} />
              </section>
            )}

            {/* 이번 주 성과 — 숫자 하나를 크게, 나머지는 한 줄로 */}
            <Link href="/report" className="card card-hover group block p-5">
              <span className="flex items-center justify-between text-[15px] font-semibold text-ink-500">
                이번 주
                <ChevronRight
                  size={18}
                  className="text-ink-300 transition-transform group-hover:translate-x-0.5"
                  aria-hidden
                />
              </span>
              {week.usedCount > 0 ? (
                <>
                  <span className="mt-1.5 block text-[30px] font-bold tabular-nums leading-none tracking-[-0.02em] text-ink-900">
                    {formatWon(week.savedAmount)}
                  </span>
                  <span className="mt-1.5 block text-[16px] text-ink-600">
                    재료 {week.usedCount}개를 먹어서 아꼈어요
                  </span>
                </>
              ) : (
                <span className="mt-1.5 block text-[18px] font-bold text-ink-900">이번 주 기록이 아직 없어요</span>
              )}
              <span className="mt-3 flex items-center gap-2 border-t border-ink-900/[0.06] pt-3 text-[15px] text-ink-500">
                <span className="h-1.5 w-1.5 rounded-full bg-ink-300" aria-hidden />
                {sinceWaste === null
                  ? "아직 버린 재료가 없어요"
                  : sinceWaste === 0
                    ? "오늘 버린 재료가 있어요 · 낭비 리포트에서 이유 확인"
                    : `마지막으로 버린 지 ${sinceWaste}일째`}
              </span>
            </Link>
          </aside>
        </div>
      )}

      {actionSheet}
    </div>
  );
}
