"use client";

import { Plus } from "lucide-react";
import type { RestockSuggestion } from "@/lib/insights";
import { useStore, useUndoToast } from "@/lib/store";
import { ingredientDefaults } from "@/lib/demo-data";
import { josa } from "@/lib/text";
import IngredientThumb from "./IngredientThumb";
import ListGroup from "./ui/ListGroup";

/**
 * "장보기에 넣을 것" — 거의 다 먹었거나, 자주 먹는데 떨어진 재료.
 * 눌러야 담긴다 (자동으로 장보기에 넣지 않는다).
 */
export default function RestockList({ items }: { items: RestockSuggestion[] }) {
  const { addShoppingItem } = useStore();
  const undoToast = useUndoToast();
  return (
    <ListGroup>
      {items.map((s) => (
        <li key={s.name} className="flex items-center gap-3 bg-white py-2.5 pl-3 pr-2.5 sm:pl-4">
          <IngredientThumb
            name={s.name}
            category={s.ingredient?.category ?? ingredientDefaults(s.name).category}
            className="h-11 w-11 bg-warmwhite"
            sizes="44px"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17.5px] font-semibold text-ink-900">{s.name}</p>
            <p className="text-[15px] leading-snug text-ink-500">{s.detail}</p>
          </div>
          <button
            type="button"
            aria-label={`${s.name} 장보기에 담기`}
            onClick={() => {
              const token = addShoppingItem(s.name, { restock: true });
              undoToast(`${josa(s.name, "을/를")} 장보기에 담았어요`, token);
            }}
            className="inline-flex min-h-[42px] shrink-0 items-center gap-1 rounded-full border border-ink-900/[0.12] bg-white px-3.5 text-[15.5px] font-semibold text-ink-800 transition-all hover:border-fresh-500 hover:text-fresh-700 active:scale-[0.97]"
          >
            <Plus size={17} aria-hidden />
            담기
          </button>
        </li>
      ))}
    </ListGroup>
  );
}
