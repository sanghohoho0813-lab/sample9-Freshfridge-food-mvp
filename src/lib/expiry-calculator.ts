import type { Ingredient } from "./types";

/** 오늘 0시 기준 Date */
export function todayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(d: Date, days: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + days);
  return next;
}

/** 유통기한까지 남은 일수. null = 정보 없음, 음수 = 지남 */
export function daysLeft(expiresAt: string | null): number | null {
  if (!expiresAt) return null;
  const [y, m, d] = expiresAt.split("-").map(Number);
  const exp = new Date(y, m - 1, d);
  const diff = exp.getTime() - todayStart().getTime();
  return Math.round(diff / (1000 * 60 * 60 * 24));
}

/** 산 날부터 기한까지 중 얼마나 지났는지 — 상세 화면의 신선도 막대 */
export interface Freshness {
  /** 산 지 며칠째 (오늘 산 것 = 0) */
  elapsed: number;
  /** 기한까지 남은 날 (지났으면 음수) */
  remaining: number;
  /** 산 날부터 기한까지 전체 일수 (최소 1) */
  total: number;
  /** 0(산 날) ~ 1(기한 날·지남) */
  ratio: number;
}

export function freshness(purchasedAt: string, expiresAt: string | null): Freshness | null {
  const remaining = daysLeft(expiresAt);
  const sincePurchase = daysLeft(purchasedAt);
  if (remaining === null || sincePurchase === null) return null;
  const elapsed = Math.max(0, -sincePurchase);
  const total = Math.max(1, elapsed + remaining);
  return { elapsed, remaining, total, ratio: Math.min(1, Math.max(0, elapsed / total)) };
}

export type ExpiryLevel = "expired" | "urgent" | "soon" | "ok" | "unknown";

/**
 * 앱 전체가 쓰는 하나의 기한 단계 — 색은 급한 정도만 나타낸다.
 * expired: 지남 / urgent: 오늘·내일 / soon: 2~3일 / ok: 그 이후 / unknown: 기한 모름
 */
export function expiryLevel(expiresAt: string | null): ExpiryLevel {
  const d = daysLeft(expiresAt);
  if (d === null) return "unknown";
  if (d < 0) return "expired";
  if (d <= 1) return "urgent";
  if (d <= 3) return "soon";
  return "ok";
}

export function dDayLabel(expiresAt: string | null): string {
  const d = daysLeft(expiresAt);
  if (d === null) return "기한 모름";
  if (d < 0) return `D+${Math.abs(d)}`;
  if (d === 0) return "D-Day";
  return `D-${d}`;
}

export function friendlyExpiryText(expiresAt: string | null): string {
  const d = daysLeft(expiresAt);
  if (d === null) return "유통기한 정보가 없어요";
  if (d < 0) return `기한이 ${Math.abs(d)}일 지났어요`;
  if (d === 0) return "오늘까지예요";
  if (d === 1) return "내일까지예요";
  if (d <= 3) return `${d}일 남았어요`;
  if (d <= 7) return `이번 주 안에 드세요`;
  return "여유 있어요";
}

/** 우선소비 정렬용: 임박한 순, 기한 없는 것은 뒤로 */
export function sortByExpiry(list: Ingredient[]): Ingredient[] {
  return [...list].sort((a, b) => {
    const da = daysLeft(a.expiresAt);
    const db = daysLeft(b.expiresAt);
    if (da === null && db === null) return a.name.localeCompare(b.name, "ko");
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });
}

export type PriorityGroup = "veryUrgent" | "soon" | "thisWeek" | "later";

export function priorityGroup(expiresAt: string | null): PriorityGroup | null {
  const d = daysLeft(expiresAt);
  if (d === null) return null;
  if (d <= 1) return "veryUrgent";
  if (d <= 3) return "soon";
  if (d <= 7) return "thisWeek";
  return "later";
}

export const PRIORITY_GROUP_META: Record<PriorityGroup, { title: string; sub: string }> = {
  veryUrgent: { title: "오늘·내일", sub: "지금 바로 먹어주세요" },
  soon: { title: "2~3일 안", sub: "이번 끼니에 챙겨 드세요" },
  thisWeek: { title: "이번 주", sub: "일주일 안에 드시면 돼요" },
  later: { title: "여유 있어요", sub: "아직 시간이 충분해요" },
};

export function formatKoreanDate(iso: string, today: Date = todayStart()): string {
  const [y, m, d] = iso.split("-").map(Number);
  // 올해가 아니면 연도를 붙인다 — "10월 20일까지"가 1년 뒤인지 오늘인지 헷갈리지 않게
  return y === today.getFullYear() ? `${m}월 ${d}일` : `${y}년 ${m}월 ${d}일`;
}

/** 12500 → "12,500원" (문장 안에서 자연스럽게 읽히도록 ₩ 대신 "원") */
export function formatWon(n: number): string {
  return `${Math.round(n).toLocaleString("ko-KR")}원`;
}

/** 보관 기간 선택 칩 문구 — 7 → "일주일", 14 → "2주", 30 → "한 달", 180 → "6개월", 365 → "1년" */
export function shelfLabel(days: number): string {
  if (days === 7) return "일주일";
  if (days > 7 && days < 30 && days % 7 === 0) return `${days / 7}주`;
  if (days === 30) return "한 달";
  if (days === 60) return "두 달";
  if (days >= 365 && days % 365 === 0) return `${days / 365}년`;
  if (days > 60 && days % 30 === 0) return `${days / 30}개월`;
  return `${days}일`;
}

/** 목록을 나누는 기한 구간 — 냉장고·우선소비 화면이 같은 구간을 쓴다 */
export type ExpiryGroup = "expired" | "today" | "soon" | "week" | "later" | "unknown";

export const EXPIRY_GROUP_LABEL: Record<ExpiryGroup, string> = {
  expired: "기한 지남",
  today: "오늘·내일",
  soon: "2~3일 안",
  week: "이번 주 안",
  later: "여유 있어요",
  unknown: "기한 모름",
};

export const EXPIRY_GROUP_ORDER: ExpiryGroup[] = ["expired", "today", "soon", "week", "later", "unknown"];

export function expiryGroup(expiresAt: string | null): ExpiryGroup {
  const d = daysLeft(expiresAt);
  if (d === null) return "unknown";
  if (d < 0) return "expired";
  if (d <= 1) return "today";
  if (d <= 3) return "soon";
  if (d <= 7) return "week";
  return "later";
}
