"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChefHat,
  Clock3,
  Gauge,
  Plus,
  ShoppingBasket,
  Users,
} from "lucide-react";
import { useFridge, useStore, useUndoToast } from "@/lib/store";
import { RECIPES, isRescue } from "@/lib/demo-data";
import { matchRecipe } from "@/lib/recipe-matcher";
import { daysLeft, dDayLabel, formatWon } from "@/lib/expiry-calculator";
import { ingredientImage, recipeImage } from "@/lib/images";
import { formatAmount } from "@/lib/quantity";
import { lastCookedByRecipe, relativeDay } from "@/lib/stats";
import EmptyState from "@/components/EmptyState";

interface CookLine {
  name: string;
  unit: string;
  before: number;
  used: number;
  after: number;
}

interface CookResult {
  lines: CookLine[];
  saved: number;
  rescued: number;
  usedUp: string[];
  /** 되돌리기 감지용: 요리 직후 기대되는 요리 기록 수 */
  cooksLen: number;
}

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { ready, cookRecipe, addShoppingItem, addShoppingItems, showToast, state } = useStore();
  const undoToast = useUndoToast();
  const fridge = useFridge();
  const [result, setResult] = useState<CookResult | null>(null);
  const [usedUpQueued, setUsedUpQueued] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const recipe = RECIPES.find((r) => r.id === id);
  const match = useMemo(
    () => (recipe ? matchRecipe(recipe, fridge) : null),
    [recipe, fridge]
  );
  const lastCooked = useMemo(
    () => (recipe ? lastCookedByRecipe(state.cooks).get(recipe.id) : undefined),
    [recipe, state.cooks]
  );
  const urgentLeft = useMemo(
    () => fridge.filter((i) => {
      const d = daysLeft(i.expiresAt);
      return d !== null && d <= 2;
    }).length,
    [fridge]
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

  const pendingNames = new Set(state.shopping.filter((s) => !s.checked).map((s) => s.name));
  const missingToAdd = match.missing.filter((m) => !pendingNames.has(m.name));
  // 되돌리기로 요리 기록이 사라지면 결과 패널도 닫는다
  const showResult = result !== null && state.cooks.length >= result.cooksLen;

  const handleCook = () => {
    const lines: (CookLine & { ingredientId: string })[] = match.matched
      .filter((m) => m.owned && m.ingredient && m.consume > 0)
      .map((m) => {
        const ing = m.ingredient!;
        const used = Math.min(m.consume, ing.quantity);
        return {
          ingredientId: ing.id,
          name: ing.name,
          unit: ing.unit,
          before: ing.quantity,
          used,
          after: Math.round((ing.quantity - used) * 100) / 100,
        };
      });
    const saved = match.matched
      .filter((m) => m.owned && m.ingredient && m.consume > 0)
      .reduce((sum, m) => {
        const ing = m.ingredient!;
        return sum + Math.round((ing.price * Math.min(m.consume, ing.quantity)) / ing.quantity);
      }, 0);
    const rescued = match.matched.filter((m) => m.owned && m.consume > 0 && isRescue(m.dLeft)).length;

    const token = cookRecipe(
      { id: recipe.id, name: recipe.name },
      lines.map((l) => ({ ingredientId: l.ingredientId, amount: l.used }))
    );
    setResult({
      lines,
      saved,
      rescued,
      usedUp: lines.filter((l) => l.after <= 0).map((l) => l.name),
      cooksLen: state.cooks.length + 1,
    });
    setUsedUpQueued(false);
    undoToast(`${recipe.name} 완성! 재료 ${lines.length}가지를 냉장고에서 뺐어요`, "🎉", token);
    requestAnimationFrame(() =>
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    );
  };

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
        {/* 레시피 대표이미지 (16:9) */}
        <div className="relative aspect-video w-full bg-cream">
          <Image
            src={recipeImage(recipe.image)}
            alt={recipe.name}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 672px"
            className="object-contain p-4"
          />
          <span className="absolute left-4 top-4 rounded-chip bg-white/90 px-3 py-1 text-[15.5px] font-bold text-ink-700 shadow-soft">
            보유 재료 {match.matchPercent}%
          </span>
        </div>

        <div className="space-y-6 p-5 sm:p-6">
          <div>
            <h1 className="text-[28.5px] font-extrabold tracking-tight text-ink-900">
              {recipe.name}
            </h1>
            <p className="mt-1 text-[17.5px] text-ink-500">{recipe.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[16.5px] text-ink-500">
              <span className="inline-flex items-center gap-1.5"><Clock3 size={18} /> {recipe.minutes}분</span>
              <span className="inline-flex items-center gap-1.5"><Gauge size={18} /> {recipe.difficulty}</span>
              <span className="inline-flex items-center gap-1.5"><Users size={18} /> {recipe.servings}인분</span>
              {lastCooked && (
                <span className="font-semibold text-ink-600">· {relativeDay(lastCooked)} 만들었어요</span>
              )}
            </div>
          </div>

          {/* 재료 */}
          <section>
            <div className="mb-2.5 flex items-end justify-between gap-3">
              <h2 className="text-[20.5px] font-extrabold text-ink-900">재료</h2>
              {missingToAdd.length >= 2 && (
                <button
                  type="button"
                  onClick={() => {
                    addShoppingItems(missingToAdd.map((m) => m.name), recipe.name);
                    showToast(`부족한 재료 ${missingToAdd.length}개를 장보기에 담았어요`, "🛒");
                  }}
                  className="inline-flex shrink-0 items-center gap-1 text-[15.5px] font-semibold text-fresh-700 hover:underline"
                >
                  <ShoppingBasket size={18} />
                  부족한 재료 모두 담기
                </button>
              )}
            </div>
            <ul className="space-y-2">
              {match.matched.map((m) => {
                const urgent = m.owned && m.dLeft !== null && m.dLeft <= 3;
                const ing = m.ingredient;
                return (
                  <li
                    key={m.name}
                    className={`flex items-center gap-3 rounded-2xl p-3 transition-colors ${
                      urgent || m.short ? "bg-amberish-50" : m.owned ? "bg-fresh-50/60" : "bg-warmwhite"
                    }`}
                  >
                    <span className="relative grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-white">
                      {ingredientImage(m.name) ? (
                        <Image
                          src={ingredientImage(m.name)!}
                          alt={m.name}
                          fill
                          sizes="56px"
                          className={`object-contain p-1 ${m.owned ? "" : "opacity-40 grayscale"}`}
                        />
                      ) : (
                        <span className="text-lg">🧺</span>
                      )}
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 grid h-6 w-6 place-items-center rounded-full border-2 border-white text-white ${
                          m.owned ? "bg-fresh-500" : "bg-ink-300"
                        }`}
                      >
                        <Check size={14} strokeWidth={3.5} />
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[18.5px] font-bold text-ink-900">
                        {m.name} <span className="font-medium text-ink-400">{m.amount}</span>
                      </p>
                      {m.owned && ing && (
                        <p
                          className={`text-[15.5px] ${
                            m.short || urgent ? "font-semibold text-amberish-600" : "text-ink-500"
                          }`}
                        >
                          냉장고 {formatAmount(ing.quantity, ing.unit)}
                          {m.short && " · 조금 부족해요"}
                          {!m.short && urgent && ` · 먼저 소비하면 좋아요 ${dDayLabel(ing.expiresAt)}`}
                          {m.consume === 0 && " · 양념은 차감하지 않아요"}
                        </p>
                      )}
                      {!m.owned && <p className="text-[15.5px] text-ink-400">냉장고에 없어요</p>}
                    </div>
                    {!m.owned &&
                      (pendingNames.has(m.name) ? (
                        <Link
                          href="/shopping"
                          className="shrink-0 text-[15.5px] font-semibold text-fresh-700 hover:underline"
                        >
                          장보기에 있어요 ✓
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            addShoppingItem(m.name, recipe.name);
                            showToast(`${m.name}을(를) 장보기 목록에 담았어요`, "🛒");
                          }}
                          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl border border-ink-300/40 bg-white px-3 text-[15.5px] font-semibold text-ink-700 transition-all hover:border-fresh-300 active:scale-95"
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
            <h2 className="mb-2.5 text-[20.5px] font-extrabold text-ink-900">조리방법</h2>
            <ol className="space-y-3">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fresh-100 text-[16.5px] font-extrabold text-fresh-700">
                    {i + 1}
                  </span>
                  <p className="pt-0.5 text-[18.5px] leading-relaxed text-ink-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {showResult && result ? (
            <div ref={resultRef} className="animate-pop-in rounded-2xl border border-fresh-100 bg-fresh-50/70 p-5">
              <p className="text-[20.5px] font-extrabold text-ink-900">맛있게 드세요! 🎉</p>
              <p className="mt-0.5 text-[16.5px] text-ink-600">
                {formatWon(result.saved)}어치 재료를 버리지 않고 썼어요
                {result.rescued > 0 && ` · 임박 재료 ${result.rescued}개를 살렸어요`}
              </p>

              {/* 무엇이 얼마나 줄었는지 */}
              {result.lines.length > 0 && (
                <ul className="mt-4 divide-y divide-fresh-100 rounded-xl bg-white px-4">
                  {result.lines.map((l) => (
                    <li key={l.name} className="flex items-center justify-between gap-3 py-2.5 text-[16.5px]">
                      <span className="font-semibold text-ink-800">{l.name}</span>
                      <span className="tabular-nums text-ink-500">
                        {formatAmount(l.before, l.unit)}
                        <ArrowRight size={15} className="mx-1.5 inline -translate-y-px" />
                        <span className={l.after <= 0 ? "font-bold text-coral-500" : "font-bold text-ink-900"}>
                          {l.after <= 0 ? "다 썼어요" : formatAmount(l.after, l.unit)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {/* 다음 행동: 하나만 강조 */}
              <div className="mt-4 space-y-2">
                {result.usedUp.length > 0 && !usedUpQueued ? (
                  <button
                    type="button"
                    onClick={() => {
                      addShoppingItems(result.usedUp, recipe.name);
                      setUsedUpQueued(true);
                      showToast(`다 쓴 재료 ${result.usedUp.length}개를 장보기에 담았어요`, "🛒");
                    }}
                    className="btn-primary w-full"
                  >
                    <ShoppingBasket size={20} />
                    다 쓴 재료 장보기에 담기 ({result.usedUp.join(", ")})
                  </button>
                ) : urgentLeft > 0 ? (
                  <Link href="/priority" className="btn-primary w-full">
                    남은 급한 재료 {urgentLeft}개 보기
                    <ArrowRight size={20} />
                  </Link>
                ) : (
                  <Link href="/fridge" className="btn-primary w-full">
                    냉장고 확인하기
                    <ArrowRight size={20} />
                  </Link>
                )}
                <div className="flex justify-center gap-5 pt-1 text-[15.5px] font-semibold text-ink-500">
                  <Link href="/history" className="hover:text-ink-800 hover:underline">소비 기록</Link>
                  <Link href="/report" className="hover:text-ink-800 hover:underline">절약 리포트</Link>
                  {usedUpQueued && (
                    <Link href="/shopping" className="hover:text-ink-800 hover:underline">장보기 목록</Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={handleCook}
                disabled={match.ownedCount === 0}
                className="btn-primary w-full py-3.5 text-[20.5px]"
              >
                <ChefHat size={23} />
                요리했어요
              </button>
              <p className="mt-2 text-center text-[14.5px] text-ink-400">
                누르면 사용한 재료만큼 냉장고에서 빠지고 소비 기록에 남아요.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
