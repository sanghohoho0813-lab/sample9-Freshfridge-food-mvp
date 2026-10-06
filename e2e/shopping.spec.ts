import { test, expect, open } from "./fixtures";

test.describe("장보기", () => {
  test("구매 완료만으로는 재고를 바꾸지 않고, 확인 후에만 냉장고에 넣는다", async ({ page, app }) => {
    await open(page, "/shopping");
    await page.getByRole("button", { name: "양배추 구매 완료" }).click();
    expect(await app.ingredient("양배추")).toBeUndefined();

    await page.getByRole("button", { name: "냉장고에 넣기" }).first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet.getByText("양배추를 냉장고에 넣을까요?")).toBeVisible();
    await sheet.getByRole("button", { name: "냉장고에 넣기" }).click();

    await expect.poll(async () => (await app.ingredient("양배추"))?.status).toBe("available");
    expect((await app.state()).shopping.find((s) => s.name === "양배추")?.addedToFridge).toBe(true);
    await expect(page.getByRole("link", { name: "냉장고에 넣음" })).toBeVisible();
  });

  test("빈 이름·중복 항목은 막고, 지운 항목은 되돌릴 수 있다", async ({ page, app }) => {
    await open(page, "/shopping");
    await page.getByRole("button", { name: "담기" }).click();
    await expect(page.getByText("살 재료 이름을 입력해주세요.")).toBeVisible();

    await page.getByLabel("장보기 재료 이름").fill("고춧가루");
    await page.getByRole("button", { name: "담기" }).click();
    await expect(page.getByText("고춧가루는 이미 목록에 있어요.")).toBeVisible();

    const before = (await app.state()).shopping.length;
    await page.getByRole("button", { name: "고춧가루 삭제" }).click();
    await expect.poll(async () => (await app.state()).shopping.length).toBe(before - 1);
    await page.getByRole("button", { name: "되돌리기" }).click();
    await expect.poll(async () => (await app.state()).shopping.length).toBe(before);
  });
});
