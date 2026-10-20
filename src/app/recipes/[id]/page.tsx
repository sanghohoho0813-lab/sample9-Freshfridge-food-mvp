"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  AlarmClock,
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
import DetailSkeleton from "@/components/ui/DetailSkeleton";
import ChoiceChip from "@/components/ui/ChoiceChip";
import StickyActionBar from "@/components/ui/StickyActionBar";

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
  /** 조리하면서 끝낸 단계 (화면을 떠나면 초기화) */
  const [doneSteps, setDoneSteps] = useState<Set<number>>(new Set());
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
    return <DetailSkeleton />;
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
    <div className="mx-auto max-w-6xl">
      <BackButton fallback="/recipes" />

      <div className="mt-2 grid gap-6 lg:mt-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        {/* 대표 이미지 — 모바일은 화면 폭 가득, 데스크톱은 왼쪽에 고정 */}
        <div className="-mx-4 sm:mx-0 lg:sticky lg:top-24">
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-cream sm:rounded-card sm:border sm:border-ink-900/[0.06]">
            <Image
              src={recipeImage(recipe.image)}
              alt={`${recipe.name} 완성 사진`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 560px"
              className="object-contain p-6 sm:p-8"
            />
          </div>
        </div>

        <div className="min-w-0 space-y-8">
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em] text-ink-900 sm:text-[32px]">
              {recipe.name}
            </h1>
            <p className="mt-1.5 text-[17px] leading-relaxed text-ink-500">{recipe.description}</p>
            <ul className="mt-4 flex flex-wrap gap-2 text-[15.5px] font-medium text-ink-700">
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-inset ring-ink-900/[0.08]">
                <Clock3 size={17} className="text-ink-400" aria-hidden /> {recipe.minutes}분
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-inset ring-ink-900/[0.08]">
                <Gauge size={17} className="text-ink-400" aria-hidden /> {recipe.difficulty}
              </li>
              <li className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 ring-1 ring-inset ring-ink-900/[0.08]">
                <Users size={17} className="text-ink-400" aria-hidden /> {recipe.servings}인분
              </li>
              {lastCooked && (
                <li className="inline-flex items-center px-1 py-1.5 text-ink-500">
                  {relativeDay(lastCooked)} 만들었어요
                </li>
              )}
            </ul>
          </div>

          {/* 왜 이 요리인지 — 데이터로 확인되는 사실만 */}
          {!showResult && (
            <section
              aria-labelledby="why-title"
              className="rounded-card bg-white p-4 ring-1 ring-inset ring-ink-900/[0.07] sm:p-5"
            >
              <h2 id="why-title" className="text-[16px] font-semibold text-ink-500">
                지금 이 요리를 하면
              </h2>
              <ul className="mt-2.5 space-y-2 text-[16.5px] leading-snug text-ink-800">
                <li className="flex gap-2.5">
                  <AlarmClock
                    size={19}
                    className={`mt-px shrink-0 ${match.urgentOwned.length > 0 ? "text-amberish-600" : "text-ink-300"}`}
                    aria-hidden
                  />
                  {match.urgentOwned.length > 0 ? (
                    <span>
                      기한이 급한{" "}
                      <b className="font-semibold text-amberish-700">
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
                <li className="flex gap-2.5">
                  <ShoppingBasket
                    size={19}
                    className={`mt-px shrink-0 ${why.ready ? "text-fresh-600" : "text-ink-400"}`}
                    aria-hidden
                  />
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
          <section aria-labelledby="ingredients-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="ingredients-title" className="section-title">
                재료{" "}
                <span className="text-[16px] font-medium tabular-nums text-ink-500">
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
                  className="-mr-2 inline-flex min-h-[44px] shrink-0 items-center gap-1 rounded-full px-2.5 text-[15.5px] font-semibold text-fresh-700 hover:bg-fresh-50"
                >
                  <ShoppingBasket size={18} aria-hidden />
                  없는 재료 모두 담기
                </button>
              )}
            </div>
            <ul className="divide-y divide-ink-900/[0.06] overflow-hidden rounded-card border border-ink-900/[0.07] bg-white">
              {match.matched.map((m) => {
                const urgent = m.owned && m.dLeft !== null && m.dLeft <= 3;
                const ing = m.ingredient;
                return (
                  <li key={m.name} className="flex items-center gap-3 px-3.5 py-3 sm:px-4">
                    <IngredientThumb
                      name={m.name}
                      category={ing?.category ?? ingredientDefaults(m.name).category}
                      className={`h-12 w-12 rounded-xl bg-warmwhite ${m.owned ? "" : "opacity-50 grayscale"}`}
                      sizes="48px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[17.5px] font-semibold text-ink-900">
                        {m.name} <span className="font-normal text-ink-500">{m.amount}</span>
                        {!m.essential && (
                          <span className="ml-1.5 rounded-full bg-ink-900/[0.05] px-2 py-0.5 align-[2px] text-[13px] font-medium text-ink-500">
                            선택
                          </span>
                        )}
                      </p>
                      {m.owned && ing ? (
                        <p
                          className={`text-[15px] ${
                            m.short || urgent ? "font-medium text-amberish-700" : "text-fresh-700"
                          }`}
                        >
                          {m.short
                            ? `냉장고 ${formatAmount(ing.quantity, ing.unit)} · 조금 부족해요`
                            : urgent
                              ? `냉장고 ${formatAmount(ing.quantity, ing.unit)} · ${dDayLabel(ing.expiresAt)} 먼저 쓰기`
                              : `냉장고 ${formatAmount(ing.quantity, ing.unit)}`}
                        </p>
                      ) : (
                        <p className="text-[15px] text-ink-500">
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
                          className="inline-flex min-h-[42px] shrink-0 items-center gap-1 rounded-full border border-ink-900/[0.12] bg-white px-3.5 text-[15.5px] font-semibold text-ink-800 transition-all hover:border-fresh-500 hover:text-fresh-700 active:scale-95"
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
          <section aria-labelledby="steps-title">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="steps-title" className="section-title">
                조리방법
              </h2>
              <span className="text-[15px] font-medium tabular-nums text-ink-500">
                {doneSteps.size > 0 ? `${doneSteps.size}/${recipe.steps.length} 단계 끝` : "끝낸 단계를 눌러 표시해요"}
              </span>
            </div>
            {/* 진행 막대 — 요리하면서 어디까지 했는지 */}
            <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink-900/[0.06]" aria-hidden>
              <div
                className="h-full rounded-full bg-fresh-500 transition-[width] duration-300"
                style={{ width: `${(doneSteps.size / recipe.steps.length) * 100}%` }}
              />
            </div>
            <ol className="space-y-1">
              {recipe.steps.map((step, i) => {
                const done = doneSteps.has(i);
                return (
                  <li key={i}>
                    <button
                      type="button"
                      aria-pressed={done}
                      onClick={() => {
                        const next = new Set(doneSteps);
                        if (done) next.delete(i);
                        else next.add(i);
                        setDoneSteps(next);
                      }}
                      className="-mx-2 flex w-[calc(100%+1rem)] gap-3.5 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-ink-900/[0.03]"
                    >
                      <span
                        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[15px] font-semibold tabular-nums transition-colors ${
                          done ? "bg-fresh-600 text-white" : "bg-ink-900 text-white"
                        }`}
                      >
                        <span aria-hidden>{done ? <Check size={17} strokeWidth={3} /> : i + 1}</span>
                        <span className="sr-only">{done ? `${i + 1}단계 끝,` : `${i + 1}단계,`}</span>
                      </span>
                      <span
                        className={`pt-0.5 text-[17.5px] leading-relaxed transition-colors ${
                          done ? "text-ink-500 line-through decoration-ink-300" : "text-ink-700"
                        }`}
                      >
                        {step}
                      </span>
                    </button>
                  </li>
                );
              })}
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
            <>
              <div className="space-y-2">
                {!why.ready && match.ownedCount > 0 && (
                  <p className="flex items-start gap-1.5 text-[15.5px] text-amberish-700">
                    <TriangleAlert size={17} className="mt-[3px] shrink-0" aria-hidden />
                    {josa(match.missingEssential.map((m) => m.name).join(", "), "이/가")} 냉장고에 없어요. 그래도
                    만들었다면 있는 재료만 빠져요.
                  </p>
                )}
                {doneSteps.size === recipe.steps.length && match.ownedCount > 0 && (
                  <p className="flex items-center gap-1.5 text-[16px] font-semibold text-fresh-700" role="status">
                    <CircleCheck size={18} aria-hidden />
                    모든 단계를 끝냈어요. 요리했어요를 눌러 냉장고에서 빼주세요.
                  </p>
                )}
                <p className="text-[15px] text-ink-500">
                  {match.ownedCount === 0
                    ? "냉장고에 있는 재료가 없어요. 먼저 장보기에 담아보세요."
                    : "요리했어요를 누르면 쓴 만큼 냉장고에서 빠지고, 소비 기록과 리포트에 남아요."}
                </p>
              </div>
              <StickyActionBar>
                <div className="flex items-center gap-4">
                  <div className="hidden min-w-0 flex-1 sm:block lg:hidden">
                    <p className="text-[14.5px] text-ink-500">냉장고 재료 사용</p>
                    <p className="text-[18px] font-bold tabular-nums text-ink-900">{formatWon(usesWorth)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCook}
                    disabled={match.ownedCount === 0}
                    className="btn-primary min-h-[56px] flex-1 text-[19px] sm:flex-[1.4] lg:w-full"
                  >
                    <ChefHat size={22} aria-hidden />
                    요리했어요
                  </button>
                </div>
              </StickyActionBar>
            </>
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
      className="animate-pop-in scroll-mt-24 overflow-hidden rounded-card bg-white shadow-soft ring-1 ring-inset ring-ink-900/[0.07]"
    >
      {/* 완료 머리 — 이번 요리로 살린 금액이 가장 크게 */}
      <div role="status" className="bg-fresh-700 px-5 py-5 text-white sm:px-6">
        <p className="flex items-center gap-2 text-[22px] font-bold tracking-[-0.02em]">
          <CircleCheck size={24} aria-hidden />
          {recipeName} 완성
        </p>
        <p className="mt-1.5 text-[16.5px] leading-relaxed text-fresh-50">
          냉장고 재료 <b className="font-bold tabular-nums text-white">{formatWon(result.saved)}</b>어치를 버리지 않고
          썼어요
          {result.rescued > 0 && ` · 기한 임박 재료 ${result.rescued}개를 살렸어요`}
        </p>
      </div>

      <div className="space-y-5 p-4 sm:p-5">
        {/* 1. 무엇이 얼마나 줄었는지 */}
        {result.lines.length > 0 && (
          <div>
            <p className="mb-2 text-[15px] font-semibold text-ink-500">냉장고에서 뺐어요</p>
            <ul className="divide-y divide-ink-900/[0.06]" aria-label="냉장고에서 뺀 재료">
              {result.lines.map((l) => (
                <li key={l.name} className="flex items-center gap-3 py-2.5 text-[16.5px]">
                  <IngredientThumb
                    name={l.name}
                    category={ingredientDefaults(l.name).category}
                    className="h-10 w-10 rounded-xl bg-warmwhite"
                    sizes="40px"
                  />
                  <span className="min-w-0 flex-1 font-semibold text-ink-800">{l.name}</span>
                  <span className="shrink-0 tabular-nums text-ink-500">
                    {formatAmount(l.before, l.unit)}
                    <ArrowRight size={15} className="mx-1.5 inline -translate-y-px" aria-hidden />
                    <span className={l.after <= 0 ? "font-bold text-coral-700" : "font-bold text-ink-900"}>
                      {l.after <= 0 ? "다 씀" : formatAmount(l.after, l.unit)}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2. 다 쓴 재료 — 다시 살 것만 골라 담기 */}
        {result.usedUp.length > 0 && (
          <div className="rounded-2xl bg-warmwhite p-4">
            <p className="text-[17px] font-semibold text-ink-900">다 쓴 재료, 다시 살까요?</p>
            {rebuyDone ? (
              <p className="mt-2 flex items-center gap-1.5 text-[16px] font-semibold text-fresh-700">
                <Check size={18} aria-hidden /> 장보기에 담았어요 ·{" "}
                <Link href="/shopping" className="underline underline-offset-2">
                  장보기 보기
                </Link>
              </p>
            ) : (
              <>
                <p className="mt-0.5 text-[15px] text-ink-500">자주 먹는 재료는 미리 골라뒀어요.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.usedUp.map((n) => (
                    <ChoiceChip
                      key={n}
                      selected={rebuy.has(n)}
                      className="gap-2 py-1 pl-1.5 pr-3.5"
                      onClick={() => {
                        const next = new Set(rebuy);
                        if (next.has(n)) next.delete(n);
                        else next.add(n);
                        setRebuy(next);
                      }}
                    >
                      <IngredientThumb
                        name={n}
                        category={ingredientDefaults(n).category}
                        className="h-8 w-8 rounded-full bg-white"
                        sizes="32px"
                      />
                      {n}
                      {rebuy.has(n) && <Check size={16} aria-hidden />}
                    </ChoiceChip>
                  ))}
                </div>
                {rebuy.size > 0 ? (
                  <button type="button" onClick={onRebuy} className="btn-primary mt-3.5 min-h-[52px] w-full">
                    <ShoppingBasket size={20} aria-hidden />
                    {rebuy.size}개 장보기에 담기
                  </button>
                ) : (
                  <p className="mt-3 text-[15px] text-ink-500">다시 살 재료를 누르면 장보기에 담을 수 있어요.</p>
                )}
              </>
            )}
          </div>
        )}

        {/* 3. 이번 달 누적 효과 */}
        <Link
          href="/report"
          className="group flex items-center justify-between gap-3 rounded-2xl px-1 transition-colors"
        >
          <span className="min-w-0">
            <span className="block text-[15px] text-ink-500">{month}월에 먹어서 아낀 금액</span>
            <span className="mt-0.5 flex flex-wrap items-baseline gap-x-2">
              <b className="text-[24px] font-bold tabular-nums tracking-[-0.02em] text-ink-900">
                {formatWon(monthSaved)}
              </b>
              <span className="text-[15.5px] font-semibold tabular-nums text-fresh-700">
                +{formatWon(result.saved)}
              </span>
            </span>
          </span>
          <ArrowRight
            size={20}
            className="shrink-0 text-ink-400 transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>

        {/* 4. 다음 행동 */}
        <div className="grid grid-cols-2 gap-2 border-t border-ink-900/[0.06] pt-4">
          {urgentLeft > 0 ? (
            <Link href="/priority" className="btn-soft min-h-[50px] px-3 text-[16px]">
              남은 급한 재료 {urgentLeft}개 보기
            </Link>
          ) : (
            <Link href="/fridge" className="btn-soft min-h-[50px] px-3 text-[16px]">
              냉장고 보기
            </Link>
          )}
          <Link href="/history" className="btn-ghost min-h-[50px] px-3 text-[16px]">
            소비 기록
          </Link>
        </div>
      </div>
    </div>
  );
}
