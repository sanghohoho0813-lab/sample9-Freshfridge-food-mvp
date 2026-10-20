"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock3 } from "lucide-react";
import { explainMatch, type RecipeMatch } from "@/lib/recipe-matcher";
import { daysLeft } from "@/lib/expiry-calculator";
import { recipeImage } from "@/lib/images";
import { relativeDay } from "@/lib/stats";

type Layout = "tile" | "row" | "auto";

/**
 * 레시피 카드. 추천 근거는 세 가지로만 보여준다: 급한 재료 활용 · 사야 할 것 · 조리 시간.
 * - tile: 사진이 위인 카드 (가로로 넘기는 목록·그리드)
 * - row : 사진이 왼쪽인 목록 행 — 테두리 없이 RecipeList 안에서 구분선으로 나뉜다
 * - auto: 모바일은 row, sm 이상은 tile
 */
export default function RecipeCard({
  match,
  lastCooked,
  layout = "auto",
  priority = false,
}: {
  match: RecipeMatch;
  /** 마지막으로 만든 날짜 (최근 일주일 안이면 "어제 만듦") */
  lastCooked?: string;
  layout?: Layout;
  /** 첫 화면에 바로 보이는 카드 — 이미지를 먼저 불러온다(LCP) */
  priority?: boolean;
}) {
  const { recipe } = match;
  const why = explainMatch(match);
  const recentCook = !!lastCooked && -(daysLeft(lastCooked) ?? 99) < 7;

  const tile = layout === "tile";
  const auto = layout === "auto";
  const box = tile
    ? "card card-hover flex h-full flex-col overflow-hidden"
    : auto
      ? "flex items-center gap-3.5 px-3.5 py-3 transition-colors hover:bg-warmwhite active:bg-ink-900/[0.03] sm:card sm:card-hover sm:h-full sm:flex-col sm:items-stretch sm:gap-0 sm:overflow-hidden sm:p-0 sm:hover:bg-white"
      : "flex items-center gap-3.5 px-3.5 py-3 transition-colors hover:bg-warmwhite active:bg-ink-900/[0.03] sm:px-4";
  const media = tile
    ? "relative aspect-[4/3] w-full bg-cream"
    : auto
      ? "relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-cream sm:aspect-[4/3] sm:h-auto sm:w-full sm:rounded-none"
      : "relative h-[92px] w-[92px] shrink-0 overflow-hidden rounded-2xl bg-cream";
  const body = tile
    ? "flex flex-1 flex-col gap-1 p-4"
    : auto
      ? "flex min-w-0 flex-1 flex-col gap-1 sm:p-4"
      : "flex min-w-0 flex-1 flex-col gap-1";
  // 사진 위 조리시간 표시는 카드형에서만 (행에서는 글 줄에 함께 쓴다)
  const timeOnImage = tile ? "flex" : auto ? "hidden sm:flex" : "hidden";
  const timeInText = tile ? "hidden" : auto ? "sm:hidden" : "";

  return (
    <Link href={`/recipes/${recipe.id}`} className={`group ${box}`}>
      <span className={media}>
        <Image
          src={recipeImage(recipe.image)}
          alt=""
          fill
          priority={priority}
          sizes={tile ? "(max-width: 640px) 260px, 360px" : auto ? "(max-width: 640px) 92px, 360px" : "92px"}
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-[1.04] sm:p-3"
        />
        <span
          className={`${timeOnImage} absolute bottom-2.5 left-2.5 items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[14px] font-semibold tabular-nums text-ink-700 shadow-sm backdrop-blur`}
        >
          <Clock3 size={14} aria-hidden />
          {why.minutes}
        </span>
      </span>
      <span className={body}>
        <span className="line-clamp-1 text-[18px] font-bold tracking-[-0.01em] text-ink-900">{recipe.name}</span>
        {why.urgent && (
          <span className="line-clamp-2 text-[15px] font-medium leading-snug text-amberish-700">{why.urgent}</span>
        )}
        <span className="text-[15px] leading-snug text-ink-500">
          <span className={why.ready ? "font-medium text-fresh-700" : "font-semibold text-ink-700"}>
            {why.shopping}
          </span>
          <span className={timeInText}>
            {" · "}
            <span className="tabular-nums">{why.minutes}</span>
          </span>
          {recentCook && <span> · {relativeDay(lastCooked!)} 만듦</span>}
        </span>
      </span>
    </Link>
  );
}

/** row·auto 카드를 담는 목록 — 모바일에선 하나의 흰 판에 구분선, auto 는 sm 이상에서 카드 그리드 */
export function RecipeList({ children, auto = true }: { children: React.ReactNode; auto?: boolean }) {
  return (
    <ul
      className={`divide-y divide-ink-900/[0.06] overflow-hidden rounded-card border border-ink-900/[0.07] bg-white ${
        auto
          ? "sm:grid sm:grid-cols-2 sm:gap-4 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0 sm:bg-transparent lg:grid-cols-3"
          : ""
      }`}
    >
      {children}
    </ul>
  );
}
