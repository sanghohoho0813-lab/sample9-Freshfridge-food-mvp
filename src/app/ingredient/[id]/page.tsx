"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, ChefHat, Minus, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import {
  expiryLevel,
  formatKoreanDate,
  friendlyExpiryText,
} from "@/lib/expiry-calculator";
import { CATEGORY_LABELS, STORAGE_LABELS, type WasteReason } from "@/lib/types";
import ExpiryBadge from "@/components/ExpiryBadge";
import IngredientThumb from "@/components/IngredientThumb";
import DiscardModal from "@/components/DiscardModal";
import EmptyState from "@/components/EmptyState";
import RecipeCard from "@/components/RecipeCard";

export default function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const {
    ready,
    state,
    changeQuantity,
    consumeIngredient,
    discardIngredient,
    showToast,
  } = useStore();
  const [showDiscard, setShowDiscard] = useState(false);

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

  if (!ready) {
    return <div className="mx-auto max-w-2xl"><div className="skeleton h-64 w-full" /></div>;
  }

  if (!ingredient || ingredient.status === "consumed" || ingredient.status === "discarded") {
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState
          emoji="🧺"
          title="이 식재료는 냉장고에 없어요"
          description="이미 먹었거나 정리된 식재료예요."
          ctaLabel="내 냉장고로 가기"
          ctaHref="/fridge"
        />
      </div>
    );
  }

  const level = expiryLevel(ingredient.expiresAt);

  return (
    <div className="mx-auto max-w-2xl animate-fade-up space-y-5">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-[13.5px] font-semibold text-ink-500 transition-colors hover:text-ink-700"
      >
        <ArrowLeft size={16} />
        뒤로
      </button>

      <div className="card overflow-hidden">
        {/* 식재료 이미지 (1:1) */}
        <div
          className={`flex items-center gap-5 p-6 ${
            level === "urgent" || level === "expired"
              ? "bg-coral-50"
              : level === "soon"
                ? "bg-amberish-50"
                : "bg-fresh-50"
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
              <h1 className="text-[22px] font-extrabold text-ink-900">{ingredient.name}</h1>
              <ExpiryBadge expiresAt={ingredient.expiresAt} size="lg" />
            </div>
            <p className="mt-1 text-[13.5px] font-medium text-ink-700">
              {friendlyExpiryText(ingredient.expiresAt)}
            </p>
            <p className="mt-0.5 text-[12.5px] text-ink-500">
              {STORAGE_LABELS[ingredient.storage]} 보관 · {CATEGORY_LABELS[ingredient.category]}
            </p>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {/* 수량 변경 */}
          <div className="flex items-center justify-between rounded-2xl bg-warmwhite p-4">
            <p className="text-[13.5px] font-semibold text-ink-700">남은 수량</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                aria-label="수량 줄이기"
                onClick={() => changeQuantity(ingredient.id, -1)}
                disabled={ingredient.quantity <= 0}
                className="grid h-9 w-9 place-items-center rounded-xl border border-ink-300/40 bg-white text-ink-700 transition-all hover:border-fresh-300 active:scale-95 disabled:opacity-30"
              >
                <Minus size={16} />
              </button>
              <p className="min-w-14 text-center text-[17px] font-extrabold text-ink-900">
                {ingredient.quantity}
                <span className="ml-0.5 text-[12px] font-semibold text-ink-400">
                  {ingredient.unit}
                </span>
              </p>
              <button
                type="button"
                aria-label="수량 늘리기"
                onClick={() => changeQuantity(ingredient.id, 1)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-ink-300/40 bg-white text-ink-700 transition-all hover:border-fresh-300 active:scale-95"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            <div className="rounded-2xl bg-warmwhite p-3.5">
              <dt className="text-ink-400">구매일</dt>
              <dd className="mt-0.5 font-bold text-ink-700">
                {formatKoreanDate(ingredient.purchasedAt)}
              </dd>
            </div>
            <div className="rounded-2xl bg-warmwhite p-3.5">
              <dt className="text-ink-400">유통기한</dt>
              <dd className="mt-0.5 font-bold text-ink-700">
                {ingredient.expiresAt ? formatKoreanDate(ingredient.expiresAt) : "정보 없음"}
              </dd>
            </div>
          </dl>

          {ingredient.memo && (
            <div className="rounded-2xl bg-amberish-50/60 p-3.5 text-[13px]">
              <p className="text-ink-400">메모</p>
              <p className="mt-0.5 font-medium text-ink-700">{ingredient.memo}</p>
            </div>
          )}

          <p className="text-[11.5px] leading-relaxed text-ink-400">
            표시된 소비기한·유통기한 정보를 확인해주세요. 보관상태가 좋지 않다면 섭취하지 않는
            것이 좋습니다.
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                consumeIngredient(ingredient.id);
                showToast(`${ingredient.name}, 맛있게 드셨네요!`, "✅");
                router.push("/fridge");
              }}
              className="btn-primary"
            >
              <Check size={16} />
              먹었어요
            </button>
            <button
              type="button"
              onClick={() => setShowDiscard(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-coral-100 bg-coral-50 px-4 py-2.5 text-sm font-semibold text-coral-500 transition-all duration-200 hover:bg-coral-100 active:scale-[0.98]"
            >
              <Trash2 size={16} />
              버렸어요
            </button>
          </div>
          <Link href="/recipes" className="btn-soft w-full">
            <ChefHat size={16} />이 재료로 레시피 찾기
          </Link>
        </div>
      </div>

      {relatedRecipes.length > 0 && (
        <section>
          <h2 className="mb-3 text-[16px] font-extrabold text-ink-900">
            {ingredient.name}(으)로 만들 수 있어요
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {relatedRecipes.map((m) => (
              <RecipeCard key={m.recipe.id} match={m} />
            ))}
          </div>
        </section>
      )}

      {showDiscard && (
        <DiscardModal
          ingredientName={ingredient.name}
          onClose={() => setShowDiscard(false)}
          onConfirm={(reason: WasteReason) => {
            discardIngredient(ingredient.id, reason);
            setShowDiscard(false);
            showToast("기록했어요. 다음엔 더 알뜰하게!", "📝");
            router.push("/fridge");
          }}
        />
      )}
    </div>
  );
}
