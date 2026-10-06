import { test, expect, open, isMobile } from "./fixtures";

test.describe("이동·예외 상황", () => {
  test.describe("없는 주소", () => {
    test.use({ allowConsoleErrors: [/404/] });
    test("404 안내 화면", async ({ page }) => {
      const res = await page.goto("/no-such-page");
      expect(res?.status()).toBe(404);
      await expect(page.getByRole("heading", { name: "페이지를 찾을 수 없어요" })).toBeVisible();
      await expect(page).toHaveTitle(/FreshFridge/);
    });
  });

  test("없는 재료·레시피 id 는 안내와 돌아갈 길을 준다", async ({ page }) => {
    await open(page, "/ingredient/nope");
    await expect(page.getByText("이 식재료를 찾을 수 없어요")).toBeVisible();
    await open(page, "/recipes/nope");
    await expect(page.getByText("레시피를 찾지 못했어요")).toBeVisible();
  });

  test("화면마다 고유한 문서 제목", async ({ page }) => {
    for (const [path, title] of [
      ["/", "FreshFridge"],
      ["/fridge", "내 냉장고"],
      ["/recipes/recipe_tofu_mushroom_jeongol", "버섯 두부전골"],
      ["/shopping", "장보기 리스트"],
      ["/report", "절약 리포트"],
    ] as const) {
      await open(page, path);
      await expect(page).toHaveTitle(new RegExp(title));
    }
  });

  test("헤더 알림 배지는 계산된 안 읽은 수를 보여주고, 알림을 누르면 해당 재료로 이동한다", async ({ page }) => {
    await open(page, "/");
    await expect(page.getByRole("link", { name: /알림.*\d+.*안 읽음/ })).toBeVisible();
    await open(page, "/notifications");
    await page.getByRole("link", { name: /우유의 유통기한이 내일이에요/ }).click();
    await expect(page).toHaveURL(/\/ingredient\//);
  });

  test("검색: 띄어쓰기 무시, 결과 없으면 이름을 채운 채 추가 화면으로", async ({ page }) => {
    await open(page, "/search");
    await page.getByRole("searchbox").fill("김치 볶음밥");
    await expect(page.getByRole("link", { name: /김치볶음밥/ })).toBeVisible();
    await page.getByRole("button", { name: "검색어 지우기" }).click();
    await page.getByRole("searchbox").fill("콜라비");
    await expect(page.getByText("‘콜라비’ 결과가 없어요")).toBeVisible();
    await page.getByRole("link", { name: "식재료 추가하기" }).click();
    await expect(page.locator("#ing-name")).toHaveValue("콜라비");
  });

  test("리포트 제안 → 해당 종류만 걸러진 냉장고", async ({ page }) => {
    await open(page, "/report");
    await page.getByRole("link", { name: /지금 먹어야 할/ }).click();
    await expect(page).toHaveURL(/category=vegetable/);
    await expect(page.getByRole("button", { name: /채소/, pressed: true })).toBeVisible();
  });

  test("냉장고 보관위치 탭", async ({ page }) => {
    await open(page, "/fridge");
    await page.getByRole("tab", { name: /냉동/ }).click();
    const rows = await page.locator("main ul li").allInnerTexts();
    expect(rows.length).toBeGreaterThan(0);
    for (const r of rows) expect(r).toContain("냉동");
  });

  test("모바일: 하단 탭에 없는 화면도 위치와 뒤로가기를 보여준다", async ({ page }) => {
    test.skip(!isMobile(page), "모바일 전용 UI");
    await open(page, "/shopping");
    await expect(page.getByRole("navigation", { name: "하단 메뉴" }).locator('[aria-current="page"]')).toContainText(
      "마이"
    );
    await expect(page.getByRole("button", { name: "뒤로", exact: true })).toBeVisible();
  });

  test("데모 초기화는 확인을 거치고, Esc 로 취소할 수 있다", async ({ page, app }) => {
    await open(page, "/");
    await page.getByRole("button", { name: "우유 먹었어요", exact: true }).click();
    await open(page, "/my");
    await page.getByRole("button", { name: "초기화" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByRole("alertdialog").getByRole("button", { name: "취소" })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    expect((await app.ingredient("우유"))?.quantity).toBe(0);

    await page.getByRole("button", { name: "초기화" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "초기화" }).click();
    await expect.poll(async () => (await app.ingredient("우유"))?.quantity).toBe(1);
  });

  test("빈 냉장고·빈 기록: 0 을 늘어놓지 않고 다음 행동 하나를 안내", async ({ page }) => {
    await open(page, "/");
    await page.evaluate((k) => {
      const s = JSON.parse(localStorage.getItem(k)!);
      s.ingredients = s.ingredients.map((i: object) => ({ ...i, status: "consumed", quantity: 0 }));
      s.logs = [];
      s.cooks = [];
      localStorage.setItem(k, JSON.stringify(s));
    }, "freshfridge_state_v2");
    await open(page, "/");
    await expect(page.getByText("냉장고가 비어 있어요")).toBeVisible();
    await expect(page.getByRole("link", { name: "첫 식재료 추가하기" })).toBeVisible();
    await open(page, "/report");
    await expect(page.getByText("아직 리포트에 쓸 기록이 없어요")).toBeVisible();
  });

  test("다른 탭에서 바꾼 내용이 이 탭에도 반영된다", async ({ page, context, app }) => {
    await open(page, "/fridge");
    const other = await context.newPage();
    await open(other, "/");
    await other.getByRole("button", { name: "우유 먹었어요", exact: true }).click();
    await expect(page.getByRole("link", { name: /^우유/ })).toHaveCount(0);
    expect((await app.ingredient("우유"))?.quantity).toBe(0);
    await other.close();
  });
});
