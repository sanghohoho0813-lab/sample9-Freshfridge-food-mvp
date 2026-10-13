"use client";

import Link from "next/link";
import Image from "next/image";
import { explainMatch, type RecipeMatch } from "@/lib/recipe-matcher";
import { daysLeft } from "@/lib/expiry-calculator";
import { recipeImage } from "@/lib/images";
import { relativeDay } from "@/lib/stats";

/**
 * 레시피 카드 — 모바일에선 사진이 왼쪽인 가로형, sm 이상에선 사진이 위인 세로형.
 * 추천 근거를 세 가지로만 보여준다: 급한 재료 활용 · 사야 할 것 · 조리 시간.
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
  /** auto: 모바일 가로형 → sm 이상 세로형 / row: 항상 가로형 (좁은 자리용) */
  layout?: "auto" | "row";
  /** 첫 화면에 바로 보이는 카드 — 이미지를 먼저 불러온다(LCP) */
  priority?: boolean;
}) {
  const { recipe } = match;
  const why = explainMatch(match);
  const row = layout === "row";
  const recentCook = !!lastCooked && -(daysLeft(lastCooked) ?? 99) < 7;

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className={`card card-hover group flex items-stretch overflow-hidden ${row ? "" : "sm:flex-col"}`}
    >
      <div className={`relative w-[104px] shrink-0 bg-cream ${row ? "sm:w-[120px]" : "sm:aspect-[4/3] sm:w-full"}`}>
        <Image
          src={recipeImage(recipe.image)}
          alt=""
          fill
          priority={priority}
          sizes={row ? "120px" : "(max-width: 640px) 104px, 360px"}
          className="object-contain p-2 transition-transform duration-300 group-hover:scale-105 sm:p-3"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3 sm:p-4">
        <p className={`truncate text-[18.5px] font-bold text-ink-900 ${row ? "" : "sm:text-[20px]"}`}>{recipe.name}</p>
        {why.urgent && (
          <p className="line-clamp-2 text-[15.5px] font-semibold leading-snug text-amberish-700">{why.urgent}</p>
        )}
        <p className="text-[15px] leading-snug text-ink-500">
          <span className={why.ready ? "text-fresh-700" : "font-semibold text-ink-700"}>{why.shopping}</span>
          {" · "}
          <span className="tabular-nums">{why.minutes}</span>
          {recentCook && <span> · {relativeDay(lastCooked!)} 만듦</span>}
        </p>
      </div>
    </Link>
  );
}
