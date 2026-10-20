"use client";

import { use, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChefHat, PencilLine, ShoppingBasket, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { isInFridge } from "@/lib/state/ops";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import { daysLeft, expiryLevel, formatKoreanDate, toISODate, todayStart } from "@/lib/expiry-calculator";
import { amountStep, formatAmount } from "@/lib/quantity";
import { josa } from "@/lib/text";
import { relativeDay } from "@/lib/stats";
import { CATEGORY_LABELS, STORAGE_LABELS, type Ingredient, type StorageType } from "@/lib/types";
import ExpiryBadge from "@/components/ExpiryBadge";
import FreshnessTimeline from "@/components/FreshnessTimeline";
import IngredientThumb from "@/components/IngredientThumb";
import EmptyState from "@/components/EmptyState";
import BackButton from "@/components/ui/BackButton";
import DetailSkeleton from "@/components/ui/DetailSkeleton";
import ChoiceChip from "@/components/ui/ChoiceChip";
import Field, { INPUT_ERROR } from "@/components/ui/Field";
import { QuantityInput } from "@/components/ui/Stepper";
import { toAmount, validateDates, validateQuantity } from "@/lib/validation";
import RecipeCard, { RecipeList } from "@/components/RecipeCard";
import SectionHeader from "@/components/SectionHeader";
import StickyActionBar from "@/components/ui/StickyActionBar";
import { useIngredientActions } from "@/components/useIngredientActions";

export default function IngredientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { ready, state, updateIngredient, showToast } = useStore();
  const [editing, setEditing] = useState(false);
  const { eat, discard, element: actionSheet } = useIngredientActions();

  const ingredient = state.ingredients.find((i) => i.id === id);

  const relatedRecipes = useMemo(() => {
    if (!ingredient) return [];
    const fridge = state.ingredients.filter(isInFridge);
    return rankRecipes(RECIPES, fridge)
      .filter((m) => m.recipe.ingredients.some((ri) => ri.name === ingredient.name))
      .slice(0, 2);
  }, [ingredient, state.ingredients]);

  // 같은 재료를 지난번에 어떻게 썼는지 — 기록이 다른 화면에 이어지는 지점
  const lastUse = useMemo(
    () =>
      ingredient ? state.logs.find((l) => l.ingredientName === ingredient.name && l.type === "consumed") : undefined,
    [ingredient, state.logs]
  );

  if (!ready) {
    return <DetailSkeleton heroAspect="aspect-[16/10]" />;
  }

  if (!ingredient) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackButton fallback="/fridge" />
        <EmptyState
          icon={ShoppingBasket}
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
      <div className="mx-auto max-w-3xl">
        <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
          <IngredientThumb
            name={ingredient.name}
            category={ingredient.category}
            className={`h-24 w-24 text-5xl ${eaten ? "bg-fresh-50" : "bg-coral-50 grayscale"}`}
            sizes="96px"
          />
          <p className="text-[22px] font-bold text-ink-900">
            {eaten ? `${ingredient.name}, 다 먹었어요` : `${ingredient.name}, 정리했어요`}
          </p>
          <p className="text-[16.5px] text-ink-500">
            {eaten ? "먹은 기록이 낭비 리포트에 반영됐어요." : "폐기 기록이 리포트의 낭비 분석에 반영됐어요."}
          </p>
          <Link href="/priority" className="btn-primary mt-3">
            다음으로 먹을 재료 보기
            <ArrowRight size={20} />
          </Link>
          <div className="flex gap-5 text-[15.5px] font-semibold text-ink-500">
            <Link href="/history" className="hover:text-ink-800 hover:underline">
              소비 기록
            </Link>
            <Link href="/fridge" className="hover:text-ink-800 hover:underline">
              내 냉장고
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const level = expiryLevel(ingredient.expiresAt);

  return (
    <div className="mx-auto max-w-6xl">
      <BackButton fallback="/fridge" />

      <div className="mt-2 grid gap-6 lg:mt-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start lg:gap-10">
        {/* 재료 사진 — 바탕색이 기한 상태를 따른다 */}
        <div className="-mx-4 sm:mx-0 lg:sticky lg:top-24">
          <div
            className={`relative aspect-[16/10] w-full overflow-hidden sm:aspect-[4/3] sm:rounded-card ${HERO_BG[level]}`}
          >
            <IngredientThumb
              name={ingredient.name}
              category={ingredient.category}
              className="absolute inset-0 h-full w-full rounded-none p-8 sm:p-12"
              sizes="(max-width: 1024px) 100vw, 560px"
            />
            <span className="absolute left-4 top-4">
              <ExpiryBadge expiresAt={ingredient.expiresAt} size="lg" />
            </span>
          </div>
        </div>

        <div className="min-w-0 space-y-7">
          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-[-0.025em] text-ink-900 sm:text-[32px]">
              {ingredient.name}
            </h1>
            <p className={`mt-1.5 text-[18px] font-semibold ${LINE_TONE[level]}`}>{expiryLine(ingredient.expiresAt)}</p>
            <p className="mt-0.5 text-[16.5px] text-ink-500">
              {formatAmount(ingredient.quantity, ingredient.unit)} 남음 · {CATEGORY_LABELS[ingredient.category]}
            </p>
          </div>

          <section
            aria-label="신선도"
            className="rounded-card bg-white px-4 py-4 ring-1 ring-inset ring-ink-900/[0.07] sm:px-5"
          >
            <FreshnessTimeline purchasedAt={ingredient.purchasedAt} expiresAt={ingredient.expiresAt} />
          </section>

          {editing ? (
            <IngredientEditForm
              key={ingredient.id}
              ingredient={ingredient}
              onCancel={() => setEditing(false)}
              onSave={(patch) => {
                updateIngredient(ingredient.id, patch);
                setEditing(false);
                showToast("정보를 저장했어요");
              }}
            />
          ) : (
            <section
              aria-labelledby="storage-title"
              className="rounded-card bg-white ring-1 ring-inset ring-ink-900/[0.07]"
            >
              <div className="flex items-center justify-between gap-2 px-4 pt-2 sm:px-5">
                <h2 id="storage-title" className="text-[16px] font-semibold text-ink-500">
                  보관 정보
                </h2>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="-mr-2 inline-flex min-h-[44px] items-center gap-1 rounded-full px-2.5 text-[15.5px] font-semibold text-fresh-700 hover:bg-fresh-50"
                >
                  <PencilLine size={17} aria-hidden />
                  정보 수정
                </button>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3 px-4 pb-4 pt-1 text-[17px] sm:px-5">
                <div>
                  <dt className="text-[14.5px] text-ink-500">보관 위치</dt>
                  <dd className="font-semibold text-ink-900">{STORAGE_LABELS[ingredient.storage]}</dd>
                </div>
                {ingredient.memo && (
                  <div>
                    <dt className="text-[14.5px] text-ink-500">메모</dt>
                    <dd className="font-medium text-ink-800">{ingredient.memo}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {lastUse && (
            <p className="text-[15.5px] text-ink-500">
              지난번엔 {relativeDay(lastUse.date)} {lastUse.via ? `‘${lastUse.via}’에 썼어요.` : "그대로 먹었어요."}
            </p>
          )}

          <section aria-labelledby="related-title">
            <SectionHeader
              id="related-title"
              title={`${josa(ingredient.name, "으로/로")} 만들 수 있어요`}
              moreHref={`/recipes?with=${encodeURIComponent(ingredient.name)}`}
              moreLabel="이 재료로 만들 요리"
            />
            {relatedRecipes.length > 0 ? (
              <RecipeList auto={false}>
                {relatedRecipes.map((m) => (
                  <li key={m.recipe.id}>
                    <RecipeCard match={m} layout="row" />
                  </li>
                ))}
              </RecipeList>
            ) : (
              <p className="rounded-card bg-white px-4 py-4 text-[16px] text-ink-500 ring-1 ring-inset ring-ink-900/[0.07]">
                <ChefHat size={18} className="mr-1.5 inline -translate-y-px text-ink-400" aria-hidden />
                지금 냉장고 재료로 함께 만들 요리가 없어요.
              </p>
            )}
          </section>

          <p className="text-[14.5px] leading-relaxed text-ink-500">
            보관 상태가 좋지 않다면 기한 전이라도 드시지 마세요.
          </p>

          {/* 핵심 행동 — 모바일은 화면 아래 고정 */}
          {!editing && (
            <StickyActionBar>
              <div className="grid grid-cols-[1fr_1.5fr] gap-2">
                <button
                  type="button"
                  onClick={() => discard(ingredient)}
                  className="inline-flex min-h-[56px] items-center justify-center gap-1.5 rounded-full border border-coral-100 bg-coral-50 px-4 text-[18px] font-semibold text-coral-700 transition-all duration-200 hover:bg-coral-100 active:scale-[0.98]"
                >
                  <Trash2 size={20} aria-hidden />
                  버렸어요
                </button>
                <button type="button" onClick={() => eat(ingredient)} className="btn-primary min-h-[56px]">
                  <Check size={21} aria-hidden />
                  먹었어요
                </button>
              </div>
            </StickyActionBar>
          )}
        </div>
      </div>

      {actionSheet}
    </div>
  );
}

/** 상세 상단 기한 문구 — 배지(D-2)와 겹치지 않게 날짜로 보여준다 */
function expiryLine(expiresAt: string | null): string {
  const d = daysLeft(expiresAt);
  if (d === null || !expiresAt) return "유통기한 정보가 없어요";
  if (d < 0) return `${formatKoreanDate(expiresAt)}까지였어요`;
  if (d === 0) return "오늘까지예요";
  if (d === 1) return "내일까지예요";
  return `${formatKoreanDate(expiresAt)}까지`;
}

const LINE_TONE: Record<string, string> = {
  expired: "text-coral-700",
  urgent: "text-coral-700",
  soon: "text-amberish-700",
  ok: "text-ink-800",
  unknown: "text-ink-600",
};

const HERO_BG: Record<string, string> = {
  expired: "bg-coral-50",
  urgent: "bg-coral-50",
  soon: "bg-amberish-50",
  ok: "bg-warmwhite",
  unknown: "bg-warmwhite",
};

/** 보관 정보 수정 — 수량은 "재고 바로잡기"용(기록 없음). 실제로 먹은 건 "먹었어요"로 기록한다. */
function IngredientEditForm({
  ingredient,
  onCancel,
  onSave,
}: {
  ingredient: Ingredient;
  onCancel: () => void;
  onSave: (patch: Partial<Ingredient>) => void;
}) {
  const [qtyText, setQtyText] = useState(String(ingredient.quantity));
  const [expiresAt, setExpiresAt] = useState(ingredient.expiresAt ?? "");
  const [storage, setStorage] = useState<StorageType>(ingredient.storage);
  const [memo, setMemo] = useState(ingredient.memo ?? "");
  const [submitted, setSubmitted] = useState(false);
  const qtyRef = useRef<HTMLInputElement>(null);

  const qtyError = validateQuantity(qtyText, "수량은 0보다 커야 해요. 다 먹었다면 ‘먹었어요’를 눌러주세요.");
  const dateError = validateDates({
    purchasedAt: ingredient.purchasedAt,
    expiresAt,
    today: toISODate(todayStart()),
  }).expiresAt;
  const show = (err: string | null) => (submitted ? err : null);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (qtyError) return qtyRef.current?.focus();
    if (dateError) return document.getElementById("edit-expiry")?.focus();
    onSave({ quantity: toAmount(qtyText), expiresAt: expiresAt || null, storage, memo: memo.trim() || undefined });
  };

  return (
    <form
      onSubmit={save}
      noValidate
      aria-labelledby="edit-title"
      className="animate-pop-in space-y-5 rounded-card bg-white p-4 ring-1 ring-inset ring-fresh-600/30 sm:p-5"
    >
      <h2 id="edit-title" className="text-[17.5px] font-bold text-ink-900">
        정보 수정
      </h2>

      <Field
        label="남은 수량"
        htmlFor="edit-qty"
        error={show(qtyError)}
        hint="재고만 바로잡아요. 먹은 양은 ‘먹었어요’로 기록하세요."
      >
        <QuantityInput
          id="edit-qty"
          inputRef={qtyRef}
          value={qtyText}
          onChange={setQtyText}
          step={amountStep(ingredient.unit)}
          unitSuffix={ingredient.unit}
          invalid={!!show(qtyError)}
          describedBy="edit-qty-msg"
        />
      </Field>

      <Field label="유통기한" htmlFor="edit-expiry" error={show(dateError)}>
        <div className="flex gap-2">
          <input
            id="edit-expiry"
            type="date"
            className={`input min-w-0 flex-1 ${show(dateError) ? INPUT_ERROR : ""}`}
            value={expiresAt}
            aria-invalid={!!show(dateError)}
            aria-describedby={show(dateError) ? "edit-expiry-msg" : undefined}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <ChoiceChip selected={!expiresAt} onClick={() => setExpiresAt("")} className="min-h-[52px] shrink-0">
            모름
          </ChoiceChip>
        </div>
      </Field>

      <Field label="보관 위치">
        <div className="flex gap-2">
          {(Object.keys(STORAGE_LABELS) as StorageType[]).map((st) => (
            <ChoiceChip
              key={st}
              selected={storage === st}
              onClick={() => setStorage(st)}
              className="flex-1 justify-center"
            >
              {STORAGE_LABELS[st]}
            </ChoiceChip>
          ))}
        </div>
      </Field>

      <Field label="메모" htmlFor="edit-memo">
        <input
          id="edit-memo"
          className="input"
          placeholder="예: 찌개용"
          value={memo}
          maxLength={40}
          onChange={(e) => setMemo(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button type="button" onClick={onCancel} className="btn-ghost min-h-[52px]">
          취소
        </button>
        <button type="submit" className="btn-primary min-h-[52px]">
          저장
        </button>
      </div>
    </form>
  );
}
