"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import { RECIPES } from "@/lib/demo-data";
import { rankRecipes } from "@/lib/recipe-matcher";
import IngredientCard from "@/components/IngredientCard";
import RecipeCard from "@/components/RecipeCard";
import EmptyState from "@/components/EmptyState";

export default function SearchPage() {
  const { ready } = useStore();
  const fridge = useFridge();
  const [query, setQuery] = useState("");

  const q = query.trim();

  const matchedIngredients = useMemo(
    () => (q ? fridge.filter((i) => i.name.includes(q)) : []),
    [fridge, q]
  );

  const matchedRecipes = useMemo(() => {
    if (!q) return [];
    return rankRecipes(RECIPES, fridge).filter(
      (m) =>
        m.recipe.name.includes(q) ||
        m.recipe.ingredients.some((ri) => ri.name.includes(q))
    );
  }, [fridge, q]);

  if (!ready) {
    return <div className="mx-auto max-w-5xl"><div className="skeleton h-12 w-full" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl animate-fade-up space-y-6">
      <div>
        <h1 className="text-[28.5px] font-extrabold tracking-tight text-ink-900">검색 🔍</h1>
        <p className="mt-1 text-[17.5px] text-ink-500">
          내 냉장고의 식재료와 레시피를 한 번에 찾아요.
        </p>
      </div>

      <div className="relative">
        <Search
          size={23}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400"
        />
        <input
          autoFocus
          className="input py-3 pl-11"
          placeholder="예: 두부, 버섯, 김치볶음밥"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!q ? (
        <div className="flex flex-wrap gap-2">
          {["두부", "버섯", "계란", "김치", "우유"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setQuery(s)}
              className="chip border border-ink-300/30 bg-white text-ink-500 hover:border-fresh-200 hover:bg-fresh-50/50"
            >
              {s}
            </button>
          ))}
        </div>
      ) : matchedIngredients.length === 0 && matchedRecipes.length === 0 ? (
        <EmptyState
          emoji="🔍"
          title={`'${q}'에 대한 결과가 없어요`}
          description="다른 검색어로 시도해보세요."
        />
      ) : (
        <div className="space-y-7">
          {matchedIngredients.length > 0 && (
            <section>
              <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">
                내 냉장고 <span className="text-fresh-600">{matchedIngredients.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {matchedIngredients.map((i) => (
                  <IngredientCard key={i.id} ingredient={i} />
                ))}
              </div>
            </section>
          )}
          {matchedRecipes.length > 0 && (
            <section>
              <h2 className="mb-3 text-[20.5px] font-extrabold text-ink-900">
                레시피 <span className="text-fresh-600">{matchedRecipes.length}</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
