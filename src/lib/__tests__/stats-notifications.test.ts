import { describe, expect, it } from "vitest";
import {
  daysSinceLastWaste,
  monthCompare,
  monthSpan,
  monthlyReport,
  periodSummary,
  relativeDay,
  wasteByFood,
} from "../stats";
import { deriveNotifications } from "../notifications";
import type { ConsumptionLog } from "../types";
import { inDays, ing, stateWith } from "./fixtures";
import { useFixedToday } from "./setup-clock";

const log = (
  daysAgo: number,
  type: ConsumptionLog["type"],
  price = 1000,
  dLeft: number | null = 5
): ConsumptionLog => ({
  id: `l${daysAgo}${type}${price}`,
  ingredientName: "x",
  emoji: "",
  category: "vegetable",
  type,
  date: inDays(-daysAgo),
  price,
  dLeft,
});

describe("stats", () => {
  useFixedToday();

  it("기간 요약 — 폐기율·절약 금액·임박 재료 살림", () => {
    const s = periodSummary(
      [log(0, "consumed", 1000, 1), log(3, "consumed", 2000), log(5, "discarded", 500), log(40, "consumed")],
      [],
      0,
      29
    );
    expect(s).toMatchObject({
      usedCount: 2,
      wastedCount: 1,
      wasteRate: 33.3,
      savedAmount: 3000,
      wastedAmount: 500,
      rescuedCount: 1,
    });
  });

  it("이전 30일 기록이 없으면 비교하지 않는다 (지어낸 비교 금지)", () => {
    const r = monthlyReport([log(1, "consumed")], []);
    expect(r.previous).toBeNull();
    expect(r.wasteCountDelta).toBeNull();
  });

  it("이전 30일과 폐기 수를 비교한다", () => {
    const r = monthlyReport([log(1, "discarded"), log(35, "discarded"), log(36, "discarded")], []);
    expect(r.wasteCountDelta).toBe(-1);
  });

  it("이번 달 = 1일~오늘, 지난달 같은 기간과 비교 (짧은 달은 말일까지)", () => {
    expect(monthSpan(new Date(2026, 9, 6))).toMatchObject({
      from: "2026-10-01",
      to: "2026-10-06",
      prevFrom: "2026-09-01",
      prevTo: "2026-09-06",
    });
    expect(monthSpan(new Date(2026, 2, 31))).toMatchObject({
      prevFrom: "2026-02-01",
      prevTo: "2026-02-28",
      prevMonth: 2,
    });
    expect(monthSpan(new Date(2026, 0, 10))).toMatchObject({ prevFrom: "2025-12-01", prevMonth: 12 });
  });

  it("월 비교: 지난달 같은 기간 기록이 없으면 비교하지 않는다", () => {
    const thisMonth = monthCompare([log(1, "discarded", 2000), log(3, "consumed")], [], new Date(2026, 9, 6));
    expect(thisMonth.current).toMatchObject({ wastedAmount: 2000, wastedCount: 1, usedCount: 1 });
    expect(thisMonth.previous).toBeNull();
    // 9월 2일 기록(34일 전)은 9월 1~6일 안에 들어간다
    const withPrev = monthCompare(
      [log(1, "discarded"), log(34, "discarded"), log(33, "discarded")],
      [],
      new Date(2026, 9, 6)
    );
    expect(withPrev.previous?.wastedCount).toBe(2);
  });

  it("버린 식재료를 이름별로 — 가장 많은 이유 포함", () => {
    const logs: ConsumptionLog[] = [
      { ...log(1, "discarded", 2500), ingredientName: "상추", reason: "보관 실패" },
      { ...log(9, "discarded", 2500), id: "x", ingredientName: "상추", reason: "보관 실패" },
      { ...log(4, "discarded", 800), id: "y", ingredientName: "당근", reason: "너무 많이 구매" },
    ];
    expect(wasteByFood(logs, inDays(-30), inDays(0))).toEqual([
      { name: "상추", count: 2, amount: 5000, topReason: "보관 실패" },
      { name: "당근", count: 1, amount: 800, topReason: "너무 많이 구매" },
    ]);
  });

  it("마지막으로 버린 지 며칠", () => {
    expect(daysSinceLastWaste([log(5, "discarded"), log(2, "consumed")], new Date(2026, 9, 6))).toBe(5);
    expect(daysSinceLastWaste([log(2, "consumed")])).toBeNull();
  });

  it("상대 날짜", () => {
    expect(relativeDay(inDays(0))).toBe("오늘");
    expect(relativeDay(inDays(-1))).toBe("어제");
    expect(relativeDay(inDays(-14))).toBe("2주 전");
  });
});

describe("notifications — 저장하지 않고 현재 상태에서 계산", () => {
  useFixedToday();

  it("오늘·내일까지인 재료만 기한 알림을 만든다", () => {
    const fridge = [ing({ name: "우유", expiresAt: inDays(1) }), ing({ name: "감자", expiresAt: inDays(9) })];
    const list = deriveNotifications(stateWith(fridge), fridge).filter((n) => n.kind === "expiry");
    expect(list.map((n) => n.title)).toEqual(["우유의 유통기한이 내일이에요"]);
    expect(list[0].href).toBe("/ingredient/ing_우유");
  });

  it("기한이 바뀌면 알림 id 도 바뀌어 다시 '안 읽음'이 된다", () => {
    const a = deriveNotifications(stateWith([]), [ing({ name: "우유", expiresAt: inDays(1) })])[0];
    const b = deriveNotifications(stateWith([]), [ing({ name: "우유", expiresAt: inDays(0) })])[0];
    expect(a.id).not.toBe(b.id);
  });
});
