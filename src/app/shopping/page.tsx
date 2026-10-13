"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, Refrigerator, ShoppingBasket, Trash2 } from "lucide-react";
import { useFridge, useStore, useUndoToast } from "@/lib/store";
import { ingredientDefaults } from "@/lib/demo-data";
import { formatAmount } from "@/lib/quantity";
import { formatKoreanDate, sortByExpiry, toISODate, todayStart } from "@/lib/expiry-calculator";
import type { Ingredient, ShoppingItem } from "@/lib/types";
import { isRunningLow, restockSuggestions } from "@/lib/insights";
import { josa } from "@/lib/text";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import IngredientThumb from "@/components/IngredientThumb";
import QuickAddSheet from "@/components/QuickAddSheet";
import RestockList from "@/components/RestockList";
import { INPUT_ERROR } from "@/components/ui/Field";

/** 이 장보기 항목이 왜 목록에 있는지 / 냉장고에 이미 있는지 — 한 줄로 */
function sourceLine(item: ShoppingItem, have: Ingredient | undefined): { text: string; tone: string } | null {
  if (have && !isRunningLow(have)) {
    return {
      text: `냉장고에 아직 ${have.name === item.name ? "" : `${have.name} `}${formatAmount(have.quantity, have.unit)} 있어요${
        have.expiresAt ? ` · ${formatKoreanDate(have.expiresAt)}까지` : ""
      }`,
      tone: "font-semibold text-amberish-700",
    };
  }
  if (have) return { text: `냉장고에 ${formatAmount(have.quantity, have.unit)}만 남았어요`, tone: "text-ink-600" };
  if (item.fromRecipe && item.restock)
    return { text: `‘${item.fromRecipe}’에 다 써서 다시 사요`, tone: "text-ink-500" };
  if (item.fromRecipe) return { text: `‘${item.fromRecipe}’에 필요해요`, tone: "text-ink-500" };
  if (item.restock) return { text: "다 떨어져서 다시 사는 재료", tone: "text-ink-500" };
  return null;
}

/** 구매한 재료를 냉장고에 넣을 때의 예상 금액 — 보통 사는 양의 금액을 비례로 */
function estimatePrice(name: string, quantity: number): number {
  const d = ingredientDefaults(name);
  return Math.round((d.price * quantity) / (d.typicalQty ?? quantity));
}

export default function ShoppingPage() {
  const {
    ready,
    state,
    addShoppingItem,
    addIngredient,
    restockIngredient,
    toggleShoppingItem,
    removeShoppingItem,
    clearPurchasedShopping,
    showToast,
  } = useStore();
  const undoToast = useUndoToast();
  const fridge = useFridge();
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  /** 냉장고에 넣을 구매 항목들 — 한 개씩 차례로 확인한다 */
  const [queue, setQueue] = useState<{ ids: string[]; total: number } | null>(null);

  const items = state.shopping;
  const unchecked = items.filter((i) => !i.checked);
  const purchased = items.filter((i) => i.checked);
  const notPutAway = purchased.filter((i) => !i.addedToFridge);
  const suggestions = useMemo(() => restockSuggestions(state, fridge, 3), [state, fridge]);

  // 같은 이름 우선, 없으면 부분 일치 (예: "돼지고기" ↔ "돼지고기 앞다리살")
  const findInFridge = useMemo(() => {
    return (name: string) =>
      sortByExpiry(fridge.filter((f) => f.name === name)).at(-1) ??
      fridge.find((f) => name.length >= 2 && (f.name.includes(name) || name.includes(f.name)));
  }, [fridge]);

  const add = (e?: React.FormEvent) => {
    e?.preventDefault();
    const name = input.trim();
    if (!name) {
      setInputError("살 재료 이름을 입력해주세요.");
      return;
    }
    if (unchecked.some((i) => i.name === name)) {
      setInputError(`${josa(name, "은/는")} 이미 목록에 있어요.`);
      return;
    }
    const token = addShoppingItem(name);
    setInput("");
    setInputError(null);
    undoToast(`${josa(name, "을/를")} 장보기에 담았어요`, token);
  };

  const remove = (item: ShoppingItem) => {
    const token = removeShoppingItem(item.id);
    undoToast(`${josa(item.name, "을/를")} 목록에서 지웠어요`, token);
  };

  const clearPurchased = () => {
    const count = purchased.length;
    const token = clearPurchasedShopping();
    undoToast(`구매 완료 ${count}개를 비웠어요`, token);
  };

  const markPurchased = (item: ShoppingItem) => {
    toggleShoppingItem(item.id);
    showToast(`${item.name} 구매 완료`, {
      label: "냉장고에 넣기",
      onClick: () => setQueue({ ids: [item.id], total: 1 }),
    });
  };

  const current = queue ? items.find((i) => i.id === queue.ids[0]) : undefined;
  const currentHave = current ? sortByExpiry(fridge.filter((f) => f.name === current.name)).at(-1) : undefined;

  if (!ready) return <PageLoading title="장보기 리스트" back="/" rows={3} />;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader
        back="/"
        title="장보기 리스트"
        description={
          unchecked.length > 0 ? `살 것 ${unchecked.length}개` : "냉장고에 이미 있는 재료는 따로 알려드려요."
        }
      />

      <form onSubmit={add} noValidate>
        <div className="flex gap-2">
          <input
            className={`input min-h-[52px] min-w-0 flex-1 ${inputError ? INPUT_ERROR : ""}`}
            placeholder="살 재료 입력 (예: 간장)"
            value={input}
            maxLength={20}
            enterKeyHint="done"
            onChange={(e) => {
              setInput(e.target.value);
              if (inputError) setInputError(null);
            }}
            aria-label="장보기 재료 이름"
            aria-invalid={!!inputError}
          />
          <button type="submit" className="btn-primary min-h-[52px] shrink-0">
            <Plus size={22} aria-hidden />
            담기
          </button>
        </div>
        {inputError && (
          <p role="alert" className="mt-1.5 text-[15.5px] font-medium text-coral-700">
            {inputError}
          </p>
        )}
      </form>

      {items.length === 0 && suggestions.length === 0 ? (
        <EmptyState
          icon={ShoppingBasket}
          title="장보기 목록이 비어 있어요"
          description="레시피에서 부족한 재료를 담거나 직접 추가해보세요."
          ctaLabel="레시피 추천 보기"
          ctaHref="/recipes"
        />
      ) : (
        <div className="space-y-7">
          {unchecked.length > 0 && (
            <ul
              aria-label="살 것"
              className="divide-y divide-ink-300/20 overflow-hidden rounded-card border border-ink-300/25 bg-white"
            >
              {unchecked.map((item) => {
                const src = sourceLine(item, findInFridge(item.name));
                return (
                  <li key={item.id} className="flex items-center gap-3 py-3 pl-3 pr-2 sm:pl-3.5">
                    <button
                      type="button"
                      aria-label={`${item.name} 구매 완료`}
                      onClick={() => markPurchased(item)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink-300/60 text-transparent transition-all duration-200 hover:border-fresh-400 hover:text-fresh-400 active:scale-90"
                    >
                      <Check size={20} strokeWidth={3} aria-hidden />
                    </button>
                    <IngredientThumb
                      name={item.name}
                      category={ingredientDefaults(item.name).category}
                      className="h-12 w-12 bg-warmwhite"
                      sizes="48px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[18.5px] font-bold leading-snug text-ink-900">{item.name}</p>
                      {src && <p className={`line-clamp-2 text-[15px] leading-snug ${src.tone}`}>{src.text}</p>}
                    </div>
                    <button
                      type="button"
                      aria-label={`${item.name} 삭제`}
                      onClick={() => remove(item)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-400 transition-colors hover:bg-coral-50 hover:text-coral-700"
                    >
                      <Trash2 size={20} aria-hidden />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {suggestions.length > 0 && (
            <section aria-labelledby="restock-title">
              <h2 id="restock-title" className="mb-1 text-[17.5px] font-bold text-ink-900">
                냉장고를 보면, 이것도 필요해요
              </h2>
              <p className="mb-2.5 text-[15px] text-ink-500">거의 다 먹었거나, 자주 먹는데 떨어진 재료예요.</p>
              <RestockList items={suggestions} />
            </section>
          )}

          {purchased.length > 0 && (
            <section aria-labelledby="bought-title">
              <div className="mb-2.5 flex items-center justify-between">
                <h2 id="bought-title" className="text-[16.5px] font-bold text-ink-600">
                  구매 완료 {purchased.length}개
                </h2>
                <button
                  type="button"
                  onClick={clearPurchased}
                  className="-mr-2 inline-flex min-h-[44px] items-center rounded-xl px-2 text-[15.5px] font-semibold text-ink-500 hover:bg-ink-300/10 hover:text-ink-800"
                >
                  목록에서 비우기
                </button>
              </div>
              {notPutAway.length >= 2 && (
                <button
                  type="button"
                  onClick={() => setQueue({ ids: notPutAway.map((i) => i.id), total: notPutAway.length })}
                  className="btn-soft mb-2.5 min-h-[52px] w-full"
                >
                  <Refrigerator size={20} aria-hidden />산 것 {notPutAway.length}개 차례로 냉장고에 넣기
                </button>
              )}
              <ul className="divide-y divide-ink-300/20 overflow-hidden rounded-card border border-ink-300/25 bg-white">
                {purchased.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 py-3 pl-3 pr-2 sm:pl-3.5">
                    <button
                      type="button"
                      aria-label={`${item.name} 구매 취소`}
                      onClick={() => toggleShoppingItem(item.id)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fresh-600 text-white transition-all active:scale-90"
                    >
                      <Check size={20} strokeWidth={3} aria-hidden />
                    </button>
                    <p className="min-w-0 flex-1 text-[18.5px] font-bold text-ink-500 line-through">{item.name}</p>
                    {item.addedToFridge ? (
                      <Link
                        href="/fridge"
                        aria-label={`${item.name} 냉장고에 넣음 · 냉장고 보기`}
                        className="inline-flex min-h-[44px] shrink-0 items-center gap-1 px-1 text-[15.5px] font-semibold text-fresh-700 hover:underline"
                      >
                        <Check size={17} aria-hidden />
                        냉장고에 넣음
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setQueue({ ids: [item.id], total: 1 })}
                        aria-label={`${item.name} 냉장고에 넣기`}
                        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-fresh-50 px-3 text-[15.5px] font-semibold text-fresh-700 transition-colors hover:bg-fresh-100"
                      >
                        <Refrigerator size={18} aria-hidden />
                        냉장고에 넣기
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      {queue && current && (
        <QuickAddSheet
          key={current.id}
          name={current.name}
          existing={currentHave}
          progress={{ index: queue.total - queue.ids.length + 1, total: queue.total }}
          onClose={() => setQueue(null)}
          onConfirm={(v) => {
            const d = ingredientDefaults(v.name);
            const price = estimatePrice(v.name, v.quantity);
            let token: string;
            if (v.mode === "merge" && currentHave) {
              token = restockIngredient(currentHave.id, v.quantity, price, { fromShoppingId: current.id });
            } else {
              token = addIngredient(
                {
                  name: v.name,
                  emoji: d.emoji,
                  quantity: v.quantity,
                  unit: v.unit,
                  category: d.category,
                  storage: v.storage,
                  purchasedAt: toISODate(todayStart()),
                  expiresAt: v.expiresAt,
                  price,
                },
                { fromShoppingId: current.id }
              );
            }
            const rest = queue.ids.slice(1);
            setQueue(rest.length > 0 ? { ...queue, ids: rest } : null);
            undoToast(
              v.mode === "merge" ? `기존 ${v.name}에 더했어요` : `${josa(v.name, "을/를")} 냉장고에 넣었어요`,
              token
            );
          }}
        />
      )}
    </div>
  );
}
