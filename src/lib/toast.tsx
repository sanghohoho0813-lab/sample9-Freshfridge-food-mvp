"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { newId } from "./demo-data";

export interface ToastAction {
  label: string;
  onClick: () => void;
}

export interface ToastMsg {
  id: string;
  text: string;
  emoji?: string;
  action?: ToastAction;
}

/** 되돌리기처럼 누를 것이 있는 토스트는 조금 더 오래 보여준다 */
const DURATION = { plain: 2600, withAction: 5000 };
const MAX_VISIBLE = 3;

interface ToastApi {
  showToast: (text: string, emoji?: string, action?: ToastAction) => void;
  dismissToast: (id: string) => void;
}

// 목록과 API 를 다른 컨텍스트로 나눠, 토스트가 뜰 때 화면 전체가 다시 그려지지 않게 한다.
const ToastListContext = createContext<ToastMsg[]>([]);
const ToastApiContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  const dismissToast = useCallback((id: string) => {
    const t = timers.current.get(id);
    if (t) clearTimeout(t);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback(
    (text: string, emoji?: string, action?: ToastAction) => {
      const id = newId("toast");
      setToasts((prev) => [...prev.slice(-(MAX_VISIBLE - 1)), { id, text, emoji, action }]);
      timers.current.set(
        id,
        setTimeout(() => dismissToast(id), action ? DURATION.withAction : DURATION.plain)
      );
    },
    [dismissToast]
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach(clearTimeout);
  }, []);

  const api = useMemo(() => ({ showToast, dismissToast }), [showToast, dismissToast]);

  return (
    <ToastApiContext.Provider value={api}>
      <ToastListContext.Provider value={toasts}>{children}</ToastListContext.Provider>
    </ToastApiContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastApiContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function useToastList(): ToastMsg[] {
  return useContext(ToastListContext);
}
