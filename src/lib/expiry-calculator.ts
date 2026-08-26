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

export type ExpiryLevel = "expired" | "urgent" | "soon" | "ok" | "unknown";

export function expiryLevel(expiresAt: string | null): ExpiryLevel {
  const d = daysLeft(expiresAt);
  if (d === null) return "unknown";
  if (d < 0) return "expired";
  if (d <= 2) return "urgent";
  if (d <= 5) return "soon";
  return "ok";
}

export function dDayLabel(expiresAt: string | null): string {
  const d = daysLeft(expiresAt);
  if (d === null) return "기한 정보 없음";
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

export const PRIORITY_GROUP_META: Record<
  PriorityGroup,
  { title: string; sub: string }
> = {
  veryUrgent: { title: "매우 급해요", sub: "오늘·내일까지 먹어주세요" },
  soon: { title: "곧 먹기", sub: "2~3일 안에 먹는 게 좋아요" },
  thisWeek: { title: "이번 주", sub: "이번 주 안에 소비해 주세요" },
  later: { title: "여유 있어요", sub: "아직 시간이 충분해요" },
};

export function formatKoreanDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${m}월 ${d}일`;
}

export function formatWon(n: number): string {
  return `₩${n.toLocaleString("ko-KR")}`;
}
