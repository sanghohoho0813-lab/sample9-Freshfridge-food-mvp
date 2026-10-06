"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Ingredient } from "@/lib/types";
import { STORAGE_LABELS } from "@/lib/types";
import { daysLeft, expiryLevel, formatKoreanDate } from "@/lib/expiry-calculator";
import { formatAmount } from "@/lib/quantity";
import ExpiryBadge from "./ExpiryBadge";
import IngredientThumb from "./IngredientThumb";

const TILE_BG: Record<string, string> = {
  expired: "bg-coral-50",
  urgent: "bg-coral-50",
  soon: "bg-amberish-50",
  ok: "bg-warmwhite",
  unknown: "bg-warmwhite",
};

const HINT_TONE: Record<string, string> = {
  expired: "text-coral-700",
  urgent: "text-coral-700",
  soon: "text-amberish-700",
  ok: "text-ink-400",
  unknown: "text-ink-400",
};

/** 행에 들어가는 짧은 기한 문구 — 배지(D-1)를 보완하는 날짜 정보 */
function shortExpiry(expiresAt: string | null): string | null {
  const d = daysLeft(expiresAt);
  if (d === null || !expiresAt) return null;
  if (d < 0) return `${Math.abs(d)}일 지남`;
  if (d === 0) return "오늘까지";
  if (d === 1) return "내일까지";
  return `${formatKoreanDate(expiresAt)}까지`;
}

/**
 * 재료 목록의 한 줄. 행을 누르면 상세로 가고,
 * onEat 이 있으면 오른쪽에 "먹었어요" 버튼을 둬서 목록에서 바로 기록할 수 있다.
 */
export default function IngredientRow({
  ingredient,
  onEat,
  highlight = false,
}: {
  ingredient: Ingredient;
  onEat?: (ingredient: Ingredient) => void;
  /** 방금 추가한 재료 — 잠깐 강조해서 찾기 쉽게 */
  highlight?: boolean;
}) {
  const level = expiryLevel(ingredient.expiresAt);
  const hint = shortExpiry(ingredient.expiresAt);
  return (
    <li
      id={`ing-${ingredient.id}`}
      className={`flex scroll-mt-28 items-center gap-2 pr-2.5 transition-colors duration-700 sm:pr-3 ${
        highlight ? "bg-fresh-50" : "bg-white hover:bg-warmwhite/70"
      }`}
    >
      <Link
        href={`/ingredient/${ingredient.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 sm:gap-3.5 sm:pl-4"
      >
        <IngredientThumb
          name={ingredient.name}
          emoji={ingredient.emoji}
          className={`h-12 w-12 text-[24px] sm:h-14 sm:w-14 sm:text-[28px] ${TILE_BG[level]}`}
          sizes="56px"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[18.5px] font-bold leading-snug text-ink-900">{ingredient.name}</p>
          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <ExpiryBadge expiresAt={ingredient.expiresAt} size="sm" />
            <p className="min-w-0 text-[15.5px] leading-snug text-ink-500">
              {formatAmount(ingredient.quantity, ingredient.unit)} · {STORAGE_LABELS[ingredient.storage]}
              {hint && <span className={`hidden sm:inline ${HINT_TONE[level]}`}> · {hint}</span>}
            </p>
          </div>
        </div>
      </Link>
      {onEat ? (
        <button
          type="button"
          onClick={() => onEat(ingredient)}
          className="min-h-[44px] shrink-0 rounded-xl bg-fresh-50 px-3 text-[15.5px] font-semibold text-fresh-700 transition-colors hover:bg-fresh-100 active:scale-[0.97] sm:px-3.5"
          aria-label={`${ingredient.name} 먹었어요`}
        >
          먹었어요
        </button>
      ) : (
        <ChevronRight size={20} className="shrink-0 text-ink-300" aria-hidden />
      )}
    </li>
  );
}
