/**
 * localStorage 저장·복원.
 * 저장된 값은 사용자가 고칠 수도, 이전 버전일 수도 있으므로 그대로 믿지 않고 형태를 검사한다.
 */
import type { AppState, Ingredient } from "../types";
import { buildInitialState } from "../demo-data";

// v2: 기록에 수량·요리 묶음이 추가되어 데모 데이터를 새로 시드한다.
export const STORAGE_KEY = "freshfridge_state_v2";

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

function isIngredient(v: unknown): v is Ingredient {
  return (
    isObj(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    typeof v.quantity === "number" &&
    Number.isFinite(v.quantity) &&
    typeof v.unit === "string"
  );
}

function arrayOf<T>(v: unknown, ok: (x: unknown) => boolean): T[] | null {
  return Array.isArray(v) ? (v.filter(ok) as T[]) : null;
}

const hasId = (x: unknown) => isObj(x) && typeof x.id === "string";

/** 저장 문자열 → 상태. 쓸 수 없는 값이면 null (호출 쪽에서 데모 데이터로 시작) */
export function parseState(raw: string | null): AppState | null {
  if (!raw) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isObj(data)) return null;
  const ingredients = arrayOf<Ingredient>(data.ingredients, isIngredient);
  if (!ingredients || ingredients.length === 0) return null;

  const base = buildInitialState();
  return {
    userName: typeof data.userName === "string" ? data.userName : base.userName,
    ingredients,
    logs: arrayOf(data.logs, hasId) ?? base.logs,
    shopping: arrayOf(data.shopping, hasId) ?? base.shopping,
    cooks: arrayOf(data.cooks, hasId) ?? [],
    readNotificationIds: arrayOf<string>(data.readNotificationIds, (x) => typeof x === "string") ?? [],
    seededAt: typeof data.seededAt === "string" ? data.seededAt : base.seededAt,
  };
}

export function loadState(): AppState {
  try {
    return parseState(localStorage.getItem(STORAGE_KEY)) ?? buildInitialState();
  } catch {
    // 저장소 접근 자체가 막힌 환경(사생활 보호 모드 등)
    return buildInitialState();
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 저장 실패는 치명적이지 않다 — 이번 세션 동안은 메모리 상태로 동작
  }
}
