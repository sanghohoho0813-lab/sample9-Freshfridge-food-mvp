import type { ExpiryGroup } from "@/lib/expiry-calculator";

/**
 * 기한 구간의 상태 점 색 — 냉장고·우선소비·구간 이동 칩이 같은 색을 쓴다.
 * 빨강(지남·오늘내일) · 주황(2~3일) · 초록(여유) · 무채색(이번 주·모름). 늘 글자와 함께 쓴다.
 */
export const GROUP_DOT: Record<ExpiryGroup, string> = {
  expired: "bg-coral-700",
  today: "bg-coral-500",
  soon: "bg-amberish-500",
  week: "bg-ink-300",
  later: "bg-fresh-500",
  unknown: "bg-ink-300/60",
};
