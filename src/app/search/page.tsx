"use client";

import { useMemo, useState } from "react";
import { Search, SearchX, X } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import { daysLeft, sortByExpiry } from "@/lib/expiry-calculator";
import IngredientRow from "@/components/IngredientRow";
import RecipeCard, { RecipeList } from "@/components/RecipeCard";
import IngredientThumb from "@/components/IngredientThumb";
import ExpiryBadge from "@/components/ExpiryBadge";
import EmptyState from "@/components/EmptyState";
import ListGroup from "@/components/ui/ListGroup";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";

const SUGGESTIONS = ["두부", "버섯", "계란", "김치볶음밥", "된장찌개"];

/** 띄어쓰기·대소문자와 상관없이 찾는다 ("김치 볶음밥" → "김치볶음밥") */
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

export default function SearchPage() {
  const { ready } = useStore();
  const fridge = useFridge();
  const [query, setQuery] = useState("");

  const q = norm(query);

  const matchedIngredients = useMemo(
    () => (q ? sortByExpiry(fridge.filter((i) => norm(i.name).includes(q))) : []),
    [fridge, q]
  );

  const matchedRecipes = useMemo(() => {
    if (!q) return [];
    return rankRecipes(RECIPES, fridge).filter(
      (m) => norm(m.recipe.name).includes(q) || m.recipe.ingredients.some((ri) => norm(ri.name).includes(q))
    );
  }, [fridge, q]);

  // 검색 전에는 곧 기한이 끝나는 재료를 먼저 제안한다 (같은 이름은 한 번만)
  const urgentItems = useMemo(
    () =>
      sortByExpiry(fridge)
        .filter((i) => {
          const d = daysLeft(i.expiresAt);
          return d !== null && d <= 3;
        })
        .filter((i, idx, arr) => arr.findIndex((x) => x.name === i.name) === idx)
        .slice(0, 6),
    [fridge]
  );
  const urgentNames = urgentItems.map((i) => i.name);

  if (!ready)
    return (
      <PageLoading title="검색" back="/" width="5xl">
        <div className="skeleton h-14 w-full" />
      </PageLoading>
    );

  const chipCls = "chip min-h-[44px] border border-ink-900/[0.1] bg-white text-ink-800 hover:border-ink-900/25";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader back="/" title="검색" />

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        className="relative"
      >
        <Search
          size={22}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
          aria-hidden
        />
        <input
          autoFocus
          type="search"
          aria-label="식재료·레시피 검색"
          enterKeyHint="search"
          className="input min-h-[56px] rounded-full pl-12 pr-12 [&::-webkit-search-cancel-button]:hidden"
          placeholder="재료나 요리 이름"
          value={query}
          maxLength={30}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-900/[0.04] hover:text-ink-700"
          >
            <X size={20} aria-hidden />
          </button>
        )}
      </form>

      {!q ? (
        <div className="space-y-5">
          {urgentNames.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-[16px] font-semibold text-ink-500">곧 기한이 끝나는 재료</h2>
              <div className="flex flex-wrap gap-2">
                {urgentItems.map((i) => (
                  <button
                    key={i.id}
                    type="button"
                    onClick={() => setQuery(i.name)}
                    className={`${chipCls} gap-2 py-1 pl-1.5 pr-3`}
                  >
                    <IngredientThumb
                      name={i.name}
                      category={i.category}
                      className="h-8 w-8 rounded-full bg-warmwhite"
                      sizes="32px"
                    />
                    {i.name}
                    <ExpiryBadge expiresAt={i.expiresAt} size="sm" />
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2.5 text-[16px] font-semibold text-ink-500">추천 검색어</h2>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.filter((s) => !urgentNames.includes(s)).map((s) => (
                <button key={s} type="button" onClick={() => setQuery(s)} className={chipCls}>
                  {s}
                </button>
              ))}
            </div>
          </section>
        </div>
      ) : matchedIngredients.length === 0 && matchedRecipes.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title={`‘${query.trim()}’ 결과가 없어요`}
          description="냉장고에 없는 재료라면 바로 추가할 수 있어요."
          ctaLabel="식재료 추가하기"
          ctaHref={`/add?name=${encodeURIComponent(query.trim())}`}
        />
      ) : (
        <div className="space-y-7">
          {matchedIngredients.length > 0 && (
            <section>
              <h2 className="section-title mb-3">
                내 냉장고 <span className="font-medium text-ink-500">{matchedIngredients.length}</span>
              </h2>
              <ListGroup columns={2}>
                {matchedIngredients.map((i) => (
                  <IngredientRow key={i.id} ingredient={i} query={query} />
                ))}
              </ListGroup>
            </section>
          )}
          {matchedRecipes.length > 0 && (
            <section>
              <h2 className="section-title mb-3">
                레시피 <span className="font-medium text-ink-500">{matchedRecipes.length}</span>
              </h2>
              <RecipeList>
                {matchedRecipes.map((m) => (
                  <li key={m.recipe.id}>
                    <RecipeCard match={m} query={query} />
                  </li>
                ))}
              </RecipeList>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
