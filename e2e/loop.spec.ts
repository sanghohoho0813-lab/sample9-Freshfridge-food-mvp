import type { Page } from "@playwright/test";
import { test, expect, open } from "./fixtures";

/** 리포트의 "아낀 금액" — 이번 달 먹어서 아낀 금액 (원) */
async function savedWon(page: Page) {
  await open(page, "/report");
  const text = await page.locator("dt", { hasText: "아낀 금액" }).locator("xpath=following-sibling::dd").innerText();
  return Number(text.replace(/[^0-9]/g, ""));
}

/**
 * 제품 루프 전체: 식재료 추가 → 요리 → 재고 차감 → 다 쓴 재료 장보기 → 구매 → 냉장고 넣기 → 리포트·기록
 * 데모 데이터에서 바나나는 냉장고에 없고 요거트는 1개만 남아 있다.
 */
test("식재료 추가부터 리포트까지, 한 번의 루프가 끊기지 않고 이어진다", async ({ page, app }) => {
  const savedBefore = await savedWon(page);

  // 1. 식재료 추가 — 자주 먹는 재료에서 고르면 보관 정보가 채워지고, 확인 후 저장된다
  await open(page, "/add");
  await page.getByRole("button", { name: "바나나", exact: true }).click();
  await expect(page.locator("#ing-name")).toHaveValue("바나나");
  await page.getByRole("button", { name: "바나나를 냉장고에 추가" }).click();
  await expect(page).toHaveURL(/\/fridge\?added=/);
  const banana = await app.ingredient("바나나");
  expect(banana).toMatchObject({ status: "available", quantity: 4 });

  // 2. 레시피 — 이제 재료가 모두 있으니 바로 만들 수 있다
  await open(page, "/recipes/recipe_banana_yogurt");
  await expect(page.getByText(/필요한 재료가 모두 냉장고에 있어요/)).toBeVisible();
  await page.getByRole("button", { name: "요리했어요" }).click();
  await expect(page.getByText("바나나 요거트볼 완성")).toBeVisible();

  // 3. 재고 차감 — 쓴 만큼 빠지고, 다 쓴 재료는 따로 알려준다
  await expect.poll(async () => (await app.ingredient("바나나"))?.quantity).toBe(3);
  expect((await app.ingredient("요거트"))?.quantity).toBe(0);
  const changes = page.getByRole("list", { name: "냉장고에서 뺀 재료" });
  await expect(changes.getByText("다 씀")).toHaveCount(1);
  await expect(changes.getByRole("listitem").filter({ hasText: "요거트" })).toContainText("다 씀");

  // 4. 다 쓴 재료를 장보기에 담는다
  const yogurt = page.getByRole("button", { name: "요거트", exact: true });
  if ((await yogurt.getAttribute("aria-pressed")) !== "true") await yogurt.click();
  await page.getByRole("button", { name: "1개 장보기에 담기" }).click();
  await expect(page.getByRole("link", { name: /장보기 보기/ })).toBeVisible();

  // 5. 장보기 — 왜 사는지 보이고, 구매 후 확인을 거쳐 냉장고에 들어간다
  await open(page, "/shopping");
  const toBuy = page.getByRole("list", { name: "살 것" });
  await expect(toBuy.getByText("‘바나나 요거트볼’에 다 써서 다시 사요")).toBeVisible();
  await page.getByRole("button", { name: "요거트 구매 완료" }).click();
  expect((await app.ingredient("요거트"))?.quantity).toBe(0);
  await page.getByRole("button", { name: "요거트 냉장고에 넣기" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "요거트를 냉장고에 넣을까요?" })).toBeVisible();
  await sheet.getByRole("button", { name: "냉장고에 넣기" }).click();
  await expect.poll(async () => (await app.ingredient("요거트"))?.quantity).toBeGreaterThan(0);
  expect((await app.state()).shopping.find((s) => s.name === "요거트")?.addedToFridge).toBe(true);

  // 6. 냉장고에 다시 보인다
  await open(page, "/fridge");
  await expect(page.getByRole("tabpanel").getByRole("link", { name: /^요거트/ })).toHaveCount(1);
  await expect(page.getByRole("tabpanel").getByRole("link", { name: /^바나나/ })).toHaveCount(1);

  // 7. 기록과 리포트에 반영된다
  await open(page, "/history");
  await expect(page.getByText("바나나 요거트볼").first()).toBeVisible();
  expect(await savedWon(page)).toBeGreaterThan(savedBefore);
});
