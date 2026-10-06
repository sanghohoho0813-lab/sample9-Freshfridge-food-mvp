"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import type { IngredientCategory, StorageType } from "@/lib/types";
import { CATEGORY_EMOJIS, CATEGORY_LABELS } from "@/lib/types";
import { sortByExpiry } from "@/lib/expiry-calculator";
import IngredientRow from "@/components/IngredientRow";
import ListGroup from "@/components/ui/ListGroup";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import SegmentedControl from "@/components/ui/SegmentedControl";
import ChoiceChip from "@/components/ui/ChoiceChip";
import EmptyState from "@/components/EmptyState";
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

function FridgeSkeleton() {
  return <PageLoading title="내 냉장고" width="6xl" rows={6} />;
}

export default function FridgePage() {
  return (
    <Suspense fallback={<FridgeSkeleton />}>
      <FridgeContent />
    </Suspense>
  );
}

function FridgeContent() {
  const { ready } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const addedId = params.get("added");
  const [flashId, setFlashId] = useState<string | null>(null);
  const fridge = useFridge();
  const { eat, element: actionSheet } = useIngredientActions();
  const [storageTab, setStorageTab] = useState<StorageType | "all">("all");
  // 리포트의 "지금 먹어야 할 채소 보기"처럼 종류를 지정해서 들어올 수 있다
  const [category, setCategory] = useState<IngredientCategory | "all">(() => {
    const c = params.get("category");
    return c && (CATEGORIES as string[]).includes(c) ? (c as IngredientCategory) : "all";
  });

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

  // 추가 화면에서 넘어오면 새 재료로 스크롤하고 잠깐 강조한 뒤 주소를 정리한다
  useEffect(() => {
    if (!ready || !addedId) return;
    setFlashId(addedId);
    router.replace("/fridge", { scroll: false });
  }, [ready, addedId, router]);

  useEffect(() => {
    if (!flashId) return;
    const raf = requestAnimationFrame(() =>
      document.getElementById(`ing-${flashId}`)?.scrollIntoView({ block: "center", behavior: "smooth" })
    );
    const t = setTimeout(() => setFlashId(null), 2600);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [flashId]);

  if (!ready) return <FridgeSkeleton />;

  const chips = CATEGORIES.filter((c) => categoryCounts.has(c));

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
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
          <SegmentedControl
            label="보관위치"
            value={storageTab}
            onChange={setStorageTab}
            panelId="fridge-panel"
            segments={STORAGE_TABS.map((t) => ({ value: t.key, label: t.label, count: storageCounts[t.key] }))}
          />

          <div id="fridge-panel" role="tabpanel" aria-label="보관 중인 식재료" className="space-y-4 sm:space-y-5">
            {/* 카테고리 칩 — 재료가 있는 것만 */}
            {chips.length > 1 && (
              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
                <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
                  {(["all", ...chips] as const).map((c) => (
                    <ChoiceChip key={c} selected={activeCategory === c} onClick={() => setCategory(c)}>
                      {c === "all" ? "전체" : `${CATEGORY_EMOJIS[c]} ${CATEGORY_LABELS[c]} ${categoryCounts.get(c)}`}
                    </ChoiceChip>
                  ))}
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
                  <IngredientRow key={ing.id} ingredient={ing} onEat={eat} highlight={ing.id === flashId} />
                ))}
              </ListGroup>
            )}
          </div>
        </>
      )}

      {actionSheet}
    </div>
  );
}
