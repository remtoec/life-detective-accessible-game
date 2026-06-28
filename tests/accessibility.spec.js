const { test, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;

async function expectNoSeriousA11yViolations(page) {
  const results = await new AxeBuilder({ page }).analyze();
  const serious = results.violations.filter(({ impact }) =>
    ["serious", "critical"].includes(impact)
  );
  expect(serious).toEqual([]);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("首頁沒有嚴重或重大 axe 無障礙錯誤", async ({ page }) => {
  await expectNoSeriousA11yViolations(page);
});

test("遊戲畫面沒有嚴重或重大 axe 無障礙錯誤", async ({ page }) => {
  await page.getByRole("button", { name: "開始遊戲" }).click();
  await expectNoSeriousA11yViolations(page);
});

test("三種對比模式均沒有嚴重或重大 axe 無障礙錯誤", async ({ page }) => {
  for (const theme of ["白底黑字", "黑底白字", "黑底黃字"]) {
    await page.getByRole("radio", { name: theme }).check();
    await expectNoSeriousA11yViolations(page);
  }
});

