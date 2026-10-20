import { test, expect, open, isMobile } from "./fixtures";

test.describe("화면 사용성", () => {
  test("냉장고: 기한 구간 칩으로 바로 이동하고, 지금 보는 구간이 표시된다", async ({ page }) => {
    await open(page, "/fridge");
    const nav = page.getByRole("navigation", { name: "기한 구간으로 이동" });
    await expect(nav.getByRole("button", { name: /^오늘·내일/ })).toHaveAttribute("aria-current", "true");

    await nav.getByRole("button", { name: /^여유 있어요/ }).click();
    await expect(page.getByRole("heading", { name: /^여유 있어요/ })).toBeInViewport();
    await expect(nav.getByRole("button", { name: /^여유 있어요/ })).toHaveAttribute("aria-current", "true");
    // 칩 줄은 스크롤해도 화면 위에 남아 있다
    await expect(nav).toBeInViewport();
  });

  test("재료 상세: 산 날부터 기한까지 얼마나 지났는지 보여준다", async ({ page, app }) => {
    await open(page, "/");
    const tofu = await app.ingredient("두부");
    await open(page, `/ingredient/${tofu!.id}`);
    const fresh = page.getByRole("region", { name: "신선도" });
    await expect(fresh.getByText(/^산 지 \d+일째 · 기한까지 1일 남았어요$/)).toBeVisible();
    await expect(fresh.getByText(/구매$/)).toBeVisible();
  });

  test("레시피 상세: 조리 단계를 눌러 끝낸 것을 표시하고, 다 끝내면 요리했어요를 안내한다", async ({ page }) => {
    await open(page, "/recipes/recipe_tofu_mushroom_jeongol");
    const steps = page.getByRole("region", { name: "조리방법" }).getByRole("button");
    await expect(steps).toHaveCount(4);
    await steps.nth(0).click();
    await expect(steps.nth(0)).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("1/4 단계 끝")).toBeVisible();
    await steps.nth(0).click();
    await expect(steps.nth(0)).toHaveAttribute("aria-pressed", "false");

    for (let i = 0; i < 4; i++) await steps.nth(i).click();
    await expect(page.getByText("4/4 단계 끝")).toBeVisible();
    await expect(page.getByText(/모든 단계를 끝냈어요/)).toBeVisible();
  });

  test("검색: 이름에서 검색어와 맞는 부분을 표시한다 (띄어쓰기 무시)", async ({ page }) => {
    await open(page, "/search");
    await page.getByRole("searchbox").fill("두부 전골");
    await expect(page.locator("mark", { hasText: "두부전골" })).toBeVisible();
  });

  test("장보기: 몇 개 샀는지 진행 상황이 바로 바뀐다", async ({ page }) => {
    await open(page, "/shopping");
    await expect(page.getByText("3개 중 1개 샀어요")).toBeVisible();
    await page.getByRole("button", { name: "양배추 구매 완료" }).click();
    await expect(page.getByText("3개 중 2개 샀어요")).toBeVisible();
    // 산 것이 2개 이상이면 한 번에 차례로 넣을 수 있다 (모바일은 화면 아래 고정)
    const putAway = page.getByRole("button", { name: /산 것 2개 차례로 냉장고에 넣기/ });
    await expect(putAway).toBeVisible();
    if (isMobile(page)) await expect(putAway).toBeInViewport();
  });

  test("데스크톱 사이드바: 급한 재료·살 것 개수를 메뉴 옆에 보여준다", async ({ page }) => {
    test.skip(isMobile(page), "데스크톱 전용 UI");
    await open(page, "/");
    const menu = page.getByRole("navigation", { name: "주 메뉴" });
    await expect(menu.getByRole("link", { name: /우선소비.*급한 재료 6개/ })).toBeVisible();
    await expect(menu.getByRole("link", { name: /장보기 리스트.*살 것 2개/ })).toBeVisible();
  });
});
