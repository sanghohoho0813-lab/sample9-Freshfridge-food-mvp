"use client";

import { useMemo } from "react";
import type { AppNotification, AppState, Ingredient } from "./types";
import { STORAGE_LABELS } from "./types";
import { RECIPES } from "./demo-data";
import { recommendRecipes } from "./recommendation-engine";
import { addDays, daysLeft, sortByExpiry, toISODate, todayStart } from "./expiry-calculator";
import { formatAmount } from "./quantity";
import { weeklySummary } from "./stats";
import { josa } from "./text";
import { useFridge, useStore } from "./store";

type DerivedNotification = Omit<AppNotification, "read">;

/**
 * 알림은 저장하지 않고 현재 상태에서 계산한다.
 * 그래서 우유를 먹으면 "우유 기한 임박" 알림이 바로 사라진다.
 * 읽음 여부만 id 기준으로 state.readNotificationIds 에 남긴다.
 */
export function deriveNotifications(state: AppState, fridge: Ingredient[]): DerivedNotification[] {
  const today = todayStart();
  const todayISO = toISODate(today);
  const out: DerivedNotification[] = [];

  // 1) 오늘·내일까지인 재료 (기한이 막 지난 재료 포함)
  for (const ing of sortByExpiry(fridge)) {
    const d = daysLeft(ing.expiresAt);
    if (d === null || d > 1 || d < -3) continue;
    const title =
      d < 0
        ? `${ing.name}, 기한이 ${-d}일 지났어요`
        : d === 0
          ? `${ing.name}의 유통기한이 오늘까지예요`
          : `${ing.name}의 유통기한이 내일이에요`;
    const body =
      d < 0
        ? "상태를 확인하고 먹었는지 버렸는지 기록해주세요."
        : `${STORAGE_LABELS[ing.storage]}에 ${formatAmount(ing.quantity, ing.unit)} 남았어요.`;
    out.push({
      id: `exp-${ing.id}-${ing.expiresAt}`,
      kind: "expiry",
      title,
      body,
      date: todayISO,
      href: `/ingredient/${ing.id}`,
    });
  }

  // 2) 임박 재료를 쓰는 오늘의 요리
  const top = recommendRecipes(RECIPES, fridge, 1)[0];
  if (top && top.urgentOwned.length > 0) {
    const names = top.urgentOwned.slice(0, 2).map((m) => m.name);
    const namesText =
      names.length > 1 ? `${josa(names[0], "과/와")} ${josa(names[1], "을/를")}` : josa(names[0], "을/를");
    out.push({
      id: `rec-${top.recipe.id}-${todayISO}`,
      kind: "recipe",
      title: `오늘의 요리: ${top.recipe.name}`,
      body: `${namesText} 한 번에 쓸 수 있어요.`,
      date: todayISO,
      href: `/recipes/${top.recipe.id}`,
    });
  }

  // 3) 냉동실에서 오래된 재료
  const oldFrozen = fridge
    .filter((i) => i.storage === "freezer")
    .map((i) => ({ i, days: -(daysLeft(i.purchasedAt) ?? 0) }))
    .filter((x) => x.days >= 10)
    .sort((a, b) => b.days - a.days)
    .slice(0, 2);
  for (const { i, days } of oldFrozen) {
    out.push({
      id: `frz-${i.id}`,
      kind: "freezer",
      title: `냉동 ${i.name} 보관 ${days}일째`,
      body: "잊히기 전에 한 번 꺼내 써보세요.",
      date: todayISO,
      href: `/ingredient/${i.id}`,
    });
  }

  // 4) 장보기 목록
  const pending = state.shopping.filter((s) => !s.checked);
  if (pending.length > 0) {
    out.push({
      id: `shop-${todayISO}-${pending.length}`,
      kind: "shopping",
      title: `장보기 목록에 ${pending.length}개가 남아 있어요`,
      body:
        pending
          .slice(0, 3)
          .map((s) => s.name)
          .join(", ") + (pending.length > 3 ? " 외" : ""),
      date: todayISO,
      href: "/shopping",
    });
  }

  // 5) 이번 주 성과
  const week = weeklySummary(state.logs, state.cooks);
  if (week.usedCount > 0) {
    const weekKey = toISODate(addDays(today, -today.getDay()));
    out.push({
      id: `rep-${weekKey}`,
      kind: "report",
      title: `이번 주 식재료 ${week.usedCount}개를 버리지 않고 사용했어요`,
      body:
        week.rescuedCount > 0
          ? `기한이 임박했던 재료 ${week.rescuedCount}개를 살렸어요.`
          : "리포트에서 이번 주 기록을 볼 수 있어요.",
      date: todayISO,
      href: "/report",
    });
  }

  return out;
}

export function useNotifications(): AppNotification[] {
  const { state } = useStore();
  const fridge = useFridge();
  return useMemo(() => {
    const read = new Set(state.readNotificationIds);
    return deriveNotifications(state, fridge).map((n) => ({ ...n, read: read.has(n.id) }));
  }, [state, fridge]);
}
