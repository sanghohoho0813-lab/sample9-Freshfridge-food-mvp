"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, ChefHat, Minus, PencilLine, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import { daysLeft, expiryLevel, formatKoreanDate } from "@/lib/expiry-calculator";
import { amountStep, formatAmount } from "@/lib/quantity";
import { josa } from "@/lib/text";
import { relativeDay } from "@/lib/stats";
import { CATEGORY_LABELS, STORAGE_LABELS, type Ingredient, type StorageType } from "@/lib/types";
import ExpiryBadge from "@/components/ExpiryBadge";
import IngredientThumb from "@/components/IngredientThumb";
import EmptyState from "@/components/EmptyState";
import BackButton from "@/components/ui/BackButton";
import RecipeCard from "@/components/RecipeCard";
import { useIngredientActions } from "@/components/useIngredientActions";

export default function IngredientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { ready, state, updateIngredient, showToast } = useStore();
  const [editing, setEditing] = useState(false);
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
    return <div className="mx-auto max-w-3xl"><div className="skeleton h-64 w-full" /></div>;
  }

  if (!ingredient) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <BackButton fallback="/fridge" />
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
      <div className="mx-auto max-w-3xl animate-fade-up">
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
    <div className="mx-auto max-w-3xl animate-fade-up space-y-5">
      <BackButton fallback="/fridge" />

      <div className="card overflow-hidden">
        <div className={`flex items-center gap-4 p-5 sm:gap-5 sm:p-6 ${HERO_BG[level]}`}>
          <IngredientThumb
            name={ingredient.name}
            emoji={ingredient.emoji}
            className="w-20 rounded-3xl bg-white/80 text-[40px] shadow-soft sm:w-24"
            sizes="96px"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="text-[26px] font-extrabold leading-tight text-ink-900 sm:text-[28.5px]">{ingredient.name}</h1>
              <ExpiryBadge expiresAt={ingredient.expiresAt} size="lg" />
            </div>
            <p className="mt-1 text-[17.5px] font-semibold text-ink-700">{expiryLine(ingredient.expiresAt)}</p>
            <p className="mt-0.5 text-[16px] text-ink-500">
              {formatAmount(ingredient.quantity, ingredient.unit)} 남음 · {CATEGORY_LABELS[ingredient.category]}
            </p>
          </div>
        </div>

        <div className="space-y-5 p-4 sm:p-6">
          {/* 핵심 행동 */}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => eat(ingredient)} className="btn-primary min-h-[52px]">
              <Check size={21} />
              먹었어요
            </button>
            <button
              type="button"
              onClick={() => discard(ingredient)}
              className="inline-flex min-h-[52px] items-center justify-center gap-1.5 rounded-2xl border border-coral-100 bg-coral-50 px-4 text-[18px] font-semibold text-coral-600 transition-all duration-200 hover:bg-coral-100 active:scale-[0.98]"
            >
              <Trash2 size={21} />
              버렸어요
            </button>
          </div>
          <Link href={`/recipes?with=${encodeURIComponent(ingredient.name)}`} className="btn-soft min-h-[52px] w-full">
            <ChefHat size={21} />
            이 재료로 만들 요리
          </Link>

          {editing ? (
            <IngredientEditForm
              key={ingredient.id}
              ingredient={ingredient}
              onCancel={() => setEditing(false)}
              onSave={(patch) => {
                updateIngredient(ingredient.id, patch);
                setEditing(false);
                showToast("정보를 저장했어요", "✅");
              }}
            />
          ) : (
            <div className="rounded-2xl bg-warmwhite">
              <div className="flex items-center justify-between gap-2 px-4 pt-2">
                <h2 className="text-[16.5px] font-bold text-ink-700">보관 정보</h2>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="-mr-2 inline-flex min-h-[44px] items-center gap-1 rounded-xl px-2 text-[15.5px] font-semibold text-fresh-700 hover:bg-fresh-50"
                >
                  <PencilLine size={17} />
                  정보 수정
                </button>
              </div>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3 px-4 pb-4 pt-1 text-[16.5px]">
                <div>
                  <dt className="text-[15px] text-ink-500">보관 위치</dt>
                  <dd className="font-bold text-ink-800">{STORAGE_LABELS[ingredient.storage]}</dd>
                </div>
                <div>
                  <dt className="text-[15px] text-ink-500">구매일</dt>
                  <dd className="font-bold text-ink-800">{formatKoreanDate(ingredient.purchasedAt)}</dd>
                </div>
                {ingredient.memo && (
                  <div className="col-span-2">
                    <dt className="text-[15px] text-ink-500">메모</dt>
                    <dd className="font-medium text-ink-800">{ingredient.memo}</dd>
                  </div>
                )}
              </dl>
            </div>
          )}

          {lastUse && (
            <p className="text-[15.5px] text-ink-500">
              지난번엔 {relativeDay(lastUse.date)}{" "}
              {lastUse.via ? `‘${lastUse.via}’에 썼어요.` : "그대로 먹었어요."}
            </p>
          )}

          <p className="text-[14.5px] leading-relaxed text-ink-500">
            보관 상태가 좋지 않다면 기한 전이라도 드시지 마세요.
          </p>
        </div>
      </div>

      {relatedRecipes.length > 0 && (
        <section>
          <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">
            {josa(ingredient.name, "으로/로")} 만들 수 있어요
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
            {relatedRecipes.map((m) => (
              <RecipeCard key={m.recipe.id} match={m} layout="row" />
            ))}
          </div>
        </section>
      )}

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

  const step = amountStep(ingredient.unit);
  const quantity = Number(qtyText);
  const qtyError =
    qtyText.trim() === "" || !Number.isFinite(quantity) || quantity <= 0
      ? "수량은 0보다 커야 해요. 다 먹었다면 ‘먹었어요’를 눌러주세요."
      : quantity > 9999
        ? "수량이 너무 커요."
        : null;
  const dateError =
    expiresAt && expiresAt < ingredient.purchasedAt ? "유통기한이 구매일보다 빨라요." : null;

  const bump = (dir: 1 | -1) => {
    const base = Number.isFinite(quantity) && quantity > 0 ? quantity : 0;
    setQtyText(String(Math.max(step, Math.round((base + dir * step) * 100) / 100)));
  };

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (qtyError || dateError) return;
    onSave({
      quantity: Math.round(quantity * 100) / 100,
      expiresAt: expiresAt || null,
      storage,
      memo: memo.trim() || undefined,
    });
  };

  const errCls = "border-coral-400 focus:border-coral-400 focus:ring-coral-100";

  return (
    <form onSubmit={save} noValidate className="space-y-4 rounded-2xl border border-fresh-200 bg-white p-4 animate-pop-in">
      <h2 className="text-[17.5px] font-extrabold text-ink-900">정보 수정</h2>

      <div>
        <label htmlFor="edit-qty" className="mb-2 block text-[16px] font-bold text-ink-700">
          남은 수량
        </label>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="수량 줄이기" onClick={() => bump(-1)} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-ink-300/40 bg-white text-ink-700 active:scale-95">
            <Minus size={20} />
          </button>
          <div className="relative min-w-0 flex-1">
            <input
              id="edit-qty"
              type="text"
              inputMode="decimal"
              className={`input pr-12 text-center font-semibold ${submitted && qtyError ? errCls : ""}`}
              value={qtyText}
              aria-invalid={!!(submitted && qtyError)}
              onChange={(e) => setQtyText(e.target.value.replace(/[^0-9.]/g, "").slice(0, 7))}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[16.5px] font-semibold text-ink-400">
              {ingredient.unit}
            </span>
          </div>
          <button type="button" aria-label="수량 늘리기" onClick={() => bump(1)} className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-2xl border border-ink-300/40 bg-white text-ink-700 active:scale-95">
            <Plus size={20} />
          </button>
        </div>
        {submitted && qtyError ? (
          <p role="alert" className="mt-1.5 text-[15.5px] font-medium text-coral-600">{qtyError}</p>
        ) : (
          <p className="mt-1.5 text-[15px] text-ink-500">재고만 바로잡아요. 먹은 양은 ‘먹었어요’로 기록하세요.</p>
        )}
      </div>

      <div>
        <label htmlFor="edit-expiry" className="mb-2 block text-[16px] font-bold text-ink-700">
          유통기한
        </label>
        <div className="flex gap-2">
          <input
            id="edit-expiry"
            type="date"
            className={`input min-w-0 flex-1 ${submitted && dateError ? errCls : ""}`}
            value={expiresAt}
            aria-invalid={!!(submitted && dateError)}
            onChange={(e) => setExpiresAt(e.target.value)}
          />
          <button
            type="button"
            aria-pressed={!expiresAt}
            onClick={() => setExpiresAt("")}
            className={`chip min-h-[52px] shrink-0 border ${!expiresAt ? "border-fresh-400 bg-fresh-50 text-fresh-700" : "border-ink-300/30 bg-white text-ink-600"}`}
          >
            모름
          </button>
        </div>
        {submitted && dateError && (
          <p role="alert" className="mt-1.5 text-[15.5px] font-medium text-coral-600">{dateError}</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-[16px] font-bold text-ink-700">보관 위치</p>
        <div className="flex gap-2">
          {(Object.keys(STORAGE_LABELS) as StorageType[]).map((st) => (
            <button
              key={st}
              type="button"
              aria-pressed={storage === st}
              onClick={() => setStorage(st)}
              className={`chip min-h-[44px] flex-1 justify-center border ${
                storage === st ? "border-fresh-400 bg-fresh-50 text-fresh-700" : "border-ink-300/30 bg-white text-ink-600"
              }`}
            >
              {STORAGE_LABELS[st]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="edit-memo" className="mb-2 block text-[16px] font-bold text-ink-700">
          메모
        </label>
        <input id="edit-memo" className="input" placeholder="예: 찌개용" value={memo} maxLength={40} onChange={(e) => setMemo(e.target.value)} />
      </div>

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
