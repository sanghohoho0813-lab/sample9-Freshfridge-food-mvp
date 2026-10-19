"use client";

import Link from "next/link";
import type { Ingredient } from "@/lib/types";
import { STORAGE_LABELS } from "@/lib/types";
import { expiryLevel } from "@/lib/expiry-calculator";
import { formatAmount } from "@/lib/quantity";
import ExpiryBadge from "./ExpiryBadge";
import IngredientThumb from "./IngredientThumb";

// 사진 바탕색도 기한 상태를 따른다 (빨강·주황·무채색) — 색만으로 구분하지 않게 배지를 함께 둔다
const STAGE_BG: Record<string, string> = {
  expired: "bg-coral-50",
  urgent: "bg-coral-50",
  soon: "bg-amberish-50",
  ok: "bg-warmwhite",
  unknown: "bg-warmwhite",
};

/** 사진이 큰 재료 카드 — 홈의 "먼저 먹어야 할 재료"처럼 몇 개만 크게 보여줄 때 */
export default function IngredientTile({
  ingredient,
  onEat,
}: {
  ingredient: Ingredient;
  onEat: (ingredient: Ingredient) => void;
}) {
  const level = expiryLevel(ingredient.expiresAt);
  return (
    <li className="w-[150px] shrink-0 sm:w-auto">
      <div className="card flex h-full flex-col overflow-hidden">
        <Link href={`/ingredient/${ingredient.id}`} className="group block">
          <span className={`relative block aspect-[5/4] ${STAGE_BG[level]}`}>
            <IngredientThumb
              name={ingredient.name}
              category={ingredient.category}
              className="absolute inset-0 h-full w-full rounded-none p-2 transition-transform duration-300 group-hover:scale-[1.05]"
              sizes="(max-width: 640px) 150px, 200px"
            />
            <span className="absolute left-2.5 top-2.5">
              <ExpiryBadge expiresAt={ingredient.expiresAt} size="sm" />
            </span>
          </span>
          <span className="block px-3 pt-2.5">
            <span className="line-clamp-1 text-[17.5px] font-bold text-ink-900">{ingredient.name}</span>
            <span className="block text-[14.5px] tabular-nums text-ink-500">
              {formatAmount(ingredient.quantity, ingredient.unit)} · {STORAGE_LABELS[ingredient.storage]}
            </span>
          </span>
        </Link>
        <div className="mt-auto p-3 pt-2.5">
          <button
            type="button"
            onClick={() => onEat(ingredient)}
            aria-label={`${ingredient.name} 먹었어요`}
            className="btn-soft min-h-[42px] w-full px-3 py-1.5 text-[15.5px]"
          >
            먹었어요
          </button>
        </div>
      </div>
    </li>
  );
}
