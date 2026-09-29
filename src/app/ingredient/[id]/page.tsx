"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChefHat, Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import {
  expiryLevel,
  formatKoreanDate,
  friendlyExpiryText,
} from "@/lib/expiry-calculator";
import { formatAmount } from "@/lib/quantity";
import { relativeDay } from "@/lib/stats";
import { CATEGORY_LABELS, STORAGE_LABELS } from "@/lib/types";
import ExpiryBadge from "@/components/ExpiryBadge";
import IngredientThumb from "@/components/IngredientThumb";
import EmptyState from "@/components/EmptyState";
import RecipeCard from "@/components/RecipeCard";
import { useIngredientActions } from "@/components/useIngredientActions";

export default function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { ready, state, changeQuantity } = useStore();
  const { eat, discard, element: actionSheet } = useIngredientActions();

  const ingredient = state.ingredients.find((i) => i.id === id);

  const relatedRecipes = useMemo(() => {
    if (!ingredient) return [];
    const fridge = state.ingredients.filter(
      (i) => i.status !== "consumed" && i.status !== "discarded" && i.quantity > 0
    );
    return rankRecipes(RECIPES, fridge)
      .filter((m) => m.recipe.ingredients.some((ri) => ri.name === ingredient.name))
      .slice(0, 2);
  }, [ingredient, state.ingredients]);

  // 같은 재료를 지난번에 어떻게 썼는지 — 기록이 다른 화면에 이어지는 지점
  const lastUse = useMemo(
    () =>
      ingredient
        ? state.logs.find((l) => l.ingredientName === ingredient.name && l.type === "consumed")
        : undefined,
    [ingredient, state.logs]
  );

  if (!ready) {
    return <div className="mx-auto max-w-5xl"><div className="skeleton h-64 w-full" /></div>;
  }

  if (!ingredient) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          emoji="🧺"
          title="이 식재료를 찾을 수 없어요"
          description="이미 정리되었거나 잘못된 주소예요."
          ctaLabel="내 냉장고로 가기"
          ctaHref="/fridge"
        />
      </div>
    );
  }

  // 다 먹었거나 버린 재료 — 빈 화면 대신 결과와 다음 행동을 보여준다
  if (ingredient.status === "consumed" || ingredient.status === "discarded") {
    const eaten = ingredient.status === "consumed";
    return (
      <div className="mx-auto max-w-5xl animate-fade-up">
        <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <IngredientThumb
            name={ingredient.name}
            emoji={ingredient.emoji}
            className={`h-24 w-24 text-5xl ${eaten ? "bg-fresh-50" : "bg-coral-50 grayscale"}`}
            sizes="96px"
          />
          <p className="text-[22px] font-extrabold text-ink-900">
            {eaten ? `${ingredient.name}, 다 먹었어요` : `${ingredient.name}, 정리했어요`}
          </p>
          <p className="text-[16.5px] text-ink-500">
            {eaten
              ? "버리지 않고 먹은 기록이 절약 리포트에 반영됐어요."
              : "폐기 기록이 리포트의 낭비 분석에 반영됐어요."}
          </p>
          <Link href="/priority" className="btn-primary mt-3">
            다음으로 먹을 재료 보기
            <ArrowRight size={20} />
          </Link>
          <div className="flex gap-5 text-[15.5px] font-semibold text-ink-500">
            <Link href="/history" className="hover:text-ink-800 hover:underline">소비 기록</Link>
            <Link href="/fridge" className="hover:text-ink-800 hover:underline">내 냉장고</Link>
          </div>
        </div>
      </div>
    );
  }

  const level = expiryLevel(ingredient.expiresAt);

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-5">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-[17.5px] font-semibold text-ink-500 transition-colors hover:text-ink-700"
      >
        <ArrowLeft size={21} />
        뒤로
      </button>

      <div className="card overflow-hidden">
        <div
          className={`flex items-center gap-5 p-6 ${
            level === "urgent" || level === "expired"
              ? "bg-coral-50"
              : level === "soon"
                ? "bg-amberish-50"
                : "bg-warmwhite"
          }`}
        >
          <IngredientThumb
            name={ingredient.name}
            emoji={ingredient.emoji}
            className="w-24 rounded-3xl bg-white/80 text-5xl shadow-soft"
            sizes="96px"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28.5px] font-extrabold text-ink-900">{ingredient.name}</h1>
              <ExpiryBadge expiresAt={ingredient.expiresAt} size="lg" />
            </div>
            <p className="mt-1 text-[17.5px] font-medium text-ink-700">
              {friendlyExpiryText(ingredient.expiresAt)}
            </p>
            <p className="mt-0.5 text-[16.5px] text-ink-500">
              {STORAGE_LABELS[ingredient.storage]} 보관 · {CATEGORY_LABELS[ingredient.category]} ·{" "}
              {formatAmount(ingredient.quantity, ingredient.unit)} 남음
            </p>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* 핵심 행동 */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => eat(ingredient)} className="btn-primary">
              <Check size={21} />
              먹었어요
            </button>
            <button
              type="button"
              onClick={() => discard(ingredient)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-coral-100 bg-coral-50 px-4 py-2.5 text-[18.5px] font-semibold text-coral-500 transition-all duration-200 hover:bg-coral-100 active:scale-[0.98]"
            >
              <Trash2 size={21} />
              버렸어요
            </button>
          </div>
          <Link href={`/recipes?with=${encodeURIComponent(ingredient.name)}`} className="btn-soft w-full">
            <ChefHat size={21} />
            {ingredient.name}(으)로 만들 수 있는 요리 보기
          </Link>

          <dl className="grid grid-cols-2 gap-3 text-[16.5px]">
            <div className="rounded-2xl bg-warmwhite p-3.5">
              <dt className="text-ink-400">구매일</dt>
              <dd className="mt-0.5 font-bold text-ink-700">{formatKoreanDate(ingredient.purchasedAt)}</dd>
            </div>
            <div className="rounded-2xl bg-warmwhite p-3.5">
              <dt className="text-ink-400">유통기한</dt>
              <dd className="mt-0.5 font-bold text-ink-700">
                {ingredient.expiresAt ? formatKoreanDate(ingredient.expiresAt) : "정보 없음"}
              </dd>
            </div>
          </dl>

          {ingredient.memo && (
            <div className="rounded-2xl bg-warmwhite p-3.5 text-[16.5px]">
              <p className="text-ink-400">메모</p>
              <p className="mt-0.5 font-medium text-ink-700">{ingredient.memo}</p>
            </div>
          )}

          {lastUse && (
            <p className="text-[15.5px] text-ink-500">
              지난번 {ingredient.name}은(는) {relativeDay(lastUse.date)}{" "}
              {lastUse.via ? `‘${lastUse.via}’에 썼어요.` : "그대로 먹었어요."}
            </p>
          )}

          {/* 재고 수정 — 기록 없이 수량만 바로잡을 때 */}
          <div className="rounded-2xl border border-ink-300/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[16.5px] font-semibold text-ink-700">수량 바로잡기</p>
                <p className="text-[14.5px] text-ink-400">실제로 먹었다면 ‘먹었어요’로 기록해야 리포트에 반영돼요.</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  aria-label="수량 줄이기"
                  onClick={() => changeQuantity(ingredient.id, -1)}
                  disabled={ingredient.quantity <= 1}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-ink-300/40 bg-white text-ink-700 transition-all active:scale-95 disabled:opacity-30"
                >
                  <Minus size={20} />
                </button>
                <p className="min-w-[64px] text-center text-[20.5px] font-extrabold tabular-nums text-ink-900">
                  {formatAmount(ingredient.quantity)}
                  <span className="ml-0.5 text-[15.5px] font-semibold text-ink-400">{ingredient.unit}</span>
                </p>
                <button
                  type="button"
                  aria-label="수량 늘리기"
                  onClick={() => changeQuantity(ingredient.id, 1)}
                  className="grid h-11 w-11 place-items-center rounded-xl border border-ink-300/40 bg-white text-ink-700 transition-all active:scale-95"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
          </div>

          <p className="text-[14.5px] leading-relaxed text-ink-400">
            표시된 소비기한·유통기한 정보를 확인해주세요. 보관상태가 좋지 않다면 섭취하지 않는 것이 좋습니다.
          </p>
        </div>
      </div>

      {relatedRecipes.length > 0 && (
        <section>
          <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">
            {ingredient.name}(으)로 만들 수 있어요
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedRecipes.map((m) => (
              <RecipeCard key={m.recipe.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {actionSheet}
    </div>
  );
}
