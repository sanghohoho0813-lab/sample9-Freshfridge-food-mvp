import { describe, expect, it } from "vitest";
import { monthlyReport, periodSummary, relativeDay } from "../stats";
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
