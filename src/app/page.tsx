"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Check, ChefHat, Plus, Sparkles } from "lucide-react";
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
import { weeklySavings } from "@/lib/stats";
import ExpiryBadge from "@/components/ExpiryBadge";
import SectionHeader from "@/components/SectionHeader";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";

export default function HomePage() {
  const { ready, state, consumeIngredient, showToast } = useStore();
  const fridge = useFridge();

  const urgent = useMemo(
    () =>
      sortByExpiry(fridge).filter((i) => {
        const d = daysLeft(i.expiresAt);
        return d !== null && d <= 3;
      }),
    [fridge]
  );

  const summary = useMemo(() => {
    const soon = fridge.filter((i) => {
      const d = daysLeft(i.expiresAt);
      return d !== null && d <= 3;
    }).length;
    const frozen = fridge.filter((i) => i.storage === "freezer").length;
    return {
      total: fridge.length,
      soon,
      relaxed: fridge.length - soon,
      frozen,
    };
  }, [fridge]);

  const recommendations = useMemo(() => recommendRecipes(RECIPES, fridge, 2), [fridge]);
  const ranked = useMemo(() => rankRecipes(RECIPES, fridge), [fridge]);
  const savings = useMemo(() => weeklySavings(state.logs), [state.logs]);

  const recipeForIngredient = (name: string): string => {
    const found = ranked.find((m) =>
      m.matched.some((mi) => mi.owned && mi.ingredient?.name === name)
    );
    return found ? `/recipes/${found.recipe.id}` : "/recipes";
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-16 w-2/3" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-8">
      {/* 인사 */}
      <section className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight text-ink-900">
            안녕하세요, {state.userName}님 👋
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-500">
            {urgent.length > 0
              ? `오늘 먼저 먹어야 할 재료가 ${urgent.length}개 있어요.`
              : "오늘 냉장고는 여유로워요."}
          </p>
        </div>
        <Link href="/add" className="btn-primary hidden shrink-0 sm:inline-flex">
          <Plus size={17} />
          식재료 추가
        </Link>
      </section>

      {/* 오늘 먼저 먹어야 해요 */}
      <section>
        <SectionHeader
          title="오늘 먼저 먹어야 해요 🍽️"
          sub="버리기 전에 맛있게 먹어요."
          moreHref="/priority"
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
          <div className="flex flex-col gap-3">
            {urgent.slice(0, 4).map((ing) => (
              <div key={ing.id} className="card card-hover p-4">
                <div className="flex items-center gap-3.5">
                  <Link
                    href={`/ingredient/${ing.id}`}
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-coral-50 text-[26px]"
                  >
                    {ing.emoji}
                  </Link>
                  <Link href={`/ingredient/${ing.id}`} className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-[15.5px] font-bold text-ink-900">{ing.name}</p>
                      <ExpiryBadge expiresAt={ing.expiresAt} />
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-ink-500">
                      {ing.quantity}
                      {ing.unit} · {STORAGE_LABELS[ing.storage]} ·{" "}
                      <span className="font-medium text-coral-500">
                        {friendlyExpiryText(ing.expiresAt)}
                      </span>
                    </p>
                  </Link>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      consumeIngredient(ing.id);
                      showToast(`${ing.name}, 맛있게 드셨네요!`, "✅");
                    }}
                    className="btn-soft flex-1"
                  >
                    <Check size={16} />
                    먹었어요
                  </button>
                  <Link href={recipeForIngredient(ing.name)} className="btn-ghost flex-1">
                    <ChefHat size={16} />
                    레시피 보기
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 냉장고 상태 요약 */}
      <section>
        <SectionHeader title="냉장고 상태" moreHref="/fridge" moreLabel="내 냉장고" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "전체 식재료", value: summary.total, unit: "개", tone: "text-ink-900" },
            { label: "곧 소비 필요", value: summary.soon, unit: "개", tone: "text-coral-500" },
            { label: "여유 있음", value: summary.relaxed, unit: "개", tone: "text-fresh-600" },
            { label: "냉동 보관", value: summary.frozen, unit: "개", tone: "text-mint-600" },
          ].map((s) => (
            <div key={s.label} className="card p-4">
              <p className="text-[12px] font-medium text-ink-500">{s.label}</p>
              <p className={`mt-1 text-[22px] font-extrabold ${s.tone}`}>
                {s.value}
                <span className="ml-0.5 text-[13px] font-semibold text-ink-400">{s.unit}</span>
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 오늘의 추천 요리 */}
      <section>
        <SectionHeader
          title="오늘의 추천 요리 👨‍🍳"
          sub="이 재료들로 오늘 저녁을 만들어볼까요?"
          moreHref="/recipes"
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
              <RecipeCard key={m.recipe.id} match={m} />
            ))}
          </div>
        )}
      </section>

      {/* 이번 주 절약 */}
      <section>
        <Link
          href="/report"
          className="card card-hover flex items-center gap-4 bg-gradient-to-br from-fresh-50 via-white to-mint-50 p-5"
        >
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-fresh-100 text-2xl">
            <Sparkles className="text-fresh-600" size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14.5px] font-bold text-ink-900">
              이번 주 {savings.usedCount}개의 식재료를 버리지 않고 사용했어요
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              예상 절약{" "}
              <span className="font-extrabold text-fresh-600">{formatWon(savings.savedAmount)}</span>{" "}
              · 절약 리포트 보기
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
