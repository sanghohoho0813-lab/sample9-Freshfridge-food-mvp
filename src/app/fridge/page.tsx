"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import type { IngredientCategory, StorageType } from "@/lib/types";
import { CATEGORY_EMOJIS, CATEGORY_LABELS } from "@/lib/types";
import { sortByExpiry } from "@/lib/expiry-calculator";
import IngredientCard from "@/components/IngredientCard";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";

const STORAGE_TABS: { key: StorageType | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "fridge", label: "냉장" },
  { key: "freezer", label: "냉동" },
  { key: "pantry", label: "실온" },
];

const CATEGORIES: (IngredientCategory | "all")[] = [
  "all",
  "vegetable",
  "fruit",
  "meat",
  "seafood",
  "dairy",
  "egg",
  "sauce",
  "processed",
  "etc",
];

export default function FridgePage() {
  const { ready } = useStore();
  const fridge = useFridge();
  const [storageTab, setStorageTab] = useState<StorageType | "all">("all");
  const [category, setCategory] = useState<IngredientCategory | "all">("all");

  const filtered = useMemo(() => {
    let list = fridge;
    if (storageTab !== "all") list = list.filter((i) => i.storage === storageTab);
    if (category !== "all") list = list.filter((i) => i.category === category);
    return sortByExpiry(list);
  }, [fridge, storageTab, category]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={6} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-up space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-[28.5px] font-extrabold tracking-tight text-ink-900">내 냉장고 🧊</h1>
          <p className="mt-1 text-[17.5px] text-ink-500">
            총 {fridge.length}개의 식재료를 보관 중이에요.
          </p>
        </div>
        <Link href="/add" className="btn-primary shrink-0">
          <Plus size={22} />
          추가
        </Link>
      </div>

      {/* 보관위치 탭 */}
      <div className="flex gap-1.5 rounded-2xl bg-fresh-50 p-1.5">
        {STORAGE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setStorageTab(t.key)}
            className={`flex-1 rounded-xl py-2 text-[17.5px] font-bold transition-all duration-200 ${
              storageTab === t.key
                ? "bg-white text-fresh-700 shadow-soft"
                : "text-ink-500 hover:text-ink-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 카테고리 칩 */}
      <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`chip border ${
                category === c
                  ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                  : "border-ink-300/30 bg-white text-ink-500 hover:border-fresh-200"
              }`}
            >
              {c === "all" ? "🧺 전체" : `${CATEGORY_EMOJIS[c]} ${CATEGORY_LABELS[c]}`}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        fridge.length === 0 ? (
          <EmptyState
            emoji="🫙"
            title="아직 등록된 식재료가 없어요"
            description="냉장고 속 재료를 알면 장보기도 쉬워져요."
            ctaLabel="첫 식재료 추가하기"
            ctaHref="/add"
          />
        ) : (
          <EmptyState
            emoji="🔍"
            title="조건에 맞는 식재료가 없어요"
            description="다른 보관위치나 카테고리를 선택해보세요."
          />
        )
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((ing) => (
            <IngredientCard key={ing.id} ingredient={ing} />
          ))}
        </div>
      )}
    </div>
  );
}
