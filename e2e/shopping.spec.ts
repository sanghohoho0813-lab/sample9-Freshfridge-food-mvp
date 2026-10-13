import { test, expect, open } from "./fixtures";

test.describe("장보기", () => {
  test("구매 완료만으로는 재고를 바꾸지 않고, 확인 후에만 냉장고에 넣는다", async ({ page, app }) => {
    await open(page, "/shopping");
    await page.getByRole("button", { name: "양배추 구매 완료" }).click();
    expect(await app.ingredient("양배추")).toBeUndefined();

    await page.getByRole("button", { name: "양배추 냉장고에 넣기" }).click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("양배추를 냉장고에 넣을까요?")).toBeVisible();
    await sheet.getByRole("button", { name: "냉장고에 넣기" }).click();

    await expect.poll(async () => (await app.ingredient("양배추"))?.status).toBe("available");
    expect((await app.state()).shopping.find((s) => s.name === "양배추")?.addedToFridge).toBe(true);
    await expect(page.getByRole("link", { name: /양배추 냉장고에 넣음/ })).toBeVisible();
  });

  test("빈 이름·중복 항목은 막고, 지운 항목은 되돌릴 수 있다", async ({ page, app }) => {
    await open(page, "/shopping");
    await page.getByRole("button", { name: "담기", exact: true }).click();
    await expect(page.getByText("살 재료 이름을 입력해주세요.")).toBeVisible();

    await page.getByLabel("장보기 재료 이름").fill("고춧가루");
    await page.getByRole("button", { name: "담기", exact: true }).click();
    await expect(page.getByText("고춧가루는 이미 목록에 있어요.")).toBeVisible();

    const before = (await app.state()).shopping.length;
    await page.getByRole("button", { name: "고춧가루 삭제" }).click();
    await expect.poll(async () => (await app.state()).shopping.length).toBe(before - 1);
    await page.getByRole("button", { name: "되돌리기" }).click();
    await expect.poll(async () => (await app.state()).shopping.length).toBe(before);
  });

  test("냉장고와 연결: 왜 사는지 보여주고, 거의 다 먹은 재료를 제안한다", async ({ page, app }) => {
    await open(page, "/shopping");
    const toBuy = page.getByRole("list", { name: "살 것" });
    await expect(toBuy.getByText("‘돼지고기 김치찌개’에 필요해요")).toBeVisible();

    const suggest = page.getByRole("region", { name: "냉장고를 보면, 이것도 필요해요" });
    await expect(suggest.getByText("1개만 남았어요")).toBeVisible();
    await suggest.getByRole("button", { name: "요거트 장보기에 담기" }).click();
    await expect(toBuy.getByText("냉장고에 1개만 남았어요")).toBeVisible();
    // 담고 나면 제안에서 빠진다
    await expect(suggest.getByRole("button", { name: "요거트 장보기에 담기" })).toHaveCount(0);
    expect((await app.state()).shopping.find((s) => s.name === "요거트")).toMatchObject({ checked: false });
  });

  test("산 것 여러 개를 차례로 넣고, 이미 있는 재료는 기존 것에 더할 수 있다", async ({ page, app }) => {
    await open(page, "/shopping");
    await page.getByLabel("장보기 재료 이름").fill("계란");
    await page.getByRole("button", { name: "담기", exact: true }).click();
    await page.getByRole("button", { name: "계란 구매 완료" }).click();
    await page.getByRole("button", { name: "양배추 구매 완료" }).click();
    const eggBefore = await app.ingredient("계란");

    await page.getByRole("button", { name: /산 것 3개 차례로 냉장고에 넣기/ }).click();
    const sheet = page.getByRole("dialog");
    // 순서는 구매 완료 목록 순 — 이름으로 확인하며 하나씩 처리한다
    for (let i = 0; i < 3; i++) {
      const title = await sheet.getByRole("heading").innerText();
      if (title.startsWith("계란")) {
        await sheet.getByRole("button", { name: "기존 것에 더하기" }).first().click();
        await sheet.getByRole("button", { name: "기존 것에 더하기" }).last().click();
      } else {
        await sheet.getByRole("button", { name: /넣고 다음|냉장고에 넣기/ }).click();
      }
      if (i < 2) await expect(sheet.getByRole("heading")).not.toHaveText(title);
    }
    await expect(page.getByRole("dialog")).toHaveCount(0);

    const eggAfter = await app.ingredient("계란");
    expect(eggAfter!.id).toBe(eggBefore!.id);
    expect(eggAfter!.quantity).toBeGreaterThan(eggBefore!.quantity);
    expect((await app.ingredient("양배추"))?.status).toBe("available");
    expect((await app.state()).shopping.filter((s) => s.checked && !s.addedToFridge)).toHaveLength(0);
  });
});
