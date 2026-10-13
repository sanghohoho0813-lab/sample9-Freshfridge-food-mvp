import { describe, expect, it } from "vitest";
import {
  frequentlyEaten,
  isRunningLow,
  remainingRatio,
  restockSuggestions,
  todayFocus,
  wasteActions,
} from "../insights";
import type { ConsumptionLog, Recipe } from "../types";
import { inDays, ing, stateWith } from "./fixtures";
import { useFixedToday } from "./setup-clock";

const eaten = (name: string, daysAgo: number): ConsumptionLog => ({
  id: `${name}${daysAgo}`,
  ingredientName: name,
  emoji: "",
  category: "dairy",
  type: "consumed",
  date: inDays(-daysAgo),
  price: 1000,
});

const recipe = (id: string, names: [string, number][]): Recipe => ({
  id,
  name: id,
  emoji: "",
  image: id,
  minutes: 10,
  difficulty: "쉬움",
  servings: 1,
  description: "",
  steps: [],
  ingredients: names.map(([name, consume]) => ({ name, amount: "", consume, essential: true })),
});

describe("insights", () => {
  useFixedToday();

  describe("남은 양", () => {
    it("처음 양 대비 비율", () => {
      expect(remainingRatio(ing({ name: "계란", quantity: 8, initialQuantity: 10 }))).toBe(0.8);
      expect(remainingRatio(ing({ name: "우유", quantity: 1 }))).toBe(1);
    });

    it("마지막 한 단위나 1/4 이하만 '거의 다 먹음' — 처음부터 1개만 산 건 아니다", () => {
      expect(isRunningLow(ing({ name: "요거트", quantity: 1, initialQuantity: 4 }))).toBe(true);
      expect(isRunningLow(ing({ name: "돼지고기", quantity: 100, unit: "g", initialQuantity: 600 }))).toBe(true);
      expect(isRunningLow(ing({ name: "계란", quantity: 8, initialQuantity: 10 }))).toBe(false);
      expect(isRunningLow(ing({ name: "우유", quantity: 1, initialQuantity: 1 }))).toBe(false);
      expect(isRunningLow(ing({ name: "우유", quantity: 0.5, initialQuantity: 1, unit: "팩" }))).toBe(true);
    });
  });

  it("자주 먹는 재료 — 최근 60일 2번 이상", () => {
    const f = frequentlyEaten([
      eaten("우유", 1),
      eaten("우유", 20),
      eaten("치즈", 2),
      eaten("바나나", 70),
      eaten("바나나", 80),
    ]);
    expect([...f.keys()]).toEqual(["우유"]);
  });

  describe("다시 살 것", () => {
    it("거의 다 먹은 재료 + 자주 먹는데 없는 재료, 장보기에 이미 있으면 제외", () => {
      const fridge = [
        ing({ name: "요거트", quantity: 1, initialQuantity: 4 }),
        ing({ name: "계란", quantity: 8, initialQuantity: 10 }),
      ];
      const state = stateWith(fridge, {
        logs: [eaten("바나나", 1), eaten("바나나", 9), eaten("우유", 3), eaten("우유", 5)],
        shopping: [{ id: "s", name: "우유", checked: false }],
      });
      const s = restockSuggestions(state, fridge);
      expect(s.map((x) => [x.name, x.reason])).toEqual([
        ["요거트", "low"],
        ["바나나", "out"],
      ]);
    });

    it("같은 재료를 따로 넉넉히 가지고 있으면 떨어진 것으로 보지 않는다", () => {
      const fridge = [
        ing({ id: "a", name: "우유", quantity: 0.2, initialQuantity: 1, unit: "팩" }),
        ing({ id: "b", name: "우유", quantity: 1, initialQuantity: 1, unit: "팩" }),
      ];
      expect(restockSuggestions(stateWith(fridge), fridge)).toEqual([]);
    });
  });

  describe("오늘 할 일", () => {
    const recipes = [
      recipe("두부전골", [
        ["두부", 1],
        ["버섯", 1],
      ]),
      recipe("두부튀김", [
        ["두부", 1],
        ["전분", 1],
      ]),
    ];

    it("기한이 지난 재료가 있으면 정리가 먼저", () => {
      const fridge = [ing({ name: "상추", expiresAt: inDays(-1) }), ing({ name: "두부", expiresAt: inDays(1) })];
      expect(todayFocus(stateWith(fridge), fridge, recipes).kind).toBe("expired");
    });

    it("오늘·내일 재료가 있으면 그걸 쓰는, 바로 만들 수 있는 요리", () => {
      const fridge = [ing({ name: "두부", expiresAt: inDays(1) }), ing({ name: "버섯", expiresAt: inDays(9) })];
      const f = todayFocus(stateWith(fridge), fridge, recipes);
      expect(f.kind).toBe("cook");
      if (f.kind === "cook") {
        expect(f.when).toBe("today");
        expect(f.match.recipe.id).toBe("두부전골"); // 전분이 없는 두부튀김은 제외
      }
    });

    it("쓸 요리가 없으면 그냥 먹기", () => {
      const fridge = [ing({ name: "요거트", expiresAt: inDays(0) })];
      expect(todayFocus(stateWith(fridge), fridge, recipes).kind).toBe("eat");
    });

    it("급한 재료가 없으면 다 떨어져가는 재료", () => {
      const fridge = [ing({ name: "요거트", quantity: 1, initialQuantity: 4, expiresAt: inDays(9) })];
      const f = todayFocus(stateWith(fridge), fridge, recipes);
      expect(f.kind).toBe("restock");
    });
  });

  it("다음 달 행동 — 자주 버린 재료와 이유에 맞춰, 지금 냉장고에 있으면 그 재료로 연결", () => {
    const discard = (name: string, daysAgo: number, reason: ConsumptionLog["reason"]): ConsumptionLog => ({
      ...eaten(name, daysAgo),
      id: `d${name}${daysAgo}`,
      category: "vegetable",
      type: "discarded",
      reason,
    });
    const logs = [
      discard("상추", 2, "보관 실패"),
      discard("상추", 20, "보관 실패"),
      discard("대파", 5, "너무 많이 구매"),
    ];
    const fridge = [ing({ id: "lettuce", name: "상추", expiresAt: inDays(2) })];
    const actions = wasteActions(logs, fridge);
    expect(actions.map((a) => a.title)).toEqual(["상추 보관 방법 바꾸기", "대파는 다음 장보기 때 절반만 사기"]);
    expect(actions[0].href).toBe("/ingredient/lettuce");
    expect(actions[0].detail).toMatch(/키친타월/);
  });
});
