"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import type { IngredientCategory, StorageType } from "@/lib/types";
import { CATEGORY_EMOJIS, CATEGORY_LABELS } from "@/lib/types";
import { sortByExpiry } from "@/lib/expiry-calculator";
import IngredientRow from "@/components/IngredientRow";
import ListGroup from "@/components/ui/ListGroup";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/EmptyState";
import SkeletonList from "@/components/SkeletonList";
import { useIngredientActions } from "@/components/useIngredientActions";

const STORAGE_TABS: { key: StorageType | "all"; label: string }[] = [
  { key: "all", label: "전체" },
  { key: "fridge", label: "냉장" },
  { key: "freezer", label: "냉동" },
  { key: "pantry", label: "실온" },
];

const CATEGORIES: IngredientCategory[] = [
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
  const { eat, element: actionSheet } = useIngredientActions();
  const [storageTab, setStorageTab] = useState<StorageType | "all">("all");
  const [category, setCategory] = useState<IngredientCategory | "all">("all");

  const storageCounts = useMemo(() => {
    const c: Record<StorageType | "all", number> = { all: fridge.length, fridge: 0, freezer: 0, pantry: 0 };
    for (const i of fridge) c[i.storage]++;
    return c;
  }, [fridge]);

  const inStorage = useMemo(
    () => (storageTab === "all" ? fridge : fridge.filter((i) => i.storage === storageTab)),
    [fridge, storageTab]
  );

  // 현재 보관위치에 실제로 있는 카테고리만 칩으로 보여준다
  const categoryCounts = useMemo(() => {
    const c = new Map<IngredientCategory, number>();
    for (const i of inStorage) c.set(i.category, (c.get(i.category) ?? 0) + 1);
    return c;
  }, [inStorage]);
  const activeCategory = category !== "all" && categoryCounts.has(category) ? category : "all";

  const filtered = useMemo(
    () => sortByExpiry(activeCategory === "all" ? inStorage : inStorage.filter((i) => i.category === activeCategory)),
    [inStorage, activeCategory]
  );

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl space-y-4">
        <div className="skeleton h-10 w-1/2" />
        <SkeletonList rows={6} />
      </div>
    );
  }

  const chips = CATEGORIES.filter((c) => categoryCounts.has(c));

  return (
    <div className="mx-auto max-w-6xl animate-fade-up space-y-4 sm:space-y-5">
      <PageHeader
        title="내 냉장고"
        description={fridge.length > 0 ? `${fridge.length}개 보관 중 · 기한이 가까운 순서예요` : undefined}
        action={
          <Link href="/add" className="btn-primary hidden sm:inline-flex">
            <Plus size={21} />
            식재료 추가
          </Link>
        }
      />

      {fridge.length === 0 ? (
        <EmptyState
          emoji="🫙"
          title="아직 등록된 식재료가 없어요"
          description="재료를 등록하면 기한을 대신 챙겨드려요."
          ctaLabel="첫 식재료 추가하기"
          ctaHref="/add"
        />
      ) : (
        <>
          {/* 보관위치 탭 */}
          <div role="tablist" aria-label="보관위치" className="flex gap-1 rounded-2xl bg-ink-300/15 p-1">
            {STORAGE_TABS.map((t) => {
              const active = storageTab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setStorageTab(t.key)}
                  className={`flex min-h-[44px] flex-1 items-center justify-center gap-1.5 rounded-xl text-[17px] font-bold transition-all duration-200 ${
                    active ? "bg-white text-ink-900 shadow-soft" : "text-ink-500 hover:text-ink-700"
                  }`}
                >
                  {t.label}
                  <span className={`text-[14.5px] font-semibold ${active ? "text-fresh-600" : "text-ink-400"}`}>
                    {storageCounts[t.key]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 카테고리 칩 — 재료가 있는 것만 */}
          {chips.length > 1 && (
            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                {(["all", ...chips] as const).map((c) => {
                  const active = activeCategory === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setCategory(c)}
                      className={`chip min-h-[40px] border ${
                        active
                          ? "border-fresh-400 bg-fresh-50 text-fresh-700"
                          : "border-ink-300/30 bg-white text-ink-600 hover:border-fresh-200"
                      }`}
                    >
                      {c === "all" ? "전체" : `${CATEGORY_EMOJIS[c]} ${CATEGORY_LABELS[c]} ${categoryCounts.get(c)}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <EmptyState
              emoji="🧺"
              title={`${STORAGE_TABS.find((t) => t.key === storageTab)?.label} 보관 재료가 없어요`}
              description="다른 보관위치를 선택해보세요."
            />
          ) : (
            <ListGroup columns={2}>
              {filtered.map((ing) => (
                <IngredientRow key={ing.id} ingredient={ing} onEat={eat} />
              ))}
            </ListGroup>
          )}
        </>
      )}

      {actionSheet}
    </div>
  );
}
