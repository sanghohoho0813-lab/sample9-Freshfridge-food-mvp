"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChefHat,
  CircleCheck,
  Clock3,
  Gauge,
  Plus,
  ShoppingBasket,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useFridge, useStore, useUndoToast } from "@/lib/store";
import { RECIPES, isRescue, ingredientDefaults } from "@/lib/demo-data";
import { explainMatch, matchRecipe } from "@/lib/recipe-matcher";
import { daysLeft, dDayLabel, formatWon } from "@/lib/expiry-calculator";
import { recipeImage } from "@/lib/images";
import { formatAmount } from "@/lib/quantity";
import { lastCookedByRecipe, monthCompare, relativeDay } from "@/lib/stats";
import { frequentlyEaten } from "@/lib/insights";
import { josa } from "@/lib/text";
import EmptyState from "@/components/EmptyState";
import IngredientThumb from "@/components/IngredientThumb";
import BackButton from "@/components/ui/BackButton";
import ChoiceChip from "@/components/ui/ChoiceChip";

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

export default function RecipeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, cookRecipe, addShoppingItem, addShoppingItems, state } = useStore();
  const undoToast = useUndoToast();
  const fridge = useFridge();
  const [result, setResult] = useState<CookResult | null>(null);
  /** 다 쓴 재료 중 다시 살 것 (요리 직후 고른다) */
  const [rebuy, setRebuy] = useState<Set<string>>(new Set());
  const [rebuyDone, setRebuyDone] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const recipe = RECIPES.find((r) => r.id === id);
  const match = useMemo(() => (recipe ? matchRecipe(recipe, fridge) : null), [recipe, fridge]);
  const lastCooked = useMemo(
    () => (recipe ? lastCookedByRecipe(state.cooks).get(recipe.id) : undefined),
    [recipe, state.cooks]
  );
  const month = useMemo(() => monthCompare(state.logs, state.cooks), [state.logs, state.cooks]);
  const urgentLeft = useMemo(
    () =>
      fridge.filter((i) => {
        const d = daysLeft(i.expiresAt);
        return d !== null && d <= 3;
      }).length,
    [fridge]
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="skeleton h-64 w-full" />
      </div>
    );
  }

  if (!recipe || !match) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackButton fallback="/recipes" />
        <EmptyState
          icon={ChefHat}
          title="레시피를 찾지 못했어요"
          description="주소가 바뀌었거나 없는 레시피예요."
          ctaLabel="레시피 추천으로 가기"
          ctaHref="/recipes"
        />
      </div>
    );
  }

  const why = explainMatch(match);
  const pendingNames = new Set(state.shopping.filter((s) => !s.checked).map((s) => s.name));
  const missingToAdd = match.missing.filter((m) => !pendingNames.has(m.name));
  // 이 요리로 쓰게 될 냉장고 재료의 금액 (레시피 분량만큼 비례)
  const usesWorth = match.matched
    .filter((m) => m.owned && m.ingredient && m.consume > 0)
    .reduce((sum, m) => {
      const ing = m.ingredient!;
      return sum + Math.round((ing.price * Math.min(m.consume, ing.quantity)) / ing.quantity);
    }, 0);
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
    const rescued = match.matched.filter((m) => m.owned && m.consume > 0 && isRescue(m.dLeft)).length;
    const token = cookRecipe(
      { id: recipe.id, name: recipe.name },
      lines.map((l) => ({ ingredientId: l.ingredientId, amount: l.used }))
    );
    const usedUp = lines.filter((l) => l.after <= 0).map((l) => l.name);
    // 다시 살 재료 기본 선택: 자주 먹는 재료만 (나머지는 사용자가 고른다)
    const frequent = frequentlyEaten(state.logs);
    setRebuy(new Set(usedUp.filter((n) => frequent.has(n))));
    setRebuyDone(false);
    setResult({ lines, saved: usesWorth, rescued, usedUp, cooksLen: state.cooks.length + 1 });
    undoToast(`요리 완료 · 재료 ${lines.length}가지를 뺐어요`, token);
    requestAnimationFrame(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <BackButton fallback="/recipes" />

      <div className="card overflow-hidden">
        {/* 레시피 대표이미지 (16:9) */}
        <div className="relative aspect-video w-full bg-cream">
          <Image
            src={recipeImage(recipe.image)}
            alt={`${recipe.name} 완성 사진`}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 768px"
            className="object-contain p-4"
          />
        </div>

        <div className="space-y-7 p-4 sm:p-6">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink-900 sm:text-[28.5px]">
              {recipe.name}
            </h1>
            <p className="mt-1 text-[17px] text-ink-500">{recipe.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[16px] text-ink-600">
              <span className="inline-flex items-center gap-1.5">
                <Clock3 size={18} aria-hidden /> {recipe.minutes}분
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Gauge size={18} aria-hidden /> {recipe.difficulty}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={18} aria-hidden /> {recipe.servings}인분
              </span>
              {lastCooked && <span className="text-ink-500">· {relativeDay(lastCooked)} 만들었어요</span>}
            </div>
          </div>

          {/* 왜 이 요리인지 — 데이터로 확인되는 사실만 */}
          {!showResult && (
            <section aria-labelledby="why-title" className="rounded-2xl bg-warmwhite p-4">
              <h2 id="why-title" className="text-[16.5px] font-bold text-ink-700">
                지금 이 요리를 하면
              </h2>
              <ul className="mt-2 space-y-1.5 text-[16.5px] leading-snug text-ink-800">
                <li className="flex gap-2">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-amberish-500" aria-hidden />
                  {match.urgentOwned.length > 0 ? (
                    <span>
                      기한이 급한{" "}
                      <b className="text-amberish-700">
                        {match.urgentOwned
                          .map((u) => `${u.name}(${dDayLabel(u.ingredient?.expiresAt ?? null)})`)
                          .join(" · ")}
                      </b>{" "}
                      사용
                    </span>
                  ) : (
                    <span>기한이 급한 재료는 쓰지 않아요</span>
                  )}
                </li>
                <li className="flex gap-2">
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-fresh-500" aria-hidden />
                  <span>
                    {why.ready
                      ? "필요한 재료가 모두 냉장고에 있어요"
                      : `${why.shopping} (${match.missingEssential.map((m) => m.name).join(", ")})`}
                    {usesWorth > 0 && ` · 냉장고 재료 ${formatWon(usesWorth)}어치를 써요`}
                  </span>
                </li>
              </ul>
            </section>
          )}

          {/* 재료 */}
          <section>
            <div className="mb-3 flex items-end justify-between gap-3">
              <h2 className="text-[20.5px] font-extrabold text-ink-900">
                재료{" "}
                <span className="text-[16.5px] font-bold tabular-nums text-ink-400">
                  {match.ownedCount}/{match.matched.length} 있음
                </span>
              </h2>
              {/* 요리 직후엔 아래 '다 쓴 재료, 다시 살까요?'에서 고르므로 묶음 담기는 숨긴다 */}
              {missingToAdd.length >= 2 && !(showResult && result) && (
                <button
                  type="button"
                  onClick={() => {
                    const token = addShoppingItems(
                      missingToAdd.map((m) => m.name),
                      { fromRecipe: recipe.name }
                    );
                    undoToast(`없는 재료 ${missingToAdd.length}개를 장보기에 담았어요`, token);
                  }}
                  className="-mr-2 inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl px-2 text-[15.5px] font-semibold text-fresh-700 hover:bg-fresh-50"
                >
                  <ShoppingBasket size={18} aria-hidden />
                  없는 재료 모두 담기
                </button>
              )}
            </div>
            <ul className="divide-y divide-ink-300/20 overflow-hidden rounded-2xl border border-ink-300/25">
              {match.matched.map((m) => {
                const urgent = m.owned && m.dLeft !== null && m.dLeft <= 3;
                const ing = m.ingredient;
                return (
                  <li key={m.name} className="flex items-center gap-3 bg-white px-3 py-2.5 sm:px-4">
                    <IngredientThumb
                      name={m.name}
                      category={ing?.category ?? ingredientDefaults(m.name).category}
                      className={`h-12 w-12 rounded-xl bg-warmwhite ${m.owned ? "" : "opacity-50 grayscale"}`}
                      sizes="48px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[18px] font-bold text-ink-900">
                        {m.name} <span className="font-medium text-ink-500">{m.amount}</span>
                        {!m.essential && <span className="ml-1 text-[14px] font-semibold text-ink-400">선택</span>}
                      </p>
                      {m.owned && ing ? (
                        <p
                          className={`text-[15.5px] ${
                            m.short || urgent ? "font-semibold text-amberish-700" : "text-fresh-700"
                          }`}
                        >
                          {m.short
                            ? `냉장고 ${formatAmount(ing.quantity, ing.unit)} · 조금 부족해요`
                            : urgent
                              ? `냉장고 ${formatAmount(ing.quantity, ing.unit)} · ${dDayLabel(ing.expiresAt)} 먼저 쓰기`
                              : `냉장고 ${formatAmount(ing.quantity, ing.unit)}`}
                        </p>
                      ) : (
                        <p className="text-[15.5px] text-ink-500">
                          {m.essential ? "냉장고에 없어요" : "없어도 만들 수 있어요"}
                        </p>
                      )}
                    </div>
                    {!m.owned &&
                      (pendingNames.has(m.name) ? (
                        <Link
                          href="/shopping"
                          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 px-1 text-[15.5px] font-semibold text-fresh-700 hover:underline"
                        >
                          <Check size={17} aria-hidden />
                          담았어요
                        </Link>
                      ) : (
                        <button
                          type="button"
                          aria-label={`${m.name} 장보기에 담기`}
                          onClick={() => {
                            const token = addShoppingItem(m.name, { fromRecipe: recipe.name });
                            undoToast(`${josa(m.name, "을/를")} 장보기에 담았어요`, token);
                          }}
                          className="inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-xl border border-ink-300/40 bg-white px-3 text-[15.5px] font-semibold text-ink-700 transition-all hover:border-fresh-300 active:scale-95"
                        >
                          <Plus size={17} aria-hidden />
                          장보기
                        </button>
                      ))}
                  </li>
                );
              })}
            </ul>
            {match.matched.some((m) => m.owned && m.consume === 0) && (
              <p className="mt-2 text-[15px] text-ink-500">양념류는 요리해도 수량이 줄지 않아요.</p>
            )}
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
                  <p className="pt-0.5 text-[18px] leading-relaxed text-ink-700">{step}</p>
                </li>
              ))}
            </ol>
          </section>

          {showResult && result ? (
            <CookDone
              innerRef={resultRef}
              recipeName={recipe.name}
              result={result}
              monthSaved={month.current.savedAmount}
              month={month.span.month}
              rebuy={rebuy}
              setRebuy={setRebuy}
              rebuyDone={rebuyDone}
              onRebuy={() => {
                const names = result.usedUp.filter((n) => rebuy.has(n));
                if (names.length === 0) return;
                const token = addShoppingItems(names, { fromRecipe: recipe.name, restock: true });
                setRebuyDone(true);
                undoToast(`${names.length}개를 장보기에 담았어요`, token);
              }}
              urgentLeft={urgentLeft}
            />
          ) : (
            <div>
              {!why.ready && match.ownedCount > 0 && (
                <p className="mb-2 flex items-start gap-1.5 text-[15.5px] text-amberish-700">
                  <TriangleAlert size={17} className="mt-[3px] shrink-0" aria-hidden />
                  {josa(match.missingEssential.map((m) => m.name).join(", "), "이/가")} 냉장고에 없어요. 그래도
                  만들었다면 있는 재료만 빠져요.
                </p>
              )}
              <button
                type="button"
                onClick={handleCook}
                disabled={match.ownedCount === 0}
                className="btn-primary min-h-[58px] w-full text-[20px]"
              >
                <ChefHat size={23} aria-hidden />
                요리했어요
              </button>
              <p className="mt-2 text-center text-[15px] text-ink-500">
                {match.ownedCount === 0
                  ? "냉장고에 있는 재료가 없어요. 먼저 장보기에 담아보세요."
                  : "쓴 만큼 냉장고에서 빠지고, 소비 기록과 리포트에 남아요."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * 요리 완료 — 차감 결과 → 다 쓴 재료 다시 사기 → 이번 달 절약 → 다음 행동.
 * 다시 살 재료는 미리 담지 않고, 고른 뒤 버튼을 눌러야 장보기에 들어간다.
 */
function CookDone({
  innerRef,
  recipeName,
  result,
  monthSaved,
  month,
  rebuy,
  setRebuy,
  rebuyDone,
  onRebuy,
  urgentLeft,
}: {
  innerRef: React.Ref<HTMLDivElement>;
  recipeName: string;
  result: CookResult;
  monthSaved: number;
  month: number;
  rebuy: Set<string>;
  setRebuy: (s: Set<string>) => void;
  rebuyDone: boolean;
  onRebuy: () => void;
  urgentLeft: number;
}) {
  return (
    <div
      ref={innerRef}
      className="animate-pop-in scroll-mt-24 space-y-4 rounded-2xl border border-fresh-100 bg-fresh-50/70 p-4 sm:p-5"
    >
      <div role="status">
        <p className="flex items-center gap-2 text-[21px] font-extrabold text-ink-900">
          <CircleCheck size={24} className="text-fresh-600" aria-hidden />
          {recipeName} 완성
        </p>
        <p className="mt-1 text-[16.5px] text-ink-700">
          냉장고 재료 <b className="tabular-nums">{formatWon(result.saved)}</b>어치를 버리지 않고 썼어요
          {result.rescued > 0 && ` · 기한 임박 재료 ${result.rescued}개를 살렸어요`}
        </p>
      </div>

      {/* 1. 무엇이 얼마나 줄었는지 */}
      {result.lines.length > 0 && (
        <ul className="divide-y divide-fresh-100 rounded-xl bg-white px-4" aria-label="냉장고에서 뺀 재료">
          {result.lines.map((l) => (
            <li key={l.name} className="flex items-center justify-between gap-3 py-2.5 text-[16.5px]">
              <span className="font-semibold text-ink-800">{l.name}</span>
              <span className="tabular-nums text-ink-500">
                {formatAmount(l.before, l.unit)}
                <ArrowRight size={15} className="mx-1.5 inline -translate-y-px" aria-hidden />
                <span className={l.after <= 0 ? "font-bold text-coral-700" : "font-bold text-ink-900"}>
                  {l.after <= 0 ? "다 씀" : formatAmount(l.after, l.unit)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* 2. 다 쓴 재료 — 다시 살 것만 골라 담기 */}
      {result.usedUp.length > 0 && (
        <div className="rounded-xl bg-white p-4">
          <p className="text-[16.5px] font-bold text-ink-900">다 쓴 재료, 다시 살까요?</p>
          {rebuyDone ? (
            <p className="mt-1.5 flex items-center gap-1.5 text-[16px] font-semibold text-fresh-700">
              <Check size={18} aria-hidden /> 장보기에 담았어요 ·{" "}
              <Link href="/shopping" className="underline underline-offset-2">
                장보기 보기
              </Link>
            </p>
          ) : (
            <>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.usedUp.map((n) => (
                  <ChoiceChip
                    key={n}
                    selected={rebuy.has(n)}
                    onClick={() => {
                      const next = new Set(rebuy);
                      if (next.has(n)) next.delete(n);
                      else next.add(n);
                      setRebuy(next);
                    }}
                  >
                    {rebuy.has(n) && <Check size={16} aria-hidden />}
                    {n}
                  </ChoiceChip>
                ))}
              </div>
              <button
                type="button"
                onClick={onRebuy}
                disabled={rebuy.size === 0}
                className="btn-primary mt-3 min-h-[52px] w-full"
              >
                <ShoppingBasket size={20} aria-hidden />
                {rebuy.size > 0 ? `${rebuy.size}개 장보기에 담기` : "다시 살 재료를 골라주세요"}
              </button>
            </>
          )}
        </div>
      )}

      {/* 3. 이번 달 누적 효과 */}
      <Link
        href="/report"
        className="flex items-center justify-between gap-3 rounded-xl bg-white px-4 py-3 transition-colors hover:bg-warmwhite"
      >
        <span className="text-[16px] text-ink-700">
          {month}월에 먹어서 아낀 금액 <b className="tabular-nums text-ink-900">{formatWon(monthSaved)}</b>
          <span className="ml-1 text-[15px] font-semibold tabular-nums text-fresh-700">+{formatWon(result.saved)}</span>
        </span>
        <ArrowRight size={18} className="shrink-0 text-ink-400" aria-hidden />
      </Link>

      {/* 4. 다음 행동 */}
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[15.5px] font-semibold text-ink-600">
        {urgentLeft > 0 ? (
          <Link href="/priority" className="inline-flex min-h-[44px] items-center gap-1 text-fresh-700 hover:underline">
            남은 급한 재료 {urgentLeft}개 보기 <ArrowRight size={17} aria-hidden />
          </Link>
        ) : (
          <Link href="/fridge" className="inline-flex min-h-[44px] items-center hover:underline">
            냉장고 보기
          </Link>
        )}
        <Link href="/history" className="inline-flex min-h-[44px] items-center hover:underline">
          소비 기록
        </Link>
      </div>
    </div>
  );
}
