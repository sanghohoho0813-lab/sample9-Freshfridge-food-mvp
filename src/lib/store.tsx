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
  AppNotification,
  AppState,
  ConsumptionLog,
  Ingredient,
  ShoppingItem,
  WasteReason,
} from "./types";
import { buildInitialState, newId } from "./demo-data";
import { toISODate, todayStart } from "./expiry-calculator";

const STORAGE_KEY = "freshfridge_state_v1";

interface ToastMsg {
  id: string;
  text: string;
  emoji?: string;
}

interface StoreValue {
  ready: boolean;
  state: AppState;
  toasts: ToastMsg[];
  showToast: (text: string, emoji?: string) => void;
  addIngredient: (
    ing: Omit<Ingredient, "id" | "status">
  ) => void;
  updateIngredient: (id: string, patch: Partial<Ingredient>) => void;
  changeQuantity: (id: string, delta: number) => void;
  consumeIngredient: (id: string, via?: string) => void;
  discardIngredient: (id: string, reason: WasteReason) => void;
  cookRecipe: (recipeName: string, deductions: { ingredientId: string; amount: number }[]) => void;
  addShoppingItem: (name: string, fromRecipe?: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as AppState;
      if (parsed && Array.isArray(parsed.ingredients) && parsed.ingredients.length > 0) {
        return parsed;
      }
    }
  } catch {
    // 손상된 저장 데이터는 무시하고 데모 데이터로 초기화
  }
  return buildInitialState();
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(() => buildInitialState());
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  const showToast = useCallback((text: string, emoji?: string) => {
    const id = newId("toast");
    setToasts((prev) => [...prev.slice(-2), { id, text, emoji }]);
    timers.current.push(
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 2600)
    );
  }, []);

  const addIngredient: StoreValue["addIngredient"] = useCallback((ing) => {
    setState((prev) => ({
      ...prev,
      ingredients: [
        { ...ing, id: newId("ing"), status: "available" },
        ...prev.ingredients,
      ],
    }));
  }, []);

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
        i.id === id ? { ...i, quantity: Math.max(0, Math.round((i.quantity + delta) * 100) / 100) } : i
      ),
    }));
  }, []);

  const pushLog = (
    prev: AppState,
    ing: Ingredient,
    type: ConsumptionLog["type"],
    reason?: WasteReason,
    via?: string
  ): ConsumptionLog[] => [
    {
      id: newId("log"),
      ingredientName: ing.name,
      emoji: ing.emoji,
      category: ing.category,
      type,
      date: toISODate(todayStart()),
      price: ing.price,
      reason,
      via,
    },
    ...prev.logs,
  ];

  const consumeIngredient: StoreValue["consumeIngredient"] = useCallback((id, via) => {
    setState((prev) => {
      const ing = prev.ingredients.find((i) => i.id === id);
      if (!ing) return prev;
      return {
        ...prev,
        ingredients: prev.ingredients.map((i) =>
          i.id === id ? { ...i, status: "consumed", quantity: 0 } : i
        ),
        logs: pushLog(prev, ing, "consumed", undefined, via),
      };
    });
  }, []);

  const discardIngredient: StoreValue["discardIngredient"] = useCallback((id, reason) => {
    setState((prev) => {
      const ing = prev.ingredients.find((i) => i.id === id);
      if (!ing) return prev;
      return {
        ...prev,
        ingredients: prev.ingredients.map((i) =>
          i.id === id ? { ...i, status: "discarded", quantity: 0 } : i
        ),
        logs: pushLog(prev, ing, "discarded", reason),
      };
    });
  }, []);

  const cookRecipe: StoreValue["cookRecipe"] = useCallback((recipeName, deductions) => {
    setState((prev) => {
      let logs = prev.logs;
      const ingredients = prev.ingredients.map((i) => {
        const d = deductions.find((x) => x.ingredientId === i.id);
        if (!d) return i;
        const nextQty = Math.max(0, Math.round((i.quantity - d.amount) * 100) / 100);
        const usedUp = nextQty === 0 && d.amount > 0;
        logs = [
          {
            id: newId("log"),
            ingredientName: i.name,
            emoji: i.emoji,
            category: i.category,
            type: "consumed" as const,
            date: toISODate(todayStart()),
            price: usedUp ? i.price : Math.round(i.price * Math.min(1, d.amount / Math.max(i.quantity, 1))),
            via: recipeName,
          },
          ...logs,
        ];
        return {
          ...i,
          quantity: nextQty,
          status: usedUp ? ("consumed" as const) : i.status,
        };
      });
      return { ...prev, ingredients, logs };
    });
  }, []);

  const addShoppingItem: StoreValue["addShoppingItem"] = useCallback((name, fromRecipe) => {
    setState((prev) => {
      if (prev.shopping.some((s) => s.name === name && !s.checked)) return prev;
      const item: ShoppingItem = { id: newId("shop"), name, checked: false, fromRecipe };
      return { ...prev, shopping: [item, ...prev.shopping] };
    });
  }, []);

  const toggleShoppingItem: StoreValue["toggleShoppingItem"] = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      shopping: prev.shopping.map((s) => (s.id === id ? { ...s, checked: !s.checked } : s)),
    }));
  }, []);

  const removeShoppingItem: StoreValue["removeShoppingItem"] = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      shopping: prev.shopping.filter((s) => s.id !== id),
    }));
  }, []);

  const markNotificationRead: StoreValue["markNotificationRead"] = useCallback((id) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }));
  }, []);

  const markAllNotificationsRead: StoreValue["markAllNotificationsRead"] = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, read: true })),
    }));
  }, []);

  const resetDemo = useCallback(() => {
    const fresh = buildInitialState();
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
      addIngredient,
      updateIngredient,
      changeQuantity,
      consumeIngredient,
      discardIngredient,
      cookRecipe,
      addShoppingItem,
      toggleShoppingItem,
      removeShoppingItem,
      markNotificationRead,
      markAllNotificationsRead,
      resetDemo,
    }),
    [
      ready,
      state,
      toasts,
      showToast,
      addIngredient,
      updateIngredient,
      changeQuantity,
      consumeIngredient,
      discardIngredient,
      cookRecipe,
      addShoppingItem,
      toggleShoppingItem,
      removeShoppingItem,
      markNotificationRead,
      markAllNotificationsRead,
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
    () => state.ingredients.filter((i) => i.status !== "consumed" && i.status !== "discarded" && i.quantity > 0),
    [state.ingredients]
  );
}

export type { ToastMsg };
export type { AppNotification };
