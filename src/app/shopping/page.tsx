"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Plus, Refrigerator, Trash2 } from "lucide-react";
import { useFridge, useStore, useUndoToast } from "@/lib/store";
import { ingredientDefaults } from "@/lib/demo-data";
import { formatAmount } from "@/lib/quantity";
import { toISODate, todayStart } from "@/lib/expiry-calculator";
import type { ShoppingItem } from "@/lib/types";
import EmptyState from "@/components/EmptyState";
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
  const [adding, setAdding] = useState<ShoppingItem | null>(null);

  const items = state.shopping;
  const unchecked = items.filter((i) => !i.checked);
  const purchased = items.filter((i) => i.checked);
  const fromRecipeCount = unchecked.filter((i) => i.fromRecipe).length;

  const alreadyHave = useMemo(() => {
    return (name: string) =>
      fridge.find((f) => f.name === name || f.name.includes(name) || name.includes(f.name));
  }, [fridge]);

  const add = () => {
    const name = input.trim();
    if (!name) return;
    addShoppingItem(name);
    setInput("");
    showToast(`${name}을(를) 장보기 목록에 담았어요`, "🛒");
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
      <div className="mx-auto max-w-5xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={4} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-5">
      <div>
        <h1 className="text-[28.5px] font-extrabold tracking-tight text-ink-900">장보기 리스트 🛒</h1>
        <p className="mt-1 text-[17.5px] text-ink-500">
          {unchecked.length > 0
            ? `살 것 ${unchecked.length}개${fromRecipeCount > 0 ? ` · 레시피에서 담은 재료 ${fromRecipeCount}개` : ""}`
            : "냉장고에 없는 재료만 골라 담아 중복 구매를 막아요."}
        </p>
      </div>

      <div className="flex gap-2">
        <input
          className="input min-w-0 flex-1"
          placeholder="예: 고추, 간장, 돼지고기"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) add();
          }}
          aria-label="장보기 재료 이름"
        />
        <button type="button" onClick={add} className="btn-primary shrink-0">
          <Plus size={22} />
          추가
        </button>
      </div>

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
                      <p className="text-[18.5px] font-bold text-ink-900">{item.name}</p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        {item.fromRecipe && (
                          <p className="text-[15.5px] text-ink-400">‘{item.fromRecipe}’에 필요해요</p>
                        )}
                        {have && (
                          <span className="text-[14.5px] font-bold text-amberish-600">
                            냉장고에 {formatAmount(have.quantity, have.unit)} 있어요
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`${item.name} 삭제`}
                      onClick={() => removeShoppingItem(item.id)}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-ink-300 transition-colors hover:bg-coral-50 hover:text-coral-500"
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
                <h2 className="text-[16.5px] font-bold text-ink-500">구매 완료 {purchased.length}개</h2>
                <button
                  type="button"
                  onClick={clearPurchasedShopping}
                  className="text-[15.5px] font-semibold text-ink-400 hover:text-ink-700"
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
                      <Link href="/fridge" className="shrink-0 text-[15.5px] font-semibold text-fresh-700 hover:underline">
                        냉장고에 넣었어요 ✓
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
            undoToast(`${v.name}을(를) 냉장고에 넣었어요`, "🧊", token);
          }}
        />
      )}
    </div>
  );
}
