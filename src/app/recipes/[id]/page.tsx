"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  ChefHat,
  Clock3,
  Gauge,
  Plus,
  Users,
} from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { matchRecipe } from "@/lib/recipe-matcher";
import { dDayLabel } from "@/lib/expiry-calculator";
import { ingredientImage, recipeImage } from "@/lib/images";
import EmptyState from "@/components/EmptyState";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { ready, cookRecipe, addShoppingItem, showToast, state } = useStore();
  const fridge = useFridge();
  const [cooked, setCooked] = useState(false);

  const recipe = RECIPES.find((r) => r.id === id);
  const match = useMemo(
    () => (recipe ? matchRecipe(recipe, fridge) : null),
    [recipe, fridge]
  );

  if (!ready) {
    return <div className="mx-auto max-w-5xl"><div className="skeleton h-64 w-full" /></div>;
  }

  if (!recipe || !match) {
    return (
      <div className="mx-auto max-w-5xl">
        <EmptyState
          emoji="🍳"
          title="레시피를 찾지 못했어요"
          ctaLabel="레시피 추천으로 가기"
          ctaHref="/recipes"
        />
      </div>
    );
  }

  const inShopping = (name: string) =>
    state.shopping.some((s) => s.name === name && !s.checked);

  const handleCook = () => {
    const deductions = match.matched
      .filter((m) => m.owned && m.ingredient && m.consume > 0)
      .map((m) => ({ ingredientId: m.ingredient!.id, amount: m.consume }));
    cookRecipe(recipe.name, deductions);
    setCooked(true);
    showToast(`${recipe.name} 완성! 냉장고를 업데이트했어요`, "🎉");
  };

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-5">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-[17.6px] font-semibold text-ink-500 transition-colors hover:text-ink-700"
      >
        <ArrowLeft size={21} />
        뒤로
      </button>

      <div className="card overflow-hidden">
        {/* 레시피 대표이미지 (16:9) */}
        <div className="relative aspect-video w-full bg-gradient-to-br from-fresh-50 via-mint-50 to-cream">
          <Image
            src={recipeImage(recipe.image)}
            alt={recipe.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-contain p-4"
          />
          <span className="absolute left-4 top-4 rounded-chip bg-white/90 px-3 py-1 text-[15.6px] font-bold text-fresh-600 shadow-soft">
            보유 재료 {match.matchPercent}%
          </span>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <h1 className="text-[28.6px] font-extrabold tracking-tight text-ink-900">
              {recipe.name}
            </h1>
            <p className="mt-1 text-[17.6px] text-ink-500">{recipe.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="chip bg-fresh-50 text-fresh-700">
                <Clock3 size={18} /> {recipe.minutes}분
              </span>
              <span className="chip bg-fresh-50 text-fresh-700">
                <Gauge size={18} /> {recipe.difficulty}
              </span>
              <span className="chip bg-fresh-50 text-fresh-700">
                <Users size={18} /> {recipe.servings}인분
              </span>
            </div>
          </div>

          {/* 재료 */}
          <section>
            <h2 className="mb-2.5 text-[20.2px] font-extrabold text-ink-900">재료</h2>
            <ul className="space-y-2">
              {match.matched.map((m) => {
                const urgent = m.owned && m.dLeft !== null && m.dLeft <= 3;
                return (
                  <li
                    key={m.name}
                    className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${
                      urgent
                        ? "bg-amberish-50"
                        : m.owned
                          ? "bg-fresh-50/60"
                          : "bg-warmwhite"
                    }`}
                  >
                    <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                      {ingredientImage(m.name) ? (
                        <Image
                          src={ingredientImage(m.name)!}
                          alt={m.name}
                          fill
                          sizes="44px"
                          className={`object-contain p-1 ${
                            m.owned ? "" : "opacity-40 grayscale"
                          }`}
                        />
                      ) : (
                        <span className="text-lg">🧺</span>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-white ${
                          m.owned ? "bg-fresh-500 text-white" : "bg-ink-300/50 text-white"
                        }`}
                      >
                        <Check size={14} strokeWidth={3.5} />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[18.2px] font-bold text-ink-900">
                        {m.name}{" "}
                        <span className="font-medium text-ink-400">{m.amount}</span>
                      </p>
                      {urgent && (
                        <p className="text-[15px] font-semibold text-amberish-600">
                          먼저 소비하면 좋아요 · {dDayLabel(m.ingredient?.expiresAt ?? null)}
                        </p>
                      )}
                      {!m.owned && (
                        <p className="text-[15px] text-ink-400">냉장고에 없어요</p>
                      )}
                    </div>
                    {!m.owned &&
                      (inShopping(m.name) ? (
                        <span className="text-[15.6px] font-semibold text-fresh-600">
                          장보기에 있어요 ✓
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            addShoppingItem(m.name, recipe.name);
                            showToast(`${m.name}을(를) 장보기 목록에 담았어요`, "🛒");
                          }}
                          className="inline-flex shrink-0 items-center gap-1 rounded-chip border border-fresh-200 bg-white px-2.5 py-1 text-[15.6px] font-semibold text-fresh-600 transition-all hover:bg-fresh-50 active:scale-95"
                        >
                          <Plus size={17} />
                          장보기
                        </button>
                      ))}
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 조리방법 */}
          <section>
            <h2 className="mb-2.5 text-[20.2px] font-extrabold text-ink-900">조리방법</h2>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fresh-100 text-[16.2px] font-extrabold text-fresh-700">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-[18.2px] leading-relaxed text-ink-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {cooked ? (
            <div className="animate-pop-in rounded-2xl bg-fresh-50 p-5 text-center">
              <p className="text-3xl">🎉</p>
              <p className="mt-1 text-[19.5px] font-extrabold text-fresh-700">맛있게 드세요!</p>
              <p className="mt-0.5 text-[16.2px] text-ink-500">
                사용한 재료만큼 냉장고에서 차감했어요.
              </p>
              <div className="mt-4 flex gap-2">
                <Link href="/fridge" className="btn-ghost flex-1">
                  냉장고 확인
                </Link>
                <Link href="/report" className="btn-primary flex-1">
                  절약 기록 보기
                </Link>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleCook}
              disabled={match.ownedCount === 0}
              className="btn-primary w-full py-3.5 text-[19.5px]"
            >
              <ChefHat size={23} />
              요리했어요
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
