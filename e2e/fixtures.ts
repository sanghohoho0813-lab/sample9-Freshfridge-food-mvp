import { test as base, expect, type Page } from "@playwright/test";

export const STORAGE_KEY = "freshfridge_state_v2";

type AppState = {
  ingredients: { id: string; name: string; quantity: number; status: string; storage: string; memo?: string }[];
  logs: { type: string; amount?: number; price: number; reason?: string; cookId?: string; ingredientName: string }[];
  shopping: { id: string; name: string; checked: boolean; addedToFridge?: boolean }[];
  cooks: { id: string; recipeName: string; rescuedCount: number }[];
};

/**
 * 모든 테스트 공통:
 * - 콘솔 오류·페이지 오류가 하나라도 나면 실패
 * - 저장된 앱 상태를 읽는 helper
 */
export const test = base.extend<{
  app: {
    state: () => Promise<AppState>;
    ingredient: (name: string) => Promise<AppState["ingredients"][number] | undefined>;
  };
  allowConsoleErrors: RegExp[];
}>({
  allowConsoleErrors: [[], { option: true }],
  page: async ({ page, allowConsoleErrors }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(`pageerror: ${e.message}`));
    page.on("console", (m) => {
      if (m.type() !== "error") return;
      const text = m.text();
      if (allowConsoleErrors.some((r) => r.test(text))) return;
      errors.push(`console: ${text}`);
    });
    await use(page);
    expect(errors, "브라우저 콘솔 오류").toEqual([]);
  },
  app: async ({ page }, use) => {
    const state = () =>
      page.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), STORAGE_KEY) as Promise<AppState>;
    await use({
      state,
      ingredient: async (name) =>
        (await state()).ingredients.find(
          (i) => i.name === name && i.status !== "consumed" && i.status !== "discarded"
        ) ?? (await state()).ingredients.find((i) => i.name === name),
    });
  },
});

export { expect };

/** 페이지로 이동하고 저장 데이터를 불러올 때까지 기다린다 */
export async function open(page: Page, path: string) {
  await page.goto(path);
  await page.waitForFunction((k) => !!localStorage.getItem(k), STORAGE_KEY);
  await expect(page.locator(".skeleton")).toHaveCount(0);
}

export const isMobile = (page: Page) => (page.viewportSize()?.width ?? 1280) < 1024;
