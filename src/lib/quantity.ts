/** 수량 입력·표시 규칙 — 먹었어요/버렸어요/요리 결과에서 공통으로 쓴다. */

/** 단위별 한 번에 늘리고 줄이는 양 */
export function amountStep(unit: string): number {
  if (unit === "g" || unit === "ml") return 50;
  if (unit === "kg" || unit === "L") return 0.5;
  return 1;
}

/** 시트를 열었을 때의 기본 선택량 — 한 번에 먹는 양에 가깝게 */
export function defaultAmount(quantity: number, unit: string): number {
  const step = amountStep(unit);
  if (unit === "g" || unit === "ml") return Math.min(quantity, Math.max(step, Math.round(quantity / 2 / step) * step));
  return Math.min(quantity, step);
}

/** 0.5 → "0.5", 1 → "1", 0.25 → "0.25" */
export function formatAmount(n: number, unit = ""): string {
  const v = Math.round(n * 100) / 100;
  return `${Number.isInteger(v) ? v : v.toString()}${unit}`;
}
