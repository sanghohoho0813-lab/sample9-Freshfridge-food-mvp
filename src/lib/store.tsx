"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AppState,
  ConsumptionLog,
  CookLog,
  Ingredient,
  ShoppingItem,
  WasteReason,
} from "./types";
import { buildInitialState, isRescue, newId } from "./demo-data";
import { daysLeft, toISODate, todayStart } from "./expiry-calculator";

// v2: 기록에 수량·요리 묶음이 추가되어 데모 데이터를 새로 시드한다.
const STORAGE_KEY = "freshfridge_state_v2";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

interface ToastMsg {
  id: string;
  text: string;
  emoji?: string;
  action?: ToastAction;
}

export interface Deduction {
  ingredientId: string;
  amount: number;
}

/** 상태를 바꾸는 행동은 되돌리기용 토큰을 돌려준다. */
type UndoToken = string;

interface StoreValue {
  ready: boolean;
  state: AppState;
  toasts: ToastMsg[];
  showToast: (text: string, emoji?: string, action?: ToastAction) => void;
  dismissToast: (id: string) => void;
  undo: (token: UndoToken) => void;
  addIngredient: (
    ing: Omit<Ingredient, "id" | "status">,
    opts?: { fromShoppingId?: string }
  ) => UndoToken;
  updateIngredient: (id: string, patch: Partial<Ingredient>) => void;
  /** 재고 수정(기록 없음) — 실제로 먹었다면 consumeIngredient 를 쓴다 */
  changeQuantity: (id: string, delta: number) => void;
  consumeIngredient: (id: string, amount?: number) => UndoToken;
  discardIngredient: (id: string, reason: WasteReason, amount?: number) => UndoToken;
  cookRecipe: (recipe: { id: string; name: string }, deductions: Deduction[]) => UndoToken;
  addShoppingItem: (name: string, fromRecipe?: string) => void;
  addShoppingItems: (names: string[], fromRecipe?: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  clearPurchasedShopping: () => void;
  markNotificationsRead: (ids: string[]) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const round2 = (n: number) => Math.round(n * 100) / 100;

/** 요청량을 0 < amount <= 보유량 범위로 맞춘다. 지정이 없으면 전량. */
function clampAmount(amount: number | undefined, quantity: number): number {
  if (amount === undefined || !Number.isFinite(amount)) return quantity;
  return round2(Math.min(Math.max(amount, 0), quantity));
}

/** 이전 버전 저장 데이터나 일부 필드가 빠진 데이터를 안전하게 보정한다. */
function normalize(raw: Partial<AppState>): AppState {
  const base = buildInitialState();
  return {
    userName: raw.userName ?? base.userName,
    ingredients: Array.isArray(raw.ingredients) ? raw.ingredients : base.ingredients,
    logs: Array.isArray(raw.logs) ? raw.logs : base.logs,
    shopping: Array.isArray(raw.shopping) ? raw.shopping : base.shopping,
    cooks: Array.isArray(raw.cooks) ? raw.cooks : [],
    readNotificationIds: Array.isArray(raw.readNotificationIds) ? raw.readNotificationIds : [],
    seededAt: raw.seededAt ?? base.seededAt,
  };
}

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (parsed && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
        return normalize(parsed);
      }
    }
  } catch {
    // 손상된 저장 데이터는 무시하고 데모 데이터로 초기화
  }
  return buildInitialState();
}

function makeLog(
  ing: Ingredient,
  type: ConsumptionLog["type"],
  amount: number,
  price: number,
  extra: Partial<ConsumptionLog> = {}
): ConsumptionLog {
  return {
    id: newId("log"),
    ingredientName: ing.name,
    emoji: ing.emoji,
    category: ing.category,
    type,
    date: toISODate(todayStart()),
    price,
    amount,
    unit: ing.unit,
    dLeft: daysLeft(ing.expiresAt),
    ...extra,
  };
}

/** 재료 하나에서 amount 만큼 빼고, 남은 양과 남은 금액을 비례로 갱신한다. */
function takeFrom(
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(() => buildInitialState());
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const undoRef = useRef<{ token: UndoToken; snapshot: AppState } | null>(null);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // 저장 실패는 치명적이지 않음 (사생활 보호 모드 등)
    }
  }, [state, ready]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach(clearTimeout);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (text: string, emoji?: string, action?: ToastAction) => {
      const id = newId("toast");
      setToasts((prev) => [...prev.slice(-2), { id, text, emoji, action }]);
      timers.current.push(setTimeout(() => dismissToast(id), action ? 5000 : 2600));
    },
    [dismissToast]
  );

  /** 상태 변경 + 직전 상태를 되돌리기용으로 보관 */
  const commit = useCallback((update: (prev: AppState) => AppState): UndoToken => {
    const token = newId("undo");
    setState((prev) => {
      const next = update(prev);
      if (next !== prev) undoRef.current = { token, snapshot: prev };
      return next;
    });
    return token;
  }, []);

  const undo = useCallback((token: UndoToken) => {
    const saved = undoRef.current;
    if (!saved || saved.token !== token) return;
    undoRef.current = null;
    setState(saved.snapshot);
  }, []);

  const addIngredient: StoreValue["addIngredient"] = useCallback(
    (ing, opts) =>
      commit((prev) => ({
        ...prev,
        ingredients: [{ ...ing, id: newId("ing"), status: "available" }, ...prev.ingredients],
        shopping: opts?.fromShoppingId
          ? prev.shopping.map((s) =>
              s.id === opts.fromShoppingId ? { ...s, checked: true, addedToFridge: true } : s
            )
          : prev.shopping,
      })),
    [commit]
  );

  const updateIngredient: StoreValue["updateIngredient"] = useCallback((id, patch) => {
    setState((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));
  }, []);

  const changeQuantity: StoreValue["changeQuantity"] = useCallback((id, delta) => {
    setState((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(0, round2(i.quantity + delta)) } : i
      ),
    }));
  }, []);

  const consumeIngredient: StoreValue["consumeIngredient"] = useCallback(
    (id, amount) =>
      commit((prev) => {
        const ing = prev.ingredients.find((i) => i.id === id);
        if (!ing || ing.quantity <= 0) return prev;
        const { next, used, price } = takeFrom(ing, amount ?? ing.quantity, "consumed");
        return {
          ...prev,
          ingredients: prev.ingredients.map((i) => (i.id === id ? next : i)),
          logs: [makeLog(ing, "consumed", used, price), ...prev.logs],
        };
      }),
    [commit]
  );

  const discardIngredient: StoreValue["discardIngredient"] = useCallback(
    (id, reason, amount) =>
      commit((prev) => {
        const ing = prev.ingredients.find((i) => i.id === id);
        if (!ing || ing.quantity <= 0) return prev;
        const { next, used, price } = takeFrom(ing, amount ?? ing.quantity, "discarded");
        return {
          ...prev,
          ingredients: prev.ingredients.map((i) => (i.id === id ? next : i)),
          logs: [makeLog(ing, "discarded", used, price, { reason }), ...prev.logs],
        };
      }),
    [commit]
  );

  const cookRecipe: StoreValue["cookRecipe"] = useCallback(
    (recipe, deductions) =>
      commit((prev) => {
        const cookId = newId("cook");
        const newLogs: ConsumptionLog[] = [];
        let savedAmount = 0;
        let rescuedCount = 0;

        const ingredients = prev.ingredients.map((i) => {
          const d = deductions.find((x) => x.ingredientId === i.id);
          if (!d || i.quantity <= 0 || d.amount <= 0) return i;
          const { next, used, price } = takeFrom(i, d.amount, "consumed");
          newLogs.push(makeLog(i, "consumed", used, price, { via: recipe.name, cookId }));
          savedAmount += price;
          if (isRescue(daysLeft(i.expiresAt))) rescuedCount += 1;
          return next;
        });

        const cook: CookLog = {
          id: cookId,
          recipeId: recipe.id,
          recipeName: recipe.name,
          date: toISODate(todayStart()),
          usedCount: newLogs.length,
          savedAmount,
          rescuedCount,
        };
        return {
          ...prev,
          ingredients,
          logs: [...newLogs, ...prev.logs],
          cooks: [cook, ...prev.cooks],
        };
      }),
    [commit]
  );

  const addShoppingItems: StoreValue["addShoppingItems"] = useCallback((names, fromRecipe) => {
    setState((prev) => {
      const pending = new Set(prev.shopping.filter((s) => !s.checked).map((s) => s.name));
      const fresh: ShoppingItem[] = [];
      for (const name of names) {
        if (pending.has(name)) continue;
        pending.add(name);
        fresh.push({ id: newId("shop"), name, checked: false, fromRecipe });
      }
      return fresh.length === 0 ? prev : { ...prev, shopping: [...fresh, ...prev.shopping] };
    });
  }, []);

  const addShoppingItem: StoreValue["addShoppingItem"] = useCallback(
    (name, fromRecipe) => addShoppingItems([name], fromRecipe),
    [addShoppingItems]
  );

  const toggleShoppingItem: StoreValue["toggleShoppingItem"] = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      shopping: prev.shopping.map((s) =>
        s.id === id ? { ...s, checked: !s.checked, addedToFridge: s.checked ? false : s.addedToFridge } : s
      ),
    }));
  }, []);

  const removeShoppingItem: StoreValue["removeShoppingItem"] = useCallback((id) => {
    setState((prev) => ({ ...prev, shopping: prev.shopping.filter((s) => s.id !== id) }));
  }, []);

  const clearPurchasedShopping = useCallback(() => {
    setState((prev) => ({ ...prev, shopping: prev.shopping.filter((s) => !s.checked) }));
  }, []);

  const markNotificationsRead: StoreValue["markNotificationsRead"] = useCallback((ids) => {
    setState((prev) => {
      const read = new Set(prev.readNotificationIds);
      const before = read.size;
      ids.forEach((id) => read.add(id));
      return read.size === before ? prev : { ...prev, readNotificationIds: [...read] };
    });
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = buildInitialState();
    undoRef.current = null;
    setState(fresh);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      state,
      toasts,
      showToast,
      dismissToast,
      undo,
      addIngredient,
      updateIngredient,
      changeQuantity,
      consumeIngredient,
      discardIngredient,
      cookRecipe,
      addShoppingItem,
      addShoppingItems,
      toggleShoppingItem,
      removeShoppingItem,
      clearPurchasedShopping,
      markNotificationsRead,
      resetDemo,
    }),
    [
      ready,
      state,
      toasts,
      showToast,
      dismissToast,
      undo,
      addIngredient,
      updateIngredient,
      changeQuantity,
      consumeIngredient,
      discardIngredient,
      cookRecipe,
      addShoppingItem,
      addShoppingItems,
      toggleShoppingItem,
      removeShoppingItem,
      clearPurchasedShopping,
      markNotificationsRead,
      resetDemo,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

/** 현재 냉장고에 있는(사용 가능한) 식재료 */
export function useFridge(): Ingredient[] {
  const { state } = useStore();
  return useMemo(
    () =>
      state.ingredients.filter(
        (i) => i.status !== "consumed" && i.status !== "discarded" && i.quantity > 0
      ),
    [state.ingredients]
  );
}

/** 행동 직후 "되돌리기" 토스트를 띄우는 헬퍼 */
export function useUndoToast() {
  const { showToast, undo } = useStore();
  return useCallback(
    (text: string, emoji: string, token: UndoToken) =>
      showToast(text, emoji, { label: "되돌리기", onClick: () => undo(token) }),
    [showToast, undo]
  );
}

export type { ToastMsg };
