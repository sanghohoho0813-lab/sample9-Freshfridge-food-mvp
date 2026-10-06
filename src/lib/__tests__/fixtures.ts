import type { AppState, Ingredient } from "../types";
import type { Env } from "../state/ops";

/** 테스트 기준일: 2026-10-06 (화) */
export const TODAY = "2026-10-06";

export function fixedEnv(): Env {
  let n = 0;
  return { today: TODAY, newId: (p) => `${p}_${++n}` };
}

/** TODAY 기준 n일 뒤 날짜 */
export function inDays(n: number): string {
  const d = new Date(2026, 9, 6 + n);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export function ing(over: Partial<Ingredient> & { name: string }): Ingredient {
  return {
    id: `ing_${over.name}`,
    emoji: "🧺",
    quantity: 1,
    unit: "개",
    category: "vegetable",
    storage: "fridge",
    purchasedAt: inDays(-2),
    expiresAt: inDays(5),
    price: 1000,
    status: "available",
    ...over,
  };
}

export function stateWith(ingredients: Ingredient[], over: Partial<AppState> = {}): AppState {
  return {
    userName: "테스트",
    ingredients,
    logs: [],
    shopping: [],
    cooks: [],
    readNotificationIds: [],
    seededAt: TODAY,
    ...over,
  };
}
