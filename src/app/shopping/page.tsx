"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, Refrigerator, Trash2 } from "lucide-react";
import { useFridge, useStore, useUndoToast } from "@/lib/store";
import { ingredientDefaults } from "@/lib/demo-data";
import { formatAmount } from "@/lib/quantity";
import { toISODate, todayStart } from "@/lib/expiry-calculator";
import type { ShoppingItem } from "@/lib/types";
import { josa } from "@/lib/text";
import EmptyState from "@/components/EmptyState";
import PageHeader from "@/components/ui/PageHeader";
import SkeletonList from "@/components/SkeletonList";
import IngredientThumb from "@/components/IngredientThumb";
import QuickAddSheet from "@/components/QuickAddSheet";

export default function ShoppingPage() {
  const {
    ready,
    state,
    addShoppingItem,
    addIngredient,
    toggleShoppingItem,
    removeShoppingItem,
    clearPurchasedShopping,
    showToast,
  } = useStore();
  const undoToast = useUndoToast();
  const fridge = useFridge();
  const [input, setInput] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [adding, setAdding] = useState<ShoppingItem | null>(null);

  const items = state.shopping;
  const unchecked = items.filter((i) => !i.checked);
  const purchased = items.filter((i) => i.checked);
  const fromRecipeCount = unchecked.filter((i) => i.fromRecipe).length;

  // 이미 냉장고에 있는 재료면 알려서 중복 구매를 막는다 (같은 이름 우선, 없으면 부분 일치)
  const alreadyHave = useMemo(() => {
    return (name: string) =>
      fridge.find((f) => f.name === name) ??
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
    addShoppingItem(name);
    setInput("");
    setInputError(null);
    showToast(`${josa(name, "을/를")} 장보기에 담았어요`, "🛒");
  };

  const remove = (item: ShoppingItem) => {
    const token = removeShoppingItem(item.id);
    undoToast(`${josa(item.name, "을/를")} 목록에서 지웠어요`, "🗑️", token);
  };

  const clearPurchased = () => {
    const count = purchased.length;
    const token = clearPurchasedShopping();
    undoToast(`구매 완료 ${count}개를 비웠어요`, "🧹", token);
  };

  const markPurchased = (item: ShoppingItem) => {
    toggleShoppingItem(item.id);
    showToast(`${item.name} 구매 완료`, "🧺", {
      label: "냉장고에 넣기",
      onClick: () => setAdding({ ...item, checked: true }),
    });
  };

  if (!ready) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-up space-y-5">
      <PageHeader
        title="장보기 리스트"
        description={
          unchecked.length > 0
            ? `살 것 ${unchecked.length}개${fromRecipeCount > 0 ? ` · 레시피에서 담은 재료 ${fromRecipeCount}개` : ""}`
            : "냉장고에 있는 재료는 따로 알려드려요."
        }
      />

      <form onSubmit={add} noValidate>
        <div className="flex gap-2">
          <input
            className={`input min-h-[52px] min-w-0 flex-1 ${inputError ? "border-coral-400 focus:border-coral-400 focus:ring-coral-100" : ""}`}
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
            <Plus size={22} />
            담기
          </button>
        </div>
        {inputError && (
          <p role="alert" className="mt-1.5 text-[15.5px] font-medium text-coral-600">{inputError}</p>
        )}
      </form>

      {items.length === 0 ? (
        <EmptyState
          emoji="🧺"
          title="장보기 목록이 비어 있어요"
          description="레시피에서 부족한 재료를 담거나 직접 추가해보세요."
          ctaLabel="레시피 추천 보기"
          ctaHref="/recipes"
        />
      ) : (
        <div className="space-y-6">
          {unchecked.length > 0 && (
            <ul className="divide-y divide-ink-300/20 overflow-hidden rounded-card border border-ink-300/25 bg-white">
              {unchecked.map((item) => {
                const have = alreadyHave(item.name);
                return (
                  <li key={item.id} className="flex items-center gap-3 px-3.5 py-3">
                    <button
                      type="button"
                      aria-label={`${item.name} 구매 완료`}
                      onClick={() => markPurchased(item)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full border-2 border-ink-300/60 text-transparent transition-all duration-200 hover:border-fresh-400 hover:text-fresh-400 active:scale-90"
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                    <IngredientThumb
                      name={item.name}
                      emoji={ingredientDefaults(item.name).emoji}
                      className="h-12 w-12 bg-warmwhite text-xl"
                      sizes="48px"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-[18.5px] font-bold leading-snug text-ink-900">{item.name}</p>
                      {have ? (
                        <p className="line-clamp-2 text-[15.5px] font-semibold leading-snug text-amberish-600">
                          냉장고에 {have.name === item.name ? "" : `${have.name} `}
                          {formatAmount(have.quantity, have.unit)} 있어요
                        </p>
                      ) : (
                        item.fromRecipe && (
                          <p className="line-clamp-2 text-[15.5px] leading-snug text-ink-500">{item.fromRecipe}에 필요</p>
                        )
                      )}
                    </div>
                    <button
                      type="button"
                      aria-label={`${item.name} 삭제`}
                      onClick={() => remove(item)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-400 transition-colors hover:bg-coral-50 hover:text-coral-500"
                    >
                      <Trash2 size={20} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {purchased.length > 0 && (
            <section>
              <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-[16.5px] font-bold text-ink-600">구매 완료 {purchased.length}개</h2>
                <button
                  type="button"
                  onClick={clearPurchased}
                  className="-mr-2 inline-flex min-h-[44px] items-center rounded-xl px-2 text-[15.5px] font-semibold text-ink-500 hover:bg-ink-300/10 hover:text-ink-800"
                >
                  목록에서 비우기
                </button>
              </div>
              <ul className="divide-y divide-ink-300/20 overflow-hidden rounded-card border border-ink-300/25 bg-white">
                {purchased.map((item) => (
                  <li key={item.id} className="flex items-center gap-3 px-3.5 py-3">
                    <button
                      type="button"
                      aria-label={`${item.name} 구매 취소`}
                      onClick={() => toggleShoppingItem(item.id)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-fresh-500 text-white transition-all active:scale-90"
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                    <p className="min-w-0 flex-1 text-[18.5px] font-bold text-ink-400 line-through">
                      {item.name}
                    </p>
                    {item.addedToFridge ? (
                      <Link href="/fridge" className="inline-flex min-h-[44px] shrink-0 items-center gap-1 text-[15.5px] font-semibold text-fresh-700 hover:underline">
                        <Check size={17} />
                        냉장고에 넣음
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAdding(item)}
                        className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-xl bg-fresh-50 px-3 text-[15.5px] font-semibold text-fresh-700 transition-colors hover:bg-fresh-100"
                      >
                        <Refrigerator size={18} />
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

      {adding && (
        <QuickAddSheet
          name={adding.name}
          onClose={() => setAdding(null)}
          onConfirm={(v) => {
            const d = ingredientDefaults(v.name);
            const token = addIngredient(
              {
                name: v.name,
                emoji: d.emoji,
                quantity: v.quantity,
                unit: v.unit,
                category: d.category,
                storage: v.storage,
                purchasedAt: toISODate(todayStart()),
                expiresAt: v.expiresAt,
                price: d.price,
              },
              { fromShoppingId: adding.id }
            );
            setAdding(null);
            undoToast(`${josa(v.name, "을/를")} 냉장고에 넣었어요`, "🧊", token);
          }}
        />
      )}
    </div>
  );
}
