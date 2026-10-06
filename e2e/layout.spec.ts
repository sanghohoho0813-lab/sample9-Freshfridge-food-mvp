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
const WIDTHS = [360, 390, 430, 768, 1024, 1440];

// 화면 폭마다 가로 넘침·한 글자씩 세로로 쌓이는 한국어·말줄임으로 잘린 텍스트가 없는지
test.describe("반응형 레이아웃", () => {
  for (const width of WIDTHS) {
    test(`${width}px`, async ({ page }) => {
      test.skip(test.info().project.name !== "desktop", "폭을 직접 바꿔 가며 한 프로젝트에서만 검사");
      await page.setViewportSize({ width, height: 860 });
      for (const path of PAGES) {
        await open(page, path);
        const problems = await page.evaluate(() => {
          const out: string[] = [];
          const over = document.documentElement.scrollWidth - document.documentElement.clientWidth;
          if (over > 0) out.push(`가로 넘침 +${over}px`);
          for (const el of document.querySelectorAll<HTMLElement>(".truncate")) {
            if (el.offsetParent && el.scrollWidth > el.clientWidth + 1)
              out.push(`잘림: ${el.textContent?.trim().slice(0, 20)}`);
          }
          for (const el of document.querySelectorAll<HTMLElement>("p,span,h1,h2,h3,button,a")) {
            const t = el.textContent?.trim() ?? "";
            if (t.length < 3 || el.children.length > 0) continue;
            const r = el.getBoundingClientRect();
            const lh = parseFloat(getComputedStyle(el).lineHeight) || 20;
            if (r.width > 0 && r.width < lh * 1.6 && r.height > lh * 2.5) out.push(`세로 글자: ${t.slice(0, 12)}`);
          }
          return out;
        });
        expect(problems, `${path} @ ${width}px`).toEqual([]);
      }
    });
  }
});

test("로고마크: 화면에 보이는 로고의 배경 그라디언트가 같은 SVG 안에서 정의된다 (id 중복 회귀 방지)", async ({
  page,
}) => {
  await open(page, "/");
  const ok = await page.evaluate(() =>
    [...document.querySelectorAll("svg")]
      .filter((svg) => svg.querySelector("linearGradient") && svg.getBoundingClientRect().width > 0)
      .every((svg) => {
        const id = svg.querySelector("linearGradient")!.id;
        const ids = [...document.querySelectorAll(`[id="${id}"]`)];
        return ids.length === 1 && svg.contains(ids[0]);
      })
  );
  expect(ok).toBe(true);
});
