import { describe, expect, it } from "vitest";
import {
  dDayLabel,
  daysLeft,
  expiryLevel,
  friendlyExpiryText,
  priorityGroup,
  shelfLabel,
  sortByExpiry,
} from "../expiry-calculator";
import { inDays, ing } from "./fixtures";
import { useFixedToday } from "./setup-clock";

describe("expiry-calculator", () => {
  useFixedToday();

  it("남은 일수를 날짜 단위로 계산한다 (시각과 무관)", () => {
    expect(daysLeft(inDays(0))).toBe(0);
    expect(daysLeft(inDays(1))).toBe(1);
    expect(daysLeft(inDays(-3))).toBe(-3);
    expect(daysLeft(null)).toBeNull();
  });

  it("월말을 넘어가는 날짜도 정확히 센다", () => {
    expect(daysLeft("2026-11-01")).toBe(26);
  });

  it("D-Day 라벨", () => {
    expect(dDayLabel(inDays(0))).toBe("D-Day");
    expect(dDayLabel(inDays(2))).toBe("D-2");
    expect(dDayLabel(inDays(-1))).toBe("D+1");
    expect(dDayLabel(null)).toBe("기한 모름");
  });

  it("기한에 따라 단계와 우선소비 그룹을 나눈다", () => {
    expect(expiryLevel(inDays(-1))).toBe("expired");
    expect(expiryLevel(null)).toBe("unknown");
    expect(priorityGroup(inDays(1))).toBe("veryUrgent");
    expect(priorityGroup(inDays(3))).toBe("soon");
    expect(priorityGroup(inDays(7))).toBe("thisWeek");
    expect(priorityGroup(inDays(8))).toBe("later");
    expect(priorityGroup(null)).toBeNull();
  });

  it("사용자 문구", () => {
    expect(friendlyExpiryText(inDays(1))).toBe("내일까지예요");
    expect(friendlyExpiryText(inDays(-2))).toBe("기한이 2일 지났어요");
  });

  it("임박순 정렬 — 기한 없는 재료는 맨 뒤", () => {
    const list = [
      ing({ name: "C", expiresAt: null }),
      ing({ name: "B", expiresAt: inDays(4) }),
      ing({ name: "A", expiresAt: inDays(1) }),
    ];
    expect(sortByExpiry(list).map((i) => i.name)).toEqual(["A", "B", "C"]);
  });

  it("보관 기간 칩 문구", () => {
    expect([3, 7, 14, 30].map(shelfLabel)).toEqual(["3일", "일주일", "2주", "한 달"]);
  });
});
