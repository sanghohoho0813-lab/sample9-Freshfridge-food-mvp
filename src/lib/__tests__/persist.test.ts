import { describe, expect, it } from "vitest";
import { parseState } from "../state/persist";
import { ing } from "./fixtures";

describe("persist — 저장 데이터 복원", () => {
  it("비어 있거나 깨진 값이면 null (데모 데이터로 시작)", () => {
    expect(parseState(null)).toBeNull();
    expect(parseState("{not json")).toBeNull();
    expect(parseState("[]")).toBeNull();
    expect(parseState(JSON.stringify({ ingredients: [] }))).toBeNull();
  });

  it("형태가 맞지 않는 재료는 걸러내고 나머지는 살린다", () => {
    const raw = JSON.stringify({
      ingredients: [
        ing({ name: "우유" }),
        { id: 1, name: "깨진 항목" },
        { id: "x", name: "수량 없음", unit: "개", quantity: "많이" },
      ],
    });
    const s = parseState(raw);
    expect(s?.ingredients.map((i) => i.name)).toEqual(["우유"]);
  });

  it("이전 버전처럼 일부 필드가 없으면 기본값으로 채운다", () => {
    const s = parseState(JSON.stringify({ ingredients: [ing({ name: "우유" })] }));
    expect(s).not.toBeNull();
    expect(s!.cooks).toEqual([]);
    expect(s!.readNotificationIds).toEqual([]);
    expect(typeof s!.userName).toBe("string");
  });
});
