import AxeBuilder from "@axe-core/playwright";
import { test, expect, open } from "./fixtures";

const PAGES = [
  "/",
  "/fridge",
  "/priority",
  "/recipes",
  "/recipes/recipe_tofu_mushroom_jeongol",
  "/add",
  "/shopping",
  "/history",
  "/report",
  "/search",
  "/notifications",
  "/my",
];

// axe-core 로 WCAG 2.1 A/AA 자동 점검 (대비·라벨·랜드마크·ARIA 사용 등)
test.describe("접근성 자동 점검", () => {
  for (const path of PAGES) {
    test(path, async ({ page }) => {
      await open(page, path);
      const { violations } = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        // 공용 뒤로·앞으로 버튼은 외부(미래AI랩 공통) 스크립트라 검사 대상에서 뺀다
        .exclude("[data-mirae-history-nav]")
        .analyze();
      const summary = violations.map(
        (v) =>
          `${v.id} (${v.impact}): ${v.nodes
            .map((n) => n.target.join(" "))
            .slice(0, 3)
            .join(" | ")}`
      );
      expect(summary, path).toEqual([]);
    });
  }

  test("키보드: 첫 Tab 에 '본문으로 건너뛰기'", async ({ page }) => {
    await open(page, "/");
    await page.keyboard.press("Tab");
    const skip = page.getByRole("link", { name: "본문으로 건너뛰기" });
    await expect(skip).toBeFocused();
    await skip.press("Enter");
    await expect(page.locator("#main")).toBeFocused();
  });
});
