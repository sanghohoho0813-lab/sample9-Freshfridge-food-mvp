import { describe, expect, it } from "vitest";
import { toAmount, validateDates, validateName, validateQuantity } from "../validation";

describe("validation", () => {
  it("이름: 공백만 있거나 너무 길면 오류", () => {
    expect(validateName("  ")).toMatch(/입력해주세요/);
    expect(validateName("가".repeat(21))).toMatch(/20자/);
    expect(validateName(" 우유 ")).toBeNull();
  });

  it("수량: 빈 값·0·음수·숫자가 아닌 값·너무 큰 값", () => {
    for (const bad of ["", "0", "-1", "abc", ".", "10000"]) expect(validateQuantity(bad), bad).not.toBeNull();
    for (const ok of ["1", "0.5", "300", "9999"]) expect(validateQuantity(ok), ok).toBeNull();
  });

  it("날짜: 미래 구매일, 구매일보다 이른 유통기한 / 모름(빈 값)은 허용", () => {
    const today = "2026-10-06";
    expect(validateDates({ purchasedAt: "2026-10-07", expiresAt: "", today }).purchasedAt).not.toBeNull();
    expect(validateDates({ purchasedAt: "2026-10-06", expiresAt: "2026-10-05", today }).expiresAt).not.toBeNull();
    expect(validateDates({ purchasedAt: "2026-10-06", expiresAt: "", today })).toEqual({
      purchasedAt: null,
      expiresAt: null,
    });
  });

  it("수량 문자열 → 소수 둘째 자리 숫자", () => {
    expect(toAmount("0.333")).toBe(0.33);
  });
});
