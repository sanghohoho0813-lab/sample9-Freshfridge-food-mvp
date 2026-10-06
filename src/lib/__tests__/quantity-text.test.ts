import { describe, expect, it } from "vitest";
import { amountStep, defaultAmount, formatAmount } from "../quantity";
import { joinNames, josa } from "../text";

describe("quantity", () => {
  it("단위별 증감 단위", () => {
    expect(amountStep("개")).toBe(1);
    expect(amountStep("g")).toBe(50);
    expect(amountStep("L")).toBe(0.5);
  });

  it("먹었어요 시트의 기본 선택량은 한 번에 먹는 양에 가깝게", () => {
    expect(defaultAmount(8, "개")).toBe(1);
    expect(defaultAmount(400, "g")).toBe(200);
    expect(defaultAmount(30, "g")).toBe(30); // 보유량보다 많이 고르지 않는다
  });

  it("소수점 표시", () => {
    expect(formatAmount(0.5, "단")).toBe("0.5단");
    expect(formatAmount(1 / 3, "L")).toBe("0.33L"); // 3등분처럼 끝없는 소수도 둘째 자리까지
    expect(formatAmount(2)).toBe("2");
  });
});

describe("text — 한국어 조사", () => {
  it("받침 유무에 따라 조사를 고른다", () => {
    expect(josa("두부", "을/를")).toBe("두부를");
    expect(josa("당근", "을/를")).toBe("당근을");
    expect(josa("우유", "과/와")).toBe("우유와");
    expect(josa("시금치", "으로/로")).toBe("시금치로");
    expect(josa("유제품", "은/는")).toBe("유제품은");
  });

  it("영문·숫자로 끝나면 받침 없음으로 처리", () => {
    expect(josa("BBQ", "을/를")).toBe("BBQ를");
  });

  it("이름 목록을 자연스럽게 잇는다", () => {
    expect(joinNames(["우유"])).toBe("우유를");
    expect(joinNames(["우유", "두부"])).toBe("우유와 두부를");
    expect(joinNames(["당근", "두부", "시금치"])).toBe("당근과 두부 외 1개를");
    expect(joinNames([])).toBe("");
  });
});
