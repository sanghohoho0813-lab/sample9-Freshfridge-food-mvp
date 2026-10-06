"use client";

import Link from "next/link";
import Image from "next/image";
import type { RecipeMatch } from "@/lib/recipe-matcher";
import { dDayLabel, daysLeft } from "@/lib/expiry-calculator";
import { recipeImage } from "@/lib/images";
import { relativeDay } from "@/lib/stats";

/**
 * 레시피 카드 — 모바일에선 사진이 왼쪽인 가로형(목록을 빠르게 훑기 좋게),
 * sm 이상에선 사진이 위에 오는 세로형.
 * 정보는 "이름 · 시간/난이도 · 상태 한 줄"만 보여준다.
 */
export default function RecipeCard({
  match,
  lastCooked,
  layout = "auto",
  priority = false,
}: {
  match: RecipeMatch;
  /** auto: 모바일 가로형 → sm 이상 세로형 / row: 항상 가로형 (좁은 상세 화면용) */
  layout?: "auto" | "row";
  /** 첫 화면에 바로 보이는 카드 — 이미지를 먼저 불러온다(LCP) */
  priority?: boolean;
  /** 마지막으로 만든 날짜 (있으면 "3일 전 만들었어요") */
  lastCooked?: string;
}) {
  const { recipe, matchPercent, missing, urgentOwned } = match;
  // 최근 일주일 안에 만든 것만 표시 — 오래된 기록은 정보만 늘린다
  const row = layout === "row";
  const recentCook = !!lastCooked && -(daysLeft(lastCooked) ?? 99) < 7;

  let status: { text: string; tone: string };
  if (urgentOwned.length > 0) {
    const first = urgentOwned[0];
    status = {
      text: `${first.name} ${dDayLabel(first.ingredient?.expiresAt ?? null)}${
        urgentOwned.length > 1 ? ` 외 ${urgentOwned.length - 1}개` : ""
      } 먼저 사용`,
      tone: "text-amberish-700",
    };
  } else if (missing.length > 0) {
    status = {
      text: `${missing
        .slice(0, 2)
        .map((m) => m.name)
        .join(", ")}${missing.length > 2 ? ` 외 ${missing.length - 2}개` : ""} 필요`,
      tone: "text-ink-500",
    };
  } else {
    status = { text: "재료가 모두 있어요", tone: "text-fresh-700" };
  }

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
        {matchPercent < 100 && !row && (
          <span className="absolute left-3 top-3 hidden rounded-chip bg-white/90 px-2.5 py-1 text-[14.5px] font-bold text-ink-700 shadow-soft sm:inline-flex">
            재료 {matchPercent}%
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3 sm:p-4">
        <p className={`truncate text-[18.5px] font-bold text-ink-900 ${row ? "" : "sm:text-[20.5px]"}`}>
          {recipe.name}
        </p>
        <p className="text-[15.5px] text-ink-500">
          {recipe.minutes}분 · {recipe.difficulty}
          {matchPercent < 100 && <span className={row ? "" : "sm:hidden"}> · 재료 {matchPercent}%</span>}
          {recentCook && <span> · {relativeDay(lastCooked!)} 만듦</span>}
        </p>
        <p className={`line-clamp-2 text-[15.5px] font-medium leading-snug ${status.tone}`}>{status.text}</p>
      </div>
    </Link>
  );
}
