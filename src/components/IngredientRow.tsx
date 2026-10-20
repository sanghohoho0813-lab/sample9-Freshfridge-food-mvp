"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { Ingredient } from "@/lib/types";
import { STORAGE_LABELS } from "@/lib/types";
import { daysLeft, expiryLevel, formatKoreanDate } from "@/lib/expiry-calculator";
import { formatAmount } from "@/lib/quantity";
import { isRunningLow, remainingRatio } from "@/lib/insights";
import ExpiryBadge from "./ExpiryBadge";
import IngredientThumb from "./IngredientThumb";
import Highlight from "./Highlight";

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
  ok: "text-ink-500",
  unknown: "text-ink-500",
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

/** 남은 양 — 일부를 썼으면 "8/10개"와 작은 막대로, 손대지 않았으면 "2개" */
function Remaining({ ingredient }: { ingredient: Ingredient }) {
  const initial = ingredient.initialQuantity ?? ingredient.quantity;
  if (!(initial > ingredient.quantity)) return <>{formatAmount(ingredient.quantity, ingredient.unit)}</>;
  const ratio = remainingRatio(ingredient);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span>
        {formatAmount(ingredient.quantity)}/{formatAmount(initial, ingredient.unit)}
      </span>
      <span className="relative inline-block h-1.5 w-8 overflow-hidden rounded-full bg-ink-300/30" aria-hidden>
        <span
          className={`absolute inset-y-0 left-0 rounded-full ${isRunningLow(ingredient) ? "bg-amberish-500" : "bg-fresh-500"}`}
          style={{ width: `${Math.max(8, ratio * 100)}%` }}
        />
      </span>
    </span>
  );
}

/**
 * 재료 목록의 한 줄. 행을 누르면 상세로 가고,
 * onEat 이 있으면 오른쪽에 "먹었어요" 버튼을 둬서 목록에서 바로 기록할 수 있다.
 */
export default function IngredientRow({
  ingredient,
  onEat,
  highlight = false,
  showStorage = true,
  query,
}: {
  ingredient: Ingredient;
  onEat?: (ingredient: Ingredient) => void;
  /** 방금 추가한 재료 — 잠깐 강조해서 찾기 쉽게 */
  highlight?: boolean;
  /** 보관위치 탭으로 이미 걸러 보는 화면에서는 끄고, 그 자리에 날짜를 보여준다 */
  showStorage?: boolean;
  /** 검색 화면 — 이름에서 검색어와 맞는 부분 표시 */
  query?: string;
}) {
  const level = expiryLevel(ingredient.expiresAt);
  const hint = shortExpiry(ingredient.expiresAt);
  return (
    <li
      id={`ing-${ingredient.id}`}
      className={`flex scroll-mt-28 items-center gap-2 pr-2.5 transition-colors duration-700 sm:pr-3 ${
        highlight ? "bg-fresh-50" : "bg-white hover:bg-warmwhite"
      }`}
    >
      <Link
        href={`/ingredient/${ingredient.id}`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-3 transition-opacity active:opacity-70 sm:gap-3.5 sm:pl-4"
      >
        <IngredientThumb
          name={ingredient.name}
          category={ingredient.category}
          className={`h-12 w-12 text-[24px] sm:h-14 sm:w-14 sm:text-[28px] ${TILE_BG[level]}`}
          sizes="56px"
        />
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-[18px] font-semibold leading-snug text-ink-900">
            <Highlight text={ingredient.name} query={query} />
          </p>
          <div className="mt-1 flex min-w-0 items-center gap-1.5">
            <ExpiryBadge expiresAt={ingredient.expiresAt} size="sm" />
            <p className="min-w-0 text-[15.5px] tabular-nums leading-snug text-ink-500">
              <Remaining ingredient={ingredient} />
              {showStorage ? (
                <>
                  {" "}
                  · {STORAGE_LABELS[ingredient.storage]}
                  {hint && <span className={`hidden sm:inline ${HINT_TONE[level]}`}> · {hint}</span>}
                </>
              ) : (
                hint && <span className={HINT_TONE[level]}> · {hint}</span>
              )}
            </p>
          </div>
        </div>
      </Link>
      {onEat ? (
        <button
          type="button"
          onClick={() => onEat(ingredient)}
          className="min-h-[42px] shrink-0 rounded-full bg-fresh-50 px-3.5 text-[15.5px] font-semibold text-fresh-700 transition-colors hover:bg-fresh-100 active:scale-[0.97] sm:px-4"
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
