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
import IngredientRow from "@/components/IngredientRow";
import ListGroup from "@/components/ui/ListGroup";
import SectionHeader from "@/components/SectionHeader";
import RecipeCard from "@/components/RecipeCard";
import RestockList from "@/components/RestockList";
import TodayFocusCard from "@/components/TodayFocusCard";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";
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
    ? "산 재료를 등록하면 기한을 대신 챙겨드려요."
    : urgent.length > 0
      ? `기한이 3일 안으로 남은 재료가 ${urgent.length}개예요.`
      : `냉장고에 ${fridge.length}개를 보관 중이에요.`;

  return (
    <div className="mx-auto max-w-6xl">
      <section className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[28.5px]">
            안녕하세요, {state.userName}님
          </h1>
          {ready ? (
            <p className="mt-1.5 text-[17px] leading-snug text-ink-600">{headline}</p>
          ) : (
            <p className="mt-1.5 h-[24px]" aria-hidden>
              <span className="skeleton inline-block h-[18px] w-64 max-w-full" />
            </p>
          )}
        </div>
        <Link href="/add" className="btn-primary hidden shrink-0 sm:inline-flex">
          <Plus size={21} aria-hidden />
          식재료 추가
        </Link>
      </section>

      {!ready ? (
        // 저장된 데이터를 읽기 전 — 예시 데이터가 잠깐 보였다 바뀌지 않도록 자리만 잡는다
        <div className="mt-5 grid gap-7 xl:grid-cols-[minmax(0,1fr)_380px]" aria-busy="true">
          <div className="space-y-4">
            <div className="skeleton h-56 w-full" />
            <SkeletonList rows={4} />
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
            title="냉장고가 비어 있어요"
            description="재료를 등록하면 먼저 먹어야 할 순서와 지금 만들 수 있는 요리를 매일 알려드려요."
            ctaLabel="첫 식재료 추가하기"
            ctaHref="/add"
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-7 sm:gap-8 xl:grid-cols-[minmax(0,1fr)_380px]">
          <div className="min-w-0 space-y-7 sm:space-y-8">
            <TodayFocusCard focus={focus} onEat={eat} />

            <section>
              <SectionHeader
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
                <ListGroup>
                  {urgent.slice(0, URGENT_LIMIT).map((ing) => (
                    <IngredientRow key={ing.id} ingredient={ing} onEat={eat} />
                  ))}
                </ListGroup>
              )}
            </section>
          </div>

          <aside className="min-w-0 space-y-7 sm:space-y-8">
            {recipes.length > 0 && (
              <section>
                <SectionHeader title="오늘 해먹기 좋은 요리" moreHref="/recipes" moreLabel="전체 보기" />
                <p className="-mt-1.5 mb-3 text-[15px] text-ink-500">
                  급한 재료를 쓰고, 지금 있는 재료로 만들 수 있어요.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
                  {recipes.map((m) => (
                    <RecipeCard key={m.recipe.id} match={m} lastCooked={lastCooked.get(m.recipe.id)} layout="row" />
                  ))}
                </div>
              </section>
            )}

            {restock.length > 0 && (
              <section>
                <SectionHeader
                  title="장보기에 넣을 것"
                  moreHref="/shopping"
                  moreLabel={toBuy > 0 ? `살 것 ${toBuy}개` : "장보기"}
                />
                <RestockList items={restock} />
              </section>
            )}

            <Link
              href="/report"
              className="flex items-center gap-3 rounded-card border border-ink-300/25 bg-white px-4 py-3.5 transition-colors hover:bg-warmwhite"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[16.5px] font-bold text-ink-900">
                  {week.usedCount > 0
                    ? `이번 주 ${week.usedCount}개를 먹어서 ${formatWon(week.savedAmount)} 아꼈어요`
                    : "이번 주 기록이 아직 없어요"}
                </p>
                <p className="mt-0.5 text-[15px] text-ink-500">
                  {sinceWaste === null
                    ? "아직 버린 재료가 없어요"
                    : sinceWaste === 0
                      ? "오늘 버린 재료가 있어요 · 낭비 리포트에서 이유 확인"
                      : `마지막으로 버린 지 ${sinceWaste}일째`}
                </p>
              </div>
              <ChevronRight size={20} className="shrink-0 text-ink-300" aria-hidden />
            </Link>
          </aside>
        </div>
      )}

      {actionSheet}
    </div>
  );
}
