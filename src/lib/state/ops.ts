/**
 * 앱 상태를 바꾸는 순수 함수 모음.
 *
 * - React·localStorage 에 의존하지 않아 단위 테스트로 바로 검증할 수 있다(ops.test.ts).
 * - 바뀐 것이 없으면 같은 참조(prev)를 돌려준다. 스토어는 이것으로 "되돌리기 대상인지"를 판단한다.
 * - 날짜·id 는 Env 로 주입한다. 기본값은 실제 오늘 날짜와 무작위 id.
 */
import type { AppState, ConsumptionLog, CookLog, Ingredient, ShoppingItem, WasteReason } from "../types";
import { isRescue, newId as defaultNewId } from "../demo-data";
import { daysLeft, toISODate, todayStart } from "../expiry-calculator";

export interface Env {
  /** 기록에 남길 오늘 날짜 (YYYY-MM-DD) */
  today: string;
  newId: (prefix: string) => string;
}

export const defaultEnv = (): Env => ({ today: toISODate(todayStart()), newId: defaultNewId });

export type NewIngredient = Omit<Ingredient, "id" | "status">;

export interface Deduction {
  ingredientId: string;
  amount: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/** 냉장고에 남아 있는(먹거나 버리지 않은) 재료인가 */
export function isInFridge(i: Ingredient): boolean {
  return i.status !== "consumed" && i.status !== "discarded" && i.quantity > 0;
}

/** 요청량을 0 ≤ amount ≤ 보유량 범위로 맞춘다. 지정이 없으면 전량. */
export function clampAmount(amount: number | undefined, quantity: number): number {
  if (amount === undefined || !Number.isFinite(amount)) return quantity;
  return round2(Math.min(Math.max(amount, 0), quantity));
}

/** 재료 하나에서 amount 만큼 빼고, 남은 양과 남은 금액을 비례로 갱신한다. */
export function takeFrom(
  ing: Ingredient,
  amount: number,
  endStatus: "consumed" | "discarded"
): { next: Ingredient; used: number; price: number } {
  const used = clampAmount(amount, ing.quantity);
  const price = ing.quantity > 0 ? Math.round((ing.price * used) / ing.quantity) : 0;
  const quantity = round2(ing.quantity - used);
  return {
    used,
    price,
    next: {
      ...ing,
      quantity,
      price: Math.max(0, ing.price - price),
      status: quantity <= 0 ? endStatus : ing.status,
    },
  };
}

function makeLog(
  env: Env,
  ing: Ingredient,
  type: ConsumptionLog["type"],
  amount: number,
  price: number,
  extra: Partial<ConsumptionLog> = {}
): ConsumptionLog {
  return {
    id: env.newId("log"),
    ingredientName: ing.name,
    emoji: ing.emoji,
    category: ing.category,
    type,
    date: env.today,
    price,
    amount,
    unit: ing.unit,
    dLeft: daysLeft(ing.expiresAt),
    ...extra,
  };
}

export function addIngredient(
  prev: AppState,
  ing: NewIngredient,
  opts: { fromShoppingId?: string; id?: string } = {},
  env: Env = defaultEnv()
): AppState {
  return {
    ...prev,
    ingredients: [{ ...ing, id: opts.id ?? env.newId("ing"), status: "available" }, ...prev.ingredients],
    shopping: opts.fromShoppingId
      ? prev.shopping.map((s) => (s.id === opts.fromShoppingId ? { ...s, checked: true, addedToFridge: true } : s))
      : prev.shopping,
  };
}

/** 재고 정보 수정 — 기록을 남기지 않는다 (실제 소비는 consume 으로) */
export function updateIngredient(prev: AppState, id: string, patch: Partial<Omit<Ingredient, "id">>): AppState {
  if (!prev.ingredients.some((i) => i.id === id)) return prev;
  return { ...prev, ingredients: prev.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)) };
}

function take(
  prev: AppState,
  id: string,
  type: "consumed" | "discarded",
  amount: number | undefined,
  extra: Partial<ConsumptionLog>,
  env: Env
): AppState {
  const ing = prev.ingredients.find((i) => i.id === id);
  if (!ing || !isInFridge(ing)) return prev;
  const { next, used, price } = takeFrom(ing, amount ?? ing.quantity, type);
  if (used <= 0) return prev;
  return {
    ...prev,
    ingredients: prev.ingredients.map((i) => (i.id === id ? next : i)),
    logs: [makeLog(env, ing, type, used, price, extra), ...prev.logs],
  };
}

export function consumeIngredient(prev: AppState, id: string, amount?: number, env: Env = defaultEnv()): AppState {
  return take(prev, id, "consumed", amount, {}, env);
}

export function discardIngredient(
  prev: AppState,
  id: string,
  reason: WasteReason,
  amount?: number,
  env: Env = defaultEnv()
): AppState {
  return take(prev, id, "discarded", amount, { reason }, env);
}

/** 요리했어요 — 레시피 분량만큼 차감하고, 요리 1건과 묶인 소비 기록을 남긴다 */
export function cookRecipe(
  prev: AppState,
  recipe: { id: string; name: string },
  deductions: Deduction[],
  env: Env = defaultEnv()
): AppState {
  const cookId = env.newId("cook");
  const newLogs: ConsumptionLog[] = [];
  let savedAmount = 0;
  let rescuedCount = 0;

  const ingredients = prev.ingredients.map((i) => {
    const d = deductions.find((x) => x.ingredientId === i.id);
    if (!d || !isInFridge(i) || d.amount <= 0) return i;
    const { next, used, price } = takeFrom(i, d.amount, "consumed");
    newLogs.push(makeLog(env, i, "consumed", used, price, { via: recipe.name, cookId }));
    savedAmount += price;
    if (isRescue(daysLeft(i.expiresAt))) rescuedCount += 1;
    return next;
  });
  if (newLogs.length === 0) return prev;

  const cook: CookLog = {
    id: cookId,
    recipeId: recipe.id,
    recipeName: recipe.name,
    date: env.today,
    usedCount: newLogs.length,
    savedAmount,
    rescuedCount,
  };
  return { ...prev, ingredients, logs: [...newLogs, ...prev.logs], cooks: [cook, ...prev.cooks] };
}

/** 장보기 담기 — 아직 사지 않은 같은 이름이 있으면 건너뛴다 */
export function addShoppingItems(
  prev: AppState,
  names: string[],
  fromRecipe?: string,
  env: Env = defaultEnv()
): AppState {
  const pending = new Set(prev.shopping.filter((s) => !s.checked).map((s) => s.name));
  const fresh: ShoppingItem[] = [];
  for (const raw of names) {
    const name = raw.trim();
    if (!name || pending.has(name)) continue;
    pending.add(name);
    fresh.push({ id: env.newId("shop"), name, checked: false, fromRecipe });
  }
  return fresh.length === 0 ? prev : { ...prev, shopping: [...fresh, ...prev.shopping] };
}

export function toggleShoppingItem(prev: AppState, id: string): AppState {
  if (!prev.shopping.some((s) => s.id === id)) return prev;
  return {
    ...prev,
    shopping: prev.shopping.map((s) =>
      s.id === id ? { ...s, checked: !s.checked, addedToFridge: s.checked ? false : s.addedToFridge } : s
    ),
  };
}

export function removeShoppingItem(prev: AppState, id: string): AppState {
  const shopping = prev.shopping.filter((s) => s.id !== id);
  return shopping.length === prev.shopping.length ? prev : { ...prev, shopping };
}

export function clearPurchasedShopping(prev: AppState): AppState {
  const shopping = prev.shopping.filter((s) => !s.checked);
  return shopping.length === prev.shopping.length ? prev : { ...prev, shopping };
}

export function markNotificationsRead(prev: AppState, ids: string[]): AppState {
  const read = new Set(prev.readNotificationIds);
  const before = read.size;
  ids.forEach((id) => read.add(id));
  return read.size === before ? prev : { ...prev, readNotificationIds: [...read] };
}
