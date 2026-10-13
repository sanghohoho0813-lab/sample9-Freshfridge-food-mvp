"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronRight, Leaf } from "lucide-react";
import { useFridge, useStore } from "@/lib/store";
import type { Ingredient } from "@/lib/types";
import {
  daysLeft,
  EXPIRY_GROUP_LABEL,
  expiryGroup,
  formatKoreanDate,
  formatWon,
  sortByExpiry,
  type ExpiryGroup,
} from "@/lib/expiry-calculator";
import { formatAmount } from "@/lib/quantity";
import { RECIPES } from "@/lib/demo-data";
import { recipesUsing } from "@/lib/recommendation-engine";
import { explainMatch, rankRecipes } from "@/lib/recipe-matcher";
import { recipeImage } from "@/lib/images";
import ExpiryBadge from "@/components/ExpiryBadge";
import IngredientRow from "@/components/IngredientRow";
import IngredientThumb from "@/components/IngredientThumb";
import ListGroup from "@/components/ui/ListGroup";
import PageHeader from "@/components/ui/PageHeader";
import PageLoading from "@/components/ui/PageLoading";
import { useIngredientActions } from "@/components/useIngredientActions";
import EmptyState from "@/components/EmptyState";

/** 자세히 보여줄 구간 (왜 지금 + 무엇을 만들지) / 목록으로 보여줄 구간 */
const FOCUS_GROUPS: ExpiryGroup[] = ["expired", "today", "soon"];
const LIST_GROUPS: ExpiryGroup[] = ["week"];

const GROUP_SUB: Partial<Record<ExpiryGroup, string>> = {
  expired: "상태를 확인하고 먹었는지 버렸는지 정리해주세요",
  today: "오늘 먹거나 요리에 써주세요",
  soon: "이번 끼니에 챙겨 드세요",
  week: "일주일 안에 드시면 돼요",
};

function whyNow(i: Ingredient): string {
  const d = daysLeft(i.expiresAt) ?? 0;
  const when =
    d < 0
      ? `${formatKoreanDate(i.expiresAt!)}까지였어요`
      : d === 0
        ? "오늘이 마지막 날이에요"
        : d === 1
          ? "내일까지예요"
          : `${d}일 남았어요`;
  // 남은 양의 금액 — 버리면 그만큼 손해라는 걸 숫자로
  return i.price > 0 ? `${when} · 남은 ${formatAmount(i.quantity, i.unit)}, ${formatWon(i.price)}어치` : when;
}

export default function PriorityPage() {
  const { ready } = useStore();
  const fridge = useFridge();
  const { eat, discard, element: actionSheet } = useIngredientActions();

  const groups = useMemo(() => {
    const map = new Map<ExpiryGroup, Ingredient[]>();
    for (const ing of sortByExpiry(fridge)) {
      const g = expiryGroup(ing.expiresAt);
      map.set(g, [...(map.get(g) ?? []), ing]);
    }
    return map;
  }, [fridge]);

  // 급한 재료 여러 개를 한 번에 쓰는 요리 (2개 이상일 때만 따로 보여준다)
  const rescue = useMemo(() => {
    const top = rankRecipes(RECIPES, fridge).find((m) => m.readyToCook && m.urgentOwned.length >= 2);
    return top ?? null;
  }, [fridge]);

  if (!ready) return <PageLoading title="우선소비" back="/" width="6xl" />;

  const focusItems = FOCUS_GROUPS.flatMap((g) => groups.get(g) ?? []);
  const atStake = focusItems.reduce((s, i) => s + i.price, 0);
  const isEmpty = [...FOCUS_GROUPS, ...LIST_GROUPS].every((g) => !groups.get(g)?.length);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        back="/"
        title="우선소비"
        description={
          focusItems.length > 0
            ? `3일 안에 기한이 끝나는 재료 ${focusItems.length}개 · 모두 버리면 ${formatWon(atStake)}이에요`
            : "이번 주 안에 먹으면 좋은 재료를 모았어요."
        }
      />

      {rescue && (
        <Link
          href={`/recipes/${rescue.recipe.id}`}
          className="card card-hover flex items-center gap-3.5 p-3 sm:gap-4 sm:p-4"
        >
          <span className="relative h-[72px] w-[72px] shrink-0 overflow-hidden rounded-2xl bg-cream sm:h-20 sm:w-20">
            <Image src={recipeImage(rescue.recipe.image)} alt="" fill sizes="80px" className="object-contain p-1.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-amberish-700">
              급한 재료 {rescue.urgentOwned.length}개를 한 번에 쓰는 요리
            </p>
            <p className="truncate text-[19.5px] font-extrabold text-ink-900">{rescue.recipe.name}</p>
            <p className="line-clamp-2 text-[15.5px] leading-snug text-ink-500">
              {explainMatch(rescue).urgent} · {explainMatch(rescue).shopping} · {rescue.recipe.minutes}분
            </p>
          </div>
          <ChevronRight size={22} className="shrink-0 text-ink-300" aria-hidden />
        </Link>
      )}

      {isEmpty ? (
        <EmptyState
          icon={Leaf}
          title="지금은 급한 재료가 없어요"
          description="기한이 일주일 안으로 다가오면 여기에 모아 보여드려요."
          ctaLabel="내 냉장고 보기"
          ctaHref="/fridge"
        />
      ) : (
        <>
          {FOCUS_GROUPS.map((g) => {
            const list = groups.get(g);
            if (!list?.length) return null;
            return (
              <section key={g} aria-labelledby={`group-${g}`}>
                <GroupTitle group={g} count={list.length} />
                <ul className="grid gap-3 xl:grid-cols-2">
                  {list.map((ing) => (
                    <PriorityItem
                      key={ing.id}
                      ingredient={ing}
                      fridge={fridge}
                      expired={g === "expired"}
                      onEat={eat}
                      onDiscard={discard}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
          {LIST_GROUPS.map((g) => {
            const list = groups.get(g);
            if (!list?.length) return null;
            return (
              <section key={g} aria-labelledby={`group-${g}`}>
                <GroupTitle group={g} count={list.length} />
                <ListGroup columns={2}>
                  {list.map((ing) => (
                    <IngredientRow key={ing.id} ingredient={ing} onEat={eat} />
                  ))}
                </ListGroup>
              </section>
            );
          })}
        </>
      )}

      {actionSheet}
    </div>
  );
}

function GroupTitle({ group, count }: { group: ExpiryGroup; count: number }) {
  const tone =
    group === "expired" || group === "today"
      ? "text-coral-700"
      : group === "soon"
        ? "text-amberish-700"
        : "text-ink-900";
  return (
    <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
      <h2 id={`group-${group}`} className={`text-[20.5px] font-extrabold ${tone}`}>
        {EXPIRY_GROUP_LABEL[group]} <span className="text-[16.5px] font-bold tabular-nums text-ink-400">{count}</span>
      </h2>
      <span className="text-[15.5px] text-ink-500">{GROUP_SUB[group]}</span>
    </div>
  );
}

/** 급한 재료 하나 — 왜 지금인지 + 이걸로 만들 수 있는 요리 + 바로 할 수 있는 행동 */
function PriorityItem({
  ingredient,
  fridge,
  expired,
  onEat,
  onDiscard,
}: {
  ingredient: Ingredient;
  fridge: Ingredient[];
  expired: boolean;
  onEat: (i: Ingredient) => void;
  onDiscard: (i: Ingredient) => void;
}) {
  const recipes = useMemo(
    () => (expired ? [] : recipesUsing(ingredient.name, RECIPES, fridge, 2)),
    [ingredient, fridge, expired]
  );
  return (
    <li className="card overflow-hidden">
      <Link href={`/ingredient/${ingredient.id}`} className="flex items-center gap-3 p-3.5 pb-3 sm:p-4 sm:pb-3">
        <IngredientThumb
          name={ingredient.name}
          category={ingredient.category}
          className={`h-14 w-14 ${expired ? "bg-coral-50" : "bg-warmwhite"}`}
          sizes="56px"
        />
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-2">
            <span className="truncate text-[19px] font-extrabold text-ink-900">{ingredient.name}</span>
            <ExpiryBadge expiresAt={ingredient.expiresAt} size="sm" />
          </p>
          <p className="mt-0.5 text-[15.5px] leading-snug text-ink-600">{whyNow(ingredient)}</p>
        </div>
      </Link>

      {recipes.length > 0 && (
        <div className="px-3.5 sm:px-4">
          <p className="mb-1.5 text-[14.5px] font-bold text-ink-500">이걸로 만들 수 있어요</p>
          <ul className="space-y-1.5">
            {recipes.map((m) => {
              const why = explainMatch(m);
              return (
                <li key={m.recipe.id}>
                  <Link
                    href={`/recipes/${m.recipe.id}`}
                    className="flex items-center gap-2.5 rounded-xl bg-warmwhite p-2 pr-2.5 transition-colors hover:bg-fresh-50"
                  >
                    <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-cream">
                      <Image
                        src={recipeImage(m.recipe.image)}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-contain p-0.5"
                      />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[16.5px] font-bold text-ink-900">{m.recipe.name}</span>
                      <span className={`block text-[14.5px] ${why.ready ? "text-fresh-700" : "text-ink-600"}`}>
                        {why.shopping} · {why.minutes}
                      </span>
                    </span>
                    <span className="shrink-0 text-[15px] font-semibold text-fresh-700">요리하기</span>
                    <ChevronRight size={18} className="-ml-1 shrink-0 text-fresh-700" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex gap-2 p-3.5 pt-3 sm:p-4 sm:pt-3">
        <button
          type="button"
          onClick={() => onEat(ingredient)}
          aria-label={`${ingredient.name} 먹었어요`}
          className="btn-soft min-h-[44px] flex-1 py-2 text-[16px]"
        >
          먹었어요
        </button>
        {expired && (
          <button
            type="button"
            onClick={() => onDiscard(ingredient)}
            aria-label={`${ingredient.name} 버렸어요`}
            className="inline-flex min-h-[44px] flex-1 items-center justify-center rounded-2xl border border-coral-100 bg-coral-50 text-[16px] font-semibold text-coral-700 hover:bg-coral-100"
          >
            버렸어요
          </button>
        )}
      </div>
    </li>
  );
}
