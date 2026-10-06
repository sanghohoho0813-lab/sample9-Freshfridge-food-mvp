import { test, expect, open } from "./fixtures";

test("레시피 → 요리했어요 → 재고 차감 → 다 쓴 재료 장보기 → 기록·리포트 반영", async ({ page, app }) => {
  await open(page, "/recipes/recipe_tofu_mushroom_jeongol");
  await expect(page.getByText("냉장고 1모 · D-1 먼저 쓰기")).toBeVisible();

  const before = await app.state();
  await page.getByRole("button", { name: "요리했어요" }).click();
  await expect(page.getByText("맛있게 드세요!")).toBeVisible();

  const s = await app.state();
  expect(s.cooks.length).toBe(before.cooks.length + 1);
  expect(s.cooks[0]).toMatchObject({ recipeName: "버섯 두부전골", rescuedCount: 2 });
  // 같은 요리의 기록은 cookId 로 묶인다 — 두부·새송이버섯·대파·청양고추
  expect(
    s.logs
      .filter((l) => l.cookId === s.cooks[0].id)
      .map((l) => l.ingredientName)
      .sort()
  ).toEqual(["대파", "두부", "새송이버섯", "청양고추"].sort());
  expect((await app.ingredient("대파"))?.quantity).toBe(0.5);

  await page.getByRole("button", { name: "다 쓴 재료 장보기에 담기" }).click();
  await expect
    .poll(async () => (await app.state()).shopping.filter((x) => !x.checked).map((x) => x.name))
    .toEqual(expect.arrayContaining(["두부", "새송이버섯"]));
  await expect(page.getByRole("link", { name: /남은 급한 재료 \d+개 보기/ })).toBeVisible();

  await open(page, "/history");
  await expect(page.getByText("두부 1모 · 새송이버섯 2개 · 대파 0.5단")).toBeVisible();

  await open(page, "/recipes");
  await expect(page.getByText(/오늘 만듦/).first()).toBeVisible();

  await page.reload();
  await expect.poll(async () => (await app.state()).cooks.length).toBe(before.cooks.length + 1);
});

test("없는 재료는 바로 장보기에 담고, 담긴 상태로 바뀐다", async ({ page, app }) => {
  await open(page, "/");
  // 우유를 다 먹어 프렌치토스트에 없는 재료를 만든다
  await page.getByRole("button", { name: "우유 먹었어요", exact: true }).click();
  await open(page, "/recipes/recipe_french_toast");
  await page.getByRole("button", { name: "우유 장보기에 담기" }).click();
  await expect(page.getByRole("link", { name: "담았어요" })).toBeVisible();
  expect((await app.state()).shopping.some((s) => s.name === "우유" && !s.checked)).toBe(true);
});
