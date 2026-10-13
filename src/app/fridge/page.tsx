"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, Refrigerator, Search, SearchX } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import type { IngredientCategory, StorageType } from "@/lib/types";
import { CATEGORY_LABELS } from "@/lib/types";
import {
  EXPIRY_GROUP_LABEL,
  EXPIRY_GROUP_ORDER,
  expiryGroup,
  sortByExpiry,
  type ExpiryGroup,
} from "@/lib/expiry-calculator";
import { isRunningLow } from "@/lib/insights";
import IngredientRow from "@/components/IngredientRow";
import ListGroup from "@/components/ui/ListGroup";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import SegmentedControl from "@/components/ui/SegmentedControl";
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
  const [query, setQuery] = useState("");
  // 리포트의 "지금 있는 채소 보기"처럼 종류를 지정해서 들어올 수 있다
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
  const categories = useMemo(() => CATEGORIES.filter((c) => inStorage.some((i) => i.category === c)), [inStorage]);
  const activeCategory = category !== "all" && categories.includes(category) ? category : "all";

  const q = query.replace(/\s+/g, "");
  const filtered = useMemo(
    () =>
      sortByExpiry(
        inStorage.filter(
          (i) =>
            (activeCategory === "all" || i.category === activeCategory) &&
            (!q || i.name.replace(/\s+/g, "").includes(q))
        )
      ),
    [inStorage, activeCategory, q]
  );

  // 기한 구간별로 나눠, 무엇이 언제까지인지 위에서부터 훑어볼 수 있게
  const sections = useMemo(() => {
    const map = new Map<ExpiryGroup, typeof filtered>();
    for (const i of filtered) {
      const g = expiryGroup(i.expiresAt);
      map.set(g, [...(map.get(g) ?? []), i]);
    }
    return EXPIRY_GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, items: map.get(g)! }));
  }, [filtered]);

  const urgentCount = fridge.filter((i) => ["expired", "today", "soon"].includes(expiryGroup(i.expiresAt))).length;
  const lowCount = fridge.filter(isRunningLow).length;

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

  const filtering = q !== "" || activeCategory !== "all";

  return (
    <div className="mx-auto max-w-6xl space-y-4 sm:space-y-5">
      <PageHeader
        title="내 냉장고"
        description={
          fridge.length > 0 ? (
            <>
              {fridge.length}개 보관 중
              {urgentCount > 0 && <span className="font-semibold text-coral-700"> · 3일 안 {urgentCount}개</span>}
              {lowCount > 0 && <span> · 거의 다 먹음 {lowCount}개</span>}
            </>
          ) : undefined
        }
        action={
          <Link href="/add" className="btn-primary hidden sm:inline-flex">
            <Plus size={21} aria-hidden />
            식재료 추가
          </Link>
        }
      />

      {fridge.length === 0 ? (
        <EmptyState
          icon={Refrigerator}
          title="아직 등록된 식재료가 없어요"
          description="재료를 등록하면 기한을 대신 챙겨드려요."
          ctaLabel="첫 식재료 추가하기"
          ctaHref="/add"
        />
      ) : (
        <>
          <SegmentedControl
            label="보관위치"
            value={storageTab}
            onChange={setStorageTab}
            panelId="fridge-panel"
            segments={STORAGE_TABS.map((t) => ({ value: t.key, label: t.label, count: storageCounts[t.key] }))}
          />

          <div id="fridge-panel" role="tabpanel" aria-label="보관 중인 식재료" className="space-y-5">
            {/* 찾기 · 종류 — 필터는 이 두 가지로만 */}
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={19}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400"
                  aria-hidden
                />
                <input
                  type="search"
                  aria-label="냉장고에서 찾기"
                  placeholder="냉장고에서 찾기"
                  value={query}
                  maxLength={20}
                  onChange={(e) => setQuery(e.target.value)}
                  className="input min-h-[48px] py-2 pl-10 text-[17px] [&::-webkit-search-cancel-button]:hidden"
                />
              </div>
              {categories.length > 1 && (
                <select
                  aria-label="종류"
                  value={activeCategory}
                  onChange={(e) => setCategory(e.target.value as IngredientCategory | "all")}
                  className="input min-h-[48px] w-[118px] shrink-0 py-2 text-[17px] sm:w-[150px]"
                >
                  <option value="all">모든 종류</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {sections.length === 0 ? (
              <EmptyState
                compact
                icon={SearchX}
                title={filtering ? "조건에 맞는 재료가 없어요" : "이 보관위치에는 재료가 없어요"}
                description={filtering ? "찾는 이름이나 종류를 바꿔보세요." : "다른 보관위치를 선택해보세요."}
              />
            ) : (
              sections.map(({ group, items }) => (
                <section key={group} aria-labelledby={`fridge-${group}`}>
                  <h2
                    id={`fridge-${group}`}
                    className={`mb-2 flex items-baseline gap-2 text-[16.5px] font-bold ${
                      group === "expired" || group === "today"
                        ? "text-coral-700"
                        : group === "soon"
                          ? "text-amberish-700"
                          : "text-ink-700"
                    }`}
                  >
                    {EXPIRY_GROUP_LABEL[group]}
                    <span className="text-[15px] font-semibold tabular-nums text-ink-500">{items.length}</span>
                  </h2>
                  <ListGroup columns={2}>
                    {items.map((ing) => (
                      <IngredientRow
                        key={ing.id}
                        ingredient={ing}
                        onEat={eat}
                        highlight={ing.id === flashId}
                        showStorage={storageTab === "all"}
                      />
                    ))}
                  </ListGroup>
                </section>
              ))
            )}
          </div>
        </>
      )}

      {actionSheet}
    </div>
  );
}
