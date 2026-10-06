"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AppState, Ingredient, WasteReason } from "./types";
import { buildInitialState } from "./demo-data";
import * as ops from "./state/ops";
import { loadState, saveState, parseState, STORAGE_KEY } from "./state/persist";
import { useToast, type ToastAction } from "./toast";

export type { Deduction } from "./state/ops";
export type { ToastAction, ToastMsg } from "./toast";

/** 상태를 바꾸는 행동은 되돌리기용 토큰을 돌려준다. */
type UndoToken = string;

interface StoreValue {
  /** localStorage 에서 불러오기를 마쳤는가 (그 전에는 스켈레톤을 그린다) */
  ready: boolean;
  state: AppState;
  showToast: (text: string, emoji?: string, action?: ToastAction) => void;
  undo: (token: UndoToken) => void;
  addIngredient: (ing: ops.NewIngredient, opts?: { fromShoppingId?: string; id?: string }) => UndoToken;
  updateIngredient: (id: string, patch: Partial<Omit<Ingredient, "id">>) => void;
  consumeIngredient: (id: string, amount?: number) => UndoToken;
  discardIngredient: (id: string, reason: WasteReason, amount?: number) => UndoToken;
  cookRecipe: (recipe: { id: string; name: string }, deductions: ops.Deduction[]) => UndoToken;
  addShoppingItem: (name: string, fromRecipe?: string) => void;
  addShoppingItems: (names: string[], fromRecipe?: string) => void;
  toggleShoppingItem: (id: string) => void;
  removeShoppingItem: (id: string) => UndoToken;
  clearPurchasedShopping: () => UndoToken;
  markNotificationsRead: (ids: string[]) => void;
  resetDemo: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

let tokenSeq = 0;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<AppState>(() => buildInitialState());
  // 되돌리기는 가장 최근 행동 하나만 — 토큰이 다르면(그 뒤에 다른 행동을 했으면) 무시한다
  const undoRef = useRef<{ token: UndoToken; snapshot: AppState } | null>(null);
  // 다른 탭에서 받은 상태를 다시 저장해 되돌려 보내지 않기 위한 표시
  const fromOtherTab = useRef(false);

  useEffect(() => {
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (fromOtherTab.current) {
      fromOtherTab.current = false;
      return;
    }
    saveState(state);
  }, [state, ready]);

  // 같은 브라우저의 다른 탭에서 바꾼 내용을 이 탭에도 반영한다 (서로 덮어쓰지 않게)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = parseState(e.newValue);
      if (!next) return;
      fromOtherTab.current = true;
      undoRef.current = null;
      setState(next);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  /** 상태 변경 + 직전 상태를 되돌리기용으로 보관 */
  const commit = useCallback((update: (prev: AppState) => AppState): UndoToken => {
    const token = `undo_${++tokenSeq}`;
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

  const resetDemo = useCallback(() => {
    undoRef.current = null;
    setState(buildInitialState());
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      ready,
      state,
      showToast,
      undo,
      resetDemo,
      addIngredient: (ing, opts) => commit((s) => ops.addIngredient(s, ing, opts)),
      updateIngredient: (id, patch) => setState((s) => ops.updateIngredient(s, id, patch)),
      consumeIngredient: (id, amount) => commit((s) => ops.consumeIngredient(s, id, amount)),
      discardIngredient: (id, reason, amount) => commit((s) => ops.discardIngredient(s, id, reason, amount)),
      cookRecipe: (recipe, deductions) => commit((s) => ops.cookRecipe(s, recipe, deductions)),
      addShoppingItem: (name, fromRecipe) => setState((s) => ops.addShoppingItems(s, [name], fromRecipe)),
      addShoppingItems: (names, fromRecipe) => setState((s) => ops.addShoppingItems(s, names, fromRecipe)),
      toggleShoppingItem: (id) => setState((s) => ops.toggleShoppingItem(s, id)),
      removeShoppingItem: (id) => commit((s) => ops.removeShoppingItem(s, id)),
      clearPurchasedShopping: () => commit((s) => ops.clearPurchasedShopping(s)),
      markNotificationsRead: (ids) => setState((s) => ops.markNotificationsRead(s, ids)),
    }),
    [ready, state, showToast, undo, resetDemo, commit]
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
  return useMemo(() => state.ingredients.filter(ops.isInFridge), [state.ingredients]);
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
