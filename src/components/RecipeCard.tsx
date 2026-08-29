"use client";

import Link from "next/link";
import Image from "next/image";
import { Clock3, Gauge } from "lucide-react";
import type { RecipeMatch } from "@/lib/recipe-matcher";
import { dDayLabel } from "@/lib/expiry-calculator";
import { recipeImage } from "@/lib/images";

export default function RecipeCard({ match }: { match: RecipeMatch }) {
  const { recipe, matchPercent, missing, urgentOwned } = match;
  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="card card-hover group flex flex-col overflow-hidden"
    >
      {/* 레시피 대표이미지 (4:3) */}
      <div className="relative aspect-[4/3] w-full bg-gradient-to-br from-fresh-50 via-mint-50 to-cream">
        <Image
          src={recipeImage(recipe.image)}
          alt={recipe.name}
          fill
          sizes="(max-width: 640px) 100vw, 340px"
          className="object-contain p-3 transition-transform duration-300 group-hover:scale-105"
        />
        <span className="absolute left-3 top-3 rounded-chip bg-white/90 px-2.5 py-1 text-[14.3px] font-bold text-fresh-600 shadow-soft">
          보유 재료 {matchPercent}%
        </span>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <p className="text-[20.2px] font-bold text-ink-900">{recipe.name}</p>
          <p className="mt-0.5 flex items-center gap-2.5 text-[15.6px] text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Clock3 size={17} /> {recipe.minutes}분
            </span>
            <span className="inline-flex items-center gap-1">
              <Gauge size={17} /> {recipe.difficulty}
            </span>
          </p>
        </div>

        {/* 매칭 프로그레스 */}
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-fresh-50">
          <div
            className="h-full rounded-full bg-fresh-400 transition-all duration-300"
            style={{ width: `${matchPercent}%` }}
          />
        </div>

        {urgentOwned.length > 0 && (
          <p className="text-[15.6px] font-medium text-amberish-600">
            먼저 소비:{" "}
            {urgentOwned
              .slice(0, 2)
              .map((m) => `${m.name} ${dDayLabel(m.ingredient?.expiresAt ?? null)}`)
              .join(" · ")}
          </p>
        )}
        {missing.length > 0 ? (
          <p className="truncate text-[15.6px] text-ink-400">
            추가 필요: {missing.map((m) => m.name).join(", ")}
          </p>
        ) : (
          <p className="text-[15.6px] font-medium text-fresh-600">재료가 모두 있어요 ✓</p>
        )}
      </div>
    </Link>
  );
}
