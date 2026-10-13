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

  test("이미 있는 재료: 따로 추가 / 기존 것에 더하기 결과를 보여주고, 더하면 수량만 늘고 기한은 그대로", async ({
    page,
    app,
  }) => {
    await open(page, "/add");
    const milk = await app.ingredient("우유");
    const count = (await app.state()).ingredients.length;
    await page.locator("#ing-name").fill("우유");

    const choice = page.getByRole("group", { name: "이미 있는 재료를 어떻게 넣을까요" });
    await expect(choice.getByText(/냉장고에 이미 우유 1팩이 있어요/)).toBeVisible();
    // 기본은 따로 추가 — 사용자가 고르기 전에 기존 재료를 바꾸지 않는다
    await expect(choice.getByRole("radio", { name: /따로 추가/ })).toBeChecked();
    await choice.getByRole("radio", { name: /기존 것에 더하기/ }).check();
    await expect(choice.getByText(/1팩 → 2팩이 되고, 기한은 .+ 그대로예요/)).toBeVisible();

    await page.getByRole("button", { name: "기존 우유에 더하기" }).click();
    await expect(page).toHaveURL(/\/fridge/);
    const after = await app.ingredient("우유");
    expect(after).toMatchObject({ id: milk!.id, quantity: 2 });
    expect((await app.state()).ingredients.length).toBe(count);
  });

  test("모르는 재료는 유통기한을 대신 정하지 않는다", async ({ page, app }) => {
    await open(page, "/add");
    const count = (await app.state()).ingredients.length;
    await page.locator("#ing-name").fill("콜라비");
    await page.getByRole("button", { name: /냉장고에 추가$/ }).click();
    await expect(page.getByText("유통기한을 골라주세요. 모르면 '모름'을 눌러주세요.")).toBeVisible();
    expect((await app.state()).ingredients.length).toBe(count);

    await page.getByRole("button", { name: "모름", exact: true }).click();
    await page.getByRole("button", { name: /냉장고에 추가$/ }).click();
    await expect(page).toHaveURL(/\/fridge/);
    expect(((await app.ingredient("콜라비")) as { expiresAt?: string | null })?.expiresAt).toBeNull();
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
