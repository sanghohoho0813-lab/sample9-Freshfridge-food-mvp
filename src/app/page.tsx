"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ChevronRight, Plus } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { daysLeft, formatWon, sortByExpiry } from "@/lib/expiry-calculator";
import { recommendRecipes } from "@/lib/recommendation-engine";
import { lastCookedByRecipe, relativeDay, weeklySummary } from "@/lib/stats";
import { joinNames } from "@/lib/text";
import IngredientRow from "@/components/IngredientRow";
import ListGroup from "@/components/ui/ListGroup";
import SectionHeader from "@/components/SectionHeader";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";
import { useIngredientActions } from "@/components/useIngredientActions";

const URGENT_LIMIT = 5;

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
  const lastCooked = useMemo(() => lastCookedByRecipe(state.cooks), [state.cooks]);
  const week = useMemo(() => weeklySummary(state.logs, state.cooks), [state.logs, state.cooks]);
  const shopping = state.shopping.filter((s) => !s.checked);
  const latestCook = state.cooks[0];

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
          <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[28.5px]">
            안녕하세요, {state.userName}님 👋
          </h1>
          <p className="mt-1.5 text-[17.5px] leading-snug text-ink-600">{headline}</p>
        </div>
        <Link href="/add" className="btn-primary hidden shrink-0 sm:inline-flex">
          <Plus size={21} />
          식재료 추가
        </Link>
      </section>

      <div className="mt-6 grid gap-8 sm:mt-7 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* 왼쪽: 오늘 할 일 */}
        <div className="min-w-0 space-y-8 sm:space-y-9">
          {/* 1. 오늘 먼저 먹어야 할 재료 */}
          <section>
            <SectionHeader
              title="오늘 먼저 먹어야 해요"
              moreHref="/priority"
              moreLabel={urgent.length > URGENT_LIMIT ? `${urgent.length - URGENT_LIMIT}개 더 보기` : "전체 보기"}
            />
            {urgent.length === 0 ? (
              <EmptyState
                emoji="🌿"
                title="급하게 먹어야 할 재료가 없어요"
                description="새로 산 재료를 등록하면 기한을 대신 챙겨드려요."
                ctaLabel="식재료 추가하기"
                ctaHref="/add"
              />
            ) : (
              <ListGroup>
                {urgent.slice(0, URGENT_LIMIT).map((ing) => (
                  <IngredientRow key={ing.id} ingredient={ing} onEat={eat} />
                ))}
              </ListGroup>
            )}
          </section>

          {/* 2. 이 재료로 만들 수 있는 요리 */}
          <section>
            <SectionHeader title="이 재료로 만들 요리" moreHref="/recipes" moreLabel="전체 보기" />
            {recommendations.length === 0 ? (
              <EmptyState
                emoji="🍳"
                title="현재 재료로 추천할 요리를 찾지 못했어요"
                description="장보기 목록을 확인해보세요."
                ctaLabel="장보기 리스트"
                ctaHref="/shopping"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
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
            <p className="mt-1 text-[16.5px] text-ink-600">
              <b className="text-ink-900">{fridge.length}개</b> 보관 중
              <span className="text-ink-500">
                {" "}(냉장 {storageCounts.fridge} · 냉동 {storageCounts.freezer} · 실온 {storageCounts.pantry})
              </span>
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
