"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Clock3 } from "lucide-react";
import type { TodayFocus } from "@/lib/insights";
import type { Ingredient } from "@/lib/types";
import { daysLeft } from "@/lib/expiry-calculator";
import { explainMatch } from "@/lib/recipe-matcher";
import { recipeImage } from "@/lib/images";
import { josa } from "@/lib/text";
import { useStore, useUndoToast } from "@/lib/store";
import IngredientThumb from "./IngredientThumb";

/** "두부·우유" / "두부·우유 외 2개" */
function names(items: Ingredient[], max = 2): string {
  const head = items
    .slice(0, max)
    .map((i) => i.name)
    .join("·");
  return items.length > max ? `${head} 외 ${items.length - max}개` : head;
}

function untilText(items: Ingredient[]): string {
  const d = Math.min(...items.map((i) => daysLeft(i.expiresAt) ?? 99));
  if (d <= 0) return "오늘까지예요";
  if (d === 1) return "내일까지예요";
  return `${d}일 남았어요`;
}

/**
 * 홈 맨 위 — 오늘 가장 먼저 할 일 하나.
 * 무엇을(재료) · 왜(기한) · 어떻게(요리/먹기/장보기)를 한 카드에서 끝낸다.
 */
const TONE = {
  coral: { dot: "bg-coral-500", text: "text-coral-700" },
  amber: { dot: "bg-amberish-500", text: "text-amberish-700" },
  fresh: { dot: "bg-fresh-500", text: "text-fresh-700" },
} as const;

/** 재료 사진 여러 장을 겹쳐 보여준다 (최대 3) */
function ThumbStack({ items }: { items: Ingredient[] }) {
  return (
    <span className="flex shrink-0 -space-x-3" aria-hidden>
      {items.slice(0, 3).map((i) => (
        <IngredientThumb
          key={i.id}
          name={i.name}
          category={i.category}
          className="h-14 w-14 bg-white shadow-sm ring-2 ring-white"
          sizes="56px"
        />
      ))}
    </span>
  );
}

/**
 * 홈 맨 위 — 오늘 가장 먼저 할 일 하나.
 * 무엇을(재료) · 왜(기한) · 어떻게(요리/먹기/장보기)를 한 카드에서 끝낸다.
 * 요리를 제안할 땐 요리 사진을 크게 보여줘 "이걸 만들면 된다"가 한눈에 들어오게 한다.
 */
export default function TodayFocusCard({ focus, onEat }: { focus: TodayFocus; onEat: (i: Ingredient) => void }) {
  const { addShoppingItem } = useStore();
  const undoToast = useUndoToast();

  let tone: keyof typeof TONE = "fresh";
  let title = "";
  let body: React.ReactNode = null;
  let actions: React.ReactNode = null;

  switch (focus.kind) {
    case "expired":
      tone = "coral";
      title = `기한이 지난 재료가 ${focus.items.length}개 있어요`;
      body = (
        <div className="flex items-center gap-4">
          <ThumbStack items={focus.items} />
          <p className="text-[16.5px] leading-relaxed text-ink-700">
            {names(focus.items, 3)} — 상태를 확인하고 먹었는지 버렸는지 정리해주세요. 정리해야 리포트가 정확해져요.
          </p>
        </div>
      );
      actions = (
        <Link href="/priority" className="btn-primary min-h-[54px] w-full sm:w-auto">
          정리하러 가기 <ArrowRight size={19} aria-hidden />
        </Link>
      );
      break;

    case "cook": {
      const { match, items } = focus;
      tone = focus.when === "today" ? "coral" : "amber";
      title = `${names(items)} ${untilText(items)}`;
      const usedIds = new Set(match.urgentOwned.map((u) => u.ingredient?.id));
      const leftover = items.filter((i) => !usedIds.has(i.id));
      const why = explainMatch(match);
      const usedNames = match.urgentOwned.map((u) => u.name);
      body = (
        <Link
          href={`/recipes/${match.recipe.id}`}
          className="group flex flex-col overflow-hidden rounded-2xl border border-ink-900/[0.07] bg-cream sm:flex-row"
        >
          <span className="relative block aspect-[16/10] w-full sm:aspect-square sm:w-[200px] sm:shrink-0">
            <Image
              src={recipeImage(match.recipe.image)}
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 100vw, 200px"
              className="object-contain p-3 transition-transform duration-300 group-hover:scale-[1.04]"
            />
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[14px] font-semibold text-ink-700 shadow-sm backdrop-blur">
              이걸로 만들면 좋아요
            </span>
          </span>
          <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 bg-white px-4 py-3.5 sm:px-5">
            <span className="text-[21px] font-bold tracking-[-0.02em] text-ink-900">{match.recipe.name}</span>
            <span className="text-[15.5px] font-medium leading-snug text-amberish-700">
              {usedNames.length > 1 ? `${usedNames.slice(0, 2).join("·")} 함께 사용` : `${usedNames[0]} 사용`}
            </span>
            <span className="flex flex-wrap items-center gap-x-1.5 text-[15.5px] text-ink-500">
              <span className={why.ready ? "font-medium text-fresh-700" : "font-semibold text-ink-700"}>
                {why.shopping}
              </span>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1 tabular-nums">
                <Clock3 size={15} aria-hidden />
                {why.minutes}
              </span>
            </span>
          </span>
        </Link>
      );
      actions = (
        <>
          <Link href={`/recipes/${match.recipe.id}`} className="btn-primary min-h-[54px] w-full sm:w-auto">
            {match.recipe.name} 만들기 <ArrowRight size={19} aria-hidden />
          </Link>
          {leftover[0] && (
            <button
              type="button"
              onClick={() => onEat(leftover[0])}
              className="btn-ghost min-h-[54px] w-full sm:w-auto"
            >
              {josa(leftover[0].name, "은/는")} 그냥 먹었어요
            </button>
          )}
        </>
      );
      break;
    }

    case "eat": {
      const first = focus.items[0];
      tone = focus.when === "today" ? "coral" : "amber";
      title = `${names(focus.items)} ${untilText(focus.items)}`;
      body = (
        <div className="flex items-center gap-4">
          <ThumbStack items={focus.items} />
          <p className="text-[16.5px] leading-relaxed text-ink-700">
            지금 재료로 함께 쓸 요리가 없어요. {josa(first.name, "을/를")} 그대로 드시거나, 필요한 재료를 사서
            요리해보세요.
          </p>
        </div>
      );
      actions = (
        <>
          <button type="button" onClick={() => onEat(first)} className="btn-primary min-h-[54px] w-full sm:w-auto">
            {josa(first.name, "을/를")} 먹었어요
          </button>
          <Link
            href={`/recipes?with=${encodeURIComponent(first.name)}`}
            className="btn-ghost min-h-[54px] w-full sm:w-auto"
          >
            요리 찾아보기
          </Link>
        </>
      );
      break;
    }

    case "restock": {
      const s = focus.suggestion;
      title = s.reason === "low" ? `${josa(s.name, "을/를")} 거의 다 먹었어요` : `${s.name}, 다시 살 때가 됐어요`;
      body = (
        <div className="flex items-center gap-4">
          <IngredientThumb
            name={s.name}
            category={s.ingredient?.category ?? "etc"}
            className="h-14 w-14 bg-warmwhite"
            sizes="56px"
          />
          <p className="text-[16.5px] leading-relaxed text-ink-700">{s.detail}. 다음 장보기에 넣어둘까요?</p>
        </div>
      );
      actions = (
        <>
          <button
            type="button"
            onClick={() => {
              const token = addShoppingItem(s.name, { restock: true });
              undoToast(`${josa(s.name, "을/를")} 장보기에 담았어요`, token);
            }}
            className="btn-primary min-h-[54px] w-full sm:w-auto"
          >
            장보기에 담기
          </button>
          <Link href="/shopping" className="btn-ghost min-h-[54px] w-full sm:w-auto">
            장보기 보기
          </Link>
        </>
      );
      break;
    }

    case "relaxed":
      title = "오늘은 급한 재료가 없어요";
      body = (
        <p className="text-[16.5px] leading-relaxed text-ink-700">
          {focus.match
            ? `냉장고 재료로 ${focus.match.recipe.name}(${focus.match.recipe.minutes}분)을 바로 만들 수 있어요.`
            : "새로 산 재료를 등록하면 기한을 대신 챙겨드려요."}
        </p>
      );
      actions = focus.match ? (
        <Link href={`/recipes/${focus.match.recipe.id}`} className="btn-primary min-h-[54px] w-full sm:w-auto">
          레시피 보기 <ArrowRight size={19} aria-hidden />
        </Link>
      ) : (
        <Link href="/add" className="btn-primary min-h-[54px] w-full sm:w-auto">
          식재료 추가하기
        </Link>
      );
      break;
  }

  return (
    <section aria-labelledby="today-focus-title" className="card p-4 sm:p-5">
      <p className={`flex items-center gap-2 text-[14.5px] font-semibold ${TONE[tone].text}`}>
        <span className={`h-2 w-2 rounded-full ${TONE[tone].dot}`} aria-hidden />
        오늘 할 일
      </p>
      <h2
        id="today-focus-title"
        className="mt-1 text-[23px] font-bold leading-snug tracking-[-0.02em] text-ink-900 sm:text-[25px]"
      >
        {title}
      </h2>
      <div className="mt-3.5">{body}</div>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">{actions}</div>
    </section>
  );
}
