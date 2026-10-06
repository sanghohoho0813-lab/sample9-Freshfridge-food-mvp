import { test, expect, open } from "./fixtures";

test.describe("식재료 추가·수정", () => {
  test("입력 검증 → 저장 → 냉장고에서 새 재료 강조 → 되돌리기", async ({ page, app }) => {
    await open(page, "/add");
    const submit = page.getByRole("button", { name: /냉장고에 추가$/ });
    const count = (await app.state()).ingredients.length;

    await submit.click();
    await expect(page.getByText("식재료 이름을 입력해주세요.")).toBeVisible();
    await expect(page.locator("#ing-name")).toBeFocused();

    await page.locator("#ing-name").fill("비트");
    await page.locator("#ing-qty").fill("");
    await submit.click();
    await expect(page.getByText("수량은 0보다 큰 숫자로 입력해주세요.")).toBeVisible();

    await page.locator("#ing-qty").fill("2");
    await page.getByRole("button", { name: "수량 늘리기" }).click();
    await expect(page.locator("#ing-qty")).toHaveValue("3");

    await page.getByRole("button", { name: /구매일·메모/ }).click();
    await page.locator("#ing-expiry").fill("2000-01-01");
    await submit.click();
    await expect(page.getByText("유통기한이 구매일보다 빨라요. 날짜를 확인해주세요.")).toBeVisible();
    expect((await app.state()).ingredients.length).toBe(count);

    await page.getByRole("button", { name: "일주일" }).click();
    await submit.click();
    await expect(page).toHaveURL(/\/fridge/);
    const beet = await app.ingredient("비트");
    expect(beet?.quantity).toBe(3);
    await expect(page.locator(`#ing-${beet!.id}`)).toHaveClass(/bg-fresh-50/);

    await page.getByRole("button", { name: "되돌리기" }).click();
    await expect.poll(async () => await app.ingredient("비트")).toBeUndefined();
  });

  test("이미 있는 재료를 입력하면 알려준다", async ({ page }) => {
    await open(page, "/add");
    await page.locator("#ing-name").fill("우유");
    await expect(page.getByText("이미 냉장고에 있어요")).toBeVisible();
  });

  test("사진 데모: 예시 사진으로 인식 결과를 확인하고 일부를 빼고 추가", async ({ page, app }) => {
    await open(page, "/add");
    await page.getByRole("tab", { name: "사진으로 추가" }).click();
    await page.getByRole("button", { name: "예시 사진으로 해보기" }).click();
    await expect(page.getByText("식재료 3개를 찾았어요")).toBeVisible({ timeout: 5000 });
    await page.getByRole("button", { name: "빼기" }).first().click();
    await page.getByRole("button", { name: "2개 추가" }).click();
    await expect(page).toHaveURL(/\/fridge/);
    expect((await app.state()).ingredients.filter((i) => i.name === "토마토").length).toBe(2);
  });

  test("정보 수정: 잘못된 수량은 막고, 저장하면 바로 반영된다", async ({ page, app }) => {
    await open(page, "/");
    const egg = await app.ingredient("계란");
    await open(page, `/ingredient/${egg!.id}`);
    await page.getByRole("button", { name: "정보 수정" }).click();

    await page.locator("#edit-qty").fill("0");
    await page.getByRole("button", { name: "저장" }).click();
    await expect(page.getByText(/수량은 0보다 커야 해요/)).toBeVisible();

    await page.locator("#edit-qty").fill("10");
    await page.getByRole("button", { name: "냉동", exact: true }).click();
    await page.locator("#edit-memo").fill("계란말이용");
    await page.getByRole("button", { name: "저장" }).click();

    await expect
      .poll(async () => await app.ingredient("계란"))
      .toMatchObject({ quantity: 10, storage: "freezer", memo: "계란말이용" });
    await expect(page.getByText("10개 남음")).toBeVisible();
  });
});
