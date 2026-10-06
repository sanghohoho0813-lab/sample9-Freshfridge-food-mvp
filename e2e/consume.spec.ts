import { test, expect, open } from "./fixtures";

test.describe("먹었어요 · 버렸어요", () => {
  test("홈: 오늘 먹을 재료를 이름으로 안내하고, 1회분은 바로 기록 → 되돌리기", async ({ page, app }) => {
    await open(page, "/");
    await expect(page.getByText("오늘은 우유와 두부를 먼저 먹어주세요.")).toBeVisible();

    const logsBefore = (await app.state()).logs.length;
    await page.getByRole("button", { name: "우유 먹었어요", exact: true }).click();
    await expect.poll(async () => (await app.ingredient("우유"))?.quantity).toBe(0);

    await page.getByRole("button", { name: "되돌리기" }).click();
    await expect.poll(async () => (await app.ingredient("우유"))?.quantity).toBe(1);
    expect((await app.state()).logs.length).toBe(logsBefore);
  });

  test("여러 개 남은 재료는 수량을 골라 일부만 기록하고, 금액도 비례로 남긴다", async ({ page, app }) => {
    await open(page, "/");
    const egg = await app.ingredient("계란");
    await open(page, `/ingredient/${egg!.id}`);

    await page.getByRole("button", { name: "먹었어요" }).first().click();
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await sheet.getByRole("button", { name: /^먹었어요 · 1개$/ }).click();

    await expect.poll(async () => (await app.ingredient("계란"))?.quantity).toBe(7);
    const log = (await app.state()).logs[0];
    expect(log.amount).toBe(1);
    expect(log.price).toBeGreaterThan(0);
    expect(log.price).toBeLessThan(6500);
    await expect(page.getByRole("main").getByText(/^7개 남음 ·/)).toBeVisible();
  });

  test("버렸어요: 사유를 남기고, 다 정리하면 다음 행동을 제시한다", async ({ page, app }) => {
    await open(page, "/");
    const lettuce = await app.ingredient("상추");
    await open(page, `/ingredient/${lettuce!.id}`);

    await page.getByRole("button", { name: "버렸어요" }).first().click();
    await page.getByRole("button", { name: "보관 실패" }).click();
    await page.getByRole("button", { name: /^버렸어요 · / }).click();

    await expect.poll(async () => (await app.state()).logs[0]?.reason).toBe("보관 실패");
    await expect(page.getByText("상추, 정리했어요")).toBeVisible();
    await expect(page.getByRole("link", { name: /다음으로 먹을 재료 보기/ })).toBeVisible();
  });

  test("시트: 포커스를 안에 가두고, Esc 로 닫으면 연 버튼으로 돌아간다. 열려 있는 동안 공용 내비는 숨김", async ({
    page,
  }) => {
    await open(page, "/");
    const trigger = page.getByRole("button", { name: "새송이버섯 먹었어요", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    // Tab 을 여러 번 눌러도 시트 밖으로 나가지 않는다
    for (let i = 0; i < 8; i++) await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
    const navHidden = () =>
      page.evaluate(() => {
        const h = document.querySelector("[data-mirae-history-nav]");
        return !h || getComputedStyle(h).display === "none";
      });
    expect(await navHidden()).toBe(true);
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    expect(await navHidden()).toBe(false);
  });
});
