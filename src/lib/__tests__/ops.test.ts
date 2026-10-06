import { describe, expect, it } from "vitest";
import * as ops from "../state/ops";
import { fixedEnv, inDays, ing, stateWith, TODAY } from "./fixtures";
import { useFixedToday } from "./setup-clock";

describe("state ops", () => {
  useFixedToday();

  describe("먹었어요 (consumeIngredient)", () => {
    it("일부만 먹으면 남은 양과 남은 금액이 비례해서 줄고, 기록에 수량·금액·D-Day 가 남는다", () => {
      const s0 = stateWith([ing({ name: "계란", quantity: 8, unit: "개", price: 6400, expiresAt: inDays(2) })]);
      const s1 = ops.consumeIngredient(s0, "ing_계란", 2, fixedEnv());
      const egg = s1.ingredients[0];
      expect(egg.quantity).toBe(6);
      expect(egg.price).toBe(4800);
      expect(egg.status).toBe("available");
      expect(s1.logs[0]).toMatchObject({ type: "consumed", amount: 2, price: 1600, date: TODAY, dLeft: 2, unit: "개" });
    });

    it("전부 먹으면 상태가 consumed 가 된다", () => {
      const s1 = ops.consumeIngredient(stateWith([ing({ name: "우유" })]), "ing_우유", undefined, fixedEnv());
      expect(s1.ingredients[0]).toMatchObject({ quantity: 0, status: "consumed" });
    });

    it("보유량보다 많이 요청해도 보유량까지만 뺀다", () => {
      const s1 = ops.consumeIngredient(stateWith([ing({ name: "대파", quantity: 1 })]), "ing_대파", 5, fixedEnv());
      expect(s1.logs[0].amount).toBe(1);
      expect(s1.ingredients[0].quantity).toBe(0);
    });

    it("소수 단위도 오차 없이 뺀다 (1단 − 0.3단 = 0.7단)", () => {
      const s1 = ops.consumeIngredient(stateWith([ing({ name: "대파", quantity: 1 })]), "ing_대파", 0.3, fixedEnv());
      expect(s1.ingredients[0].quantity).toBe(0.7);
    });

    it("이미 다 먹은 재료·없는 재료·0개 요청은 아무것도 바꾸지 않는다 (같은 참조)", () => {
      const done = stateWith([ing({ name: "우유", quantity: 0, status: "consumed" })]);
      expect(ops.consumeIngredient(done, "ing_우유", 1, fixedEnv())).toBe(done);
      expect(ops.consumeIngredient(done, "nope", 1, fixedEnv())).toBe(done);
      const s0 = stateWith([ing({ name: "우유" })]);
      expect(ops.consumeIngredient(s0, "ing_우유", 0, fixedEnv())).toBe(s0);
    });
  });

  it("버렸어요 — 사유와 함께 폐기 기록", () => {
    const s1 = ops.discardIngredient(
      stateWith([ing({ name: "상추" })]),
      "ing_상추",
      "보관 실패",
      undefined,
      fixedEnv()
    );
    expect(s1.ingredients[0].status).toBe("discarded");
    expect(s1.logs[0]).toMatchObject({ type: "discarded", reason: "보관 실패" });
  });

  describe("요리했어요 (cookRecipe)", () => {
    const fridge = () =>
      stateWith([
        ing({ name: "두부", quantity: 1, unit: "모", price: 2400, expiresAt: inDays(1) }),
        ing({ name: "대파", quantity: 1, unit: "단", price: 1800, expiresAt: inDays(6) }),
      ]);

    it("레시피 분량만큼 차감하고 요리 1건과 같은 cookId 로 묶인 기록을 남긴다", () => {
      const s1 = ops.cookRecipe(
        fridge(),
        { id: "r1", name: "두부조림" },
        [
          { ingredientId: "ing_두부", amount: 1 },
          { ingredientId: "ing_대파", amount: 0.5 },
        ],
        fixedEnv()
      );
      expect(s1.cooks).toHaveLength(1);
      const cook = s1.cooks[0];
      expect(cook).toMatchObject({ recipeName: "두부조림", usedCount: 2, savedAmount: 3300, rescuedCount: 1 });
      expect(s1.logs.every((l) => l.cookId === cook.id && l.via === "두부조림")).toBe(true);
      expect(s1.ingredients.map((i) => i.quantity)).toEqual([0, 0.5]);
    });

    it("차감할 재료가 하나도 없으면 요리 기록도 만들지 않는다", () => {
      const s0 = fridge();
      expect(ops.cookRecipe(s0, { id: "r1", name: "x" }, [{ ingredientId: "nope", amount: 1 }], fixedEnv())).toBe(s0);
    });
  });

  describe("장보기", () => {
    it("아직 사지 않은 같은 이름은 다시 담지 않고, 빈 이름은 무시한다", () => {
      const s1 = ops.addShoppingItems(stateWith([]), ["간장", " 간장 ", "", "식초"], "두부조림", fixedEnv());
      expect(s1.shopping.map((s) => s.name)).toEqual(["간장", "식초"]);
      expect(s1.shopping[0].fromRecipe).toBe("두부조림");
      expect(ops.addShoppingItems(s1, ["간장"], undefined, fixedEnv())).toBe(s1);
    });

    it("구매 완료한 항목은 같은 이름으로 다시 담을 수 있다", () => {
      const s1 = ops.addShoppingItems(stateWith([]), ["간장"], undefined, fixedEnv());
      const s2 = ops.toggleShoppingItem(s1, s1.shopping[0].id);
      const s3 = ops.addShoppingItems(s2, ["간장"], undefined, fixedEnv());
      expect(s3.shopping).toHaveLength(2);
    });

    it("장보기에서 냉장고에 넣으면 그 항목을 '넣음'으로 표시한다", () => {
      const s0 = stateWith([], { shopping: [{ id: "sh1", name: "양배추", checked: true }] });
      const s1 = ops.addIngredient(
        s0,
        { ...ing({ name: "양배추" }), id: undefined } as unknown as ops.NewIngredient,
        { fromShoppingId: "sh1", id: "ing_new" },
        fixedEnv()
      );
      expect(s1.ingredients[0]).toMatchObject({ id: "ing_new", status: "available" });
      expect(s1.shopping[0].addedToFridge).toBe(true);
    });

    it("구매 취소하면 '넣음' 표시도 풀린다", () => {
      const s0 = stateWith([], { shopping: [{ id: "sh1", name: "양배추", checked: true, addedToFridge: true }] });
      expect(ops.toggleShoppingItem(s0, "sh1").shopping[0]).toMatchObject({ checked: false, addedToFridge: false });
    });

    it("구매 완료 비우기 — 비울 것이 없으면 같은 참조", () => {
      const s0 = stateWith([], { shopping: [{ id: "a", name: "a", checked: false }] });
      expect(ops.clearPurchasedShopping(s0)).toBe(s0);
    });
  });

  it("알림 읽음 처리는 중복 없이, 바뀐 것이 없으면 같은 참조", () => {
    const s1 = ops.markNotificationsRead(stateWith([]), ["n1", "n1", "n2"]);
    expect(s1.readNotificationIds).toEqual(["n1", "n2"]);
    expect(ops.markNotificationsRead(s1, ["n2"])).toBe(s1);
  });

  it("정보 수정은 기록을 남기지 않는다", () => {
    const s1 = ops.updateIngredient(stateWith([ing({ name: "계란", quantity: 8 })]), "ing_계란", {
      quantity: 10,
      storage: "freezer",
    });
    expect(s1.ingredients[0]).toMatchObject({ quantity: 10, storage: "freezer" });
    expect(s1.logs).toHaveLength(0);
  });
});
