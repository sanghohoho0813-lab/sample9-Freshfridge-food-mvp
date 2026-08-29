"use client";

import { useMemo, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";

export default function ShoppingPage() {
  const {
    ready,
    state,
    addShoppingItem,
    toggleShoppingItem,
    removeShoppingItem,
    showToast,
  } = useStore();
  const fridge = useFridge();
  const [input, setInput] = useState("");

  const items = state.shopping;
  const unchecked = items.filter((i) => !i.checked);
  const checked = items.filter((i) => i.checked);

  const fridgeNames = useMemo(() => new Set(fridge.map((f) => f.name)), [fridge]);
  const alreadyHave = (name: string) =>
    fridgeNames.has(name) || fridge.some((f) => f.name.includes(name) || name.includes(f.name));

  const add = () => {
    const name = input.trim();
    if (!name) return;
    addShoppingItem(name);
    setInput("");
    showToast(`${name}을(를) 장보기 목록에 담았어요`, "🛒");
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
        <h1 className="text-[28.6px] font-extrabold tracking-tight text-ink-900">
          장보기 리스트 🛒
        </h1>
        <p className="mt-1 text-[17.6px] text-ink-500">
          냉장고에 없는 재료만 골라 담아 중복 구매를 막아요.
        </p>
      </div>

      <div className="flex gap-2">
        <input
          className="input flex-1"
          placeholder="예: 고추, 간장, 돼지고기"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
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
        <div className="space-y-5">
          <ul className="space-y-2.5">
            {unchecked.map((item) => (
              <li key={item.id} className="card flex items-center gap-3 p-3.5">
                <button
                  type="button"
                  aria-label="구매 완료"
                  onClick={() => toggleShoppingItem(item.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-ink-300/50 text-transparent transition-all duration-200 hover:border-fresh-400 active:scale-90"
                >
                  <Check size={20} strokeWidth={3} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-[18.9px] font-bold text-ink-900">{item.name}</p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {item.fromRecipe && (
                      <p className="text-[15px] text-ink-400">‘{item.fromRecipe}’에 필요해요</p>
                    )}
                    {alreadyHave(item.name) && (
                      <span className="rounded-chip bg-amberish-50 px-2 py-0.5 text-[13.7px] font-bold text-amberish-600">
                        이미 냉장고에 있어요
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="삭제"
                  onClick={() => removeShoppingItem(item.id)}
                  className="grid h-11 w-11 place-items-center rounded-xl text-ink-300 transition-colors hover:bg-coral-50 hover:text-coral-500"
                >
                  <Trash2 size={21} />
                </button>
              </li>
            ))}
          </ul>

          {checked.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-[16.9px] font-bold text-ink-400">
                구매 완료 {checked.length}개
              </h2>
              <ul className="space-y-2.5">
                {checked.map((item) => (
                  <li
                    key={item.id}
                    className="card flex items-center gap-3 p-3.5 opacity-60"
                  >
                    <button
                      type="button"
                      aria-label="구매 완료 해제"
                      onClick={() => toggleShoppingItem(item.id)}
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-fresh-500 text-white transition-all active:scale-90"
                    >
                      <Check size={20} strokeWidth={3} />
                    </button>
                    <p className="flex-1 text-[18.9px] font-bold text-ink-500 line-through">
                      {item.name}
                    </p>
                    <button
                      type="button"
                      aria-label="삭제"
                      onClick={() => removeShoppingItem(item.id)}
                      className="grid h-11 w-11 place-items-center rounded-xl text-ink-300 transition-colors hover:bg-coral-50 hover:text-coral-500"
                    >
                      <Trash2 size={21} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
