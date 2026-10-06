"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import { daysLeft, sortByExpiry } from "@/lib/expiry-calculator";
import IngredientRow from "@/components/IngredientRow";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";
import ListGroup from "@/components/ui/ListGroup";
import PageHeader from "@/components/ui/PageHeader";

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

  // 검색 전에는 곧 기한이 끝나는 재료를 먼저 제안한다
  const urgentNames = useMemo(
    () =>
      sortByExpiry(fridge)
        .filter((i) => {
          const d = daysLeft(i.expiresAt);
          return d !== null && d <= 3;
        })
        .map((i) => i.name)
        .filter((n, idx, arr) => arr.indexOf(n) === idx)
        .slice(0, 6),
    [fridge]
  );

  if (!ready) {
    return <div className="mx-auto max-w-5xl"><div className="skeleton h-12 w-full" /></div>;
  }

  const chipCls =
    "chip min-h-[44px] border border-ink-300/30 bg-white text-ink-700 hover:border-fresh-200 hover:bg-fresh-50/50";

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-5">
      <PageHeader title="검색" />

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          (document.activeElement as HTMLElement | null)?.blur();
        }}
        className="relative"
      >
        <Search size={22} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden />
        <input
          autoFocus
          type="search"
          aria-label="식재료·레시피 검색"
          enterKeyHint="search"
          className="input min-h-[56px] pl-12 pr-12 [&::-webkit-search-cancel-button]:hidden"
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
            className="absolute right-2 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-xl text-ink-400 hover:bg-ink-300/10 hover:text-ink-700"
          >
            <X size={20} />
          </button>
        )}
      </form>

      {!q ? (
        <div className="space-y-5">
          {urgentNames.length > 0 && (
            <section>
              <h2 className="mb-2.5 text-[17px] font-bold text-ink-700">곧 기한이 끝나는 재료</h2>
              <div className="flex flex-wrap gap-2">
                {urgentNames.map((s) => (
                  <button key={s} type="button" onClick={() => setQuery(s)} className={chipCls}>
                    {s}
                  </button>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-2.5 text-[17px] font-bold text-ink-700">추천 검색어</h2>
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
          emoji="🔍"
          title={`‘${query.trim()}’ 결과가 없어요`}
          description="냉장고에 없는 재료라면 바로 추가할 수 있어요."
          ctaLabel="식재료 추가하기"
          ctaHref={`/add?name=${encodeURIComponent(query.trim())}`}
        />
      ) : (
        <div className="space-y-7">
          {matchedIngredients.length > 0 && (
            <section>
              <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">
                내 냉장고 <span className="text-fresh-600">{matchedIngredients.length}</span>
              </h2>
              <ListGroup columns={2}>
                {matchedIngredients.map((i) => (
                  <IngredientRow key={i.id} ingredient={i} />
                ))}
              </ListGroup>
            </section>
          )}
          {matchedRecipes.length > 0 && (
            <section>
              <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">
                레시피 <span className="text-fresh-600">{matchedRecipes.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                {matchedRecipes.map((m) => (
                  <RecipeCard key={m.recipe.id} match={m} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
