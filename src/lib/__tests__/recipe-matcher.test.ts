import { describe, expect, it } from "vitest";
import { findOwned, matchRecipe, rankRecipes } from "../recipe-matcher";
import type { Recipe } from "../types";
import { inDays, ing } from "./fixtures";
import { useFixedToday } from "./setup-clock";

const recipe = (id: string, names: [string, number, boolean?][]): Recipe => ({
  id,
  name: id,
  emoji: "🍳",
  image: id,
  minutes: 10,
  difficulty: "쉬움",
  servings: 1,
  description: "",
  steps: [],
  ingredients: names.map(([name, consume, essential = true]) => ({ name, amount: "", consume, essential })),
});

describe("recipe-matcher", () => {
  useFixedToday();

  it("같은 이름이 여러 개면 기한이 빠른 것을 쓴다", () => {
    const fridge = [
      ing({ id: "late", name: "우유", expiresAt: inDays(6) }),
      ing({ id: "early", name: "우유", expiresAt: inDays(1) }),
    ];
    expect(findOwned("우유", fridge)?.id).toBe("early");
  });

  it("같은 이름이 없을 때만 부분 일치 (한 글자 이름은 부분 일치하지 않음)", () => {
    const fridge = [ing({ name: "돼지고기 앞다리살" }), ing({ name: "파" })];
    expect(findOwned("돼지고기", fridge)?.name).toBe("돼지고기 앞다리살");
    expect(findOwned("대파", fridge)).toBeUndefined();
  });

  it("다 먹은 재료는 보유로 치지 않는다", () => {
    expect(findOwned("우유", [ing({ name: "우유", quantity: 0, status: "consumed" })])).toBeUndefined();
  });

  it("보유율·부족·임박 재료를 계산한다", () => {
    const m = matchRecipe(
      recipe("전골", [
        ["두부", 1],
        ["버섯", 2],
        ["간장", 0, false],
      ]),
      [ing({ name: "두부", expiresAt: inDays(1) }), ing({ name: "버섯", quantity: 1 })]
    );
    expect(m.matchPercent).toBe(67);
    expect(m.missing.map((x) => x.name)).toEqual(["간장"]);
    expect(m.matched.find((x) => x.name === "버섯")?.short).toBe(true);
    expect(m.urgentOwned.map((x) => x.name)).toEqual(["두부"]);
  });

  it("임박 재료를 쓰는 레시피가 앞에 온다", () => {
    const fridge = [ing({ name: "두부", expiresAt: inDays(1) }), ing({ name: "감자", expiresAt: inDays(20) })];
    const ranked = rankRecipes([recipe("감자볶음", [["감자", 1]]), recipe("두부부침", [["두부", 1]])], fridge);
    expect(ranked[0].recipe.id).toBe("두부부침");
  });
});
