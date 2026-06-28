const { test, expect } = require("@playwright/test");

const correctAnswers = [
  "麻雀",
  "榕樹",
  "牠們都有生命",
  "石頭",
  "空氣和水",
  "製造養分",
  "麻雀",
  "榕樹",
  "很多動物能夠自己移動",
  "眼、嘴和腳",
  "根固定植物，並吸收水分",
  "安靜觀察，不捕捉蝴蝶，也不採花"
];

async function startGame(page) {
  await page.getByRole("button", { name: "開始遊戲" }).click();
}

async function answerCurrentQuestion(page, answer) {
  await page.getByRole("radio", { name: answer, exact: true }).check();
  await page.getByRole("button", { name: "提交答案" }).click();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test("首頁提供遊戲介紹、學習目標和開始按鈕", async ({ page }) => {
  await expect(page).toHaveTitle("生命小偵探｜無障礙生物遊戲");
  await expect(
    page.getByRole("heading", { level: 1, name: "生命小偵探" })
  ).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByText("你會學到")).toBeVisible();
  await expect(page.getByRole("button", { name: "開始遊戲" })).toBeVisible();
});

test("首次答錯不加分，提示後重試亦不補分", async ({ page }) => {
  await startGame(page);

  await answerCurrentQuestion(page, "石頭");
  await expect(page.getByRole("status")).toContainText("答錯了");
  await expect(page.getByText("目前得分：0 分，共 12 分")).toBeVisible();
  await expect(page.getByRole("status")).toBeFocused();
  await expect(page.getByRole("button", { name: "再試一次" })).toBeVisible();

  await page.getByRole("button", { name: "再試一次" }).click();
  await answerCurrentQuestion(page, "麻雀");
  await expect(page.getByRole("status")).toContainText("答對了");
  await expect(page.getByText("目前得分：0 分，共 12 分")).toBeVisible();
  await expect(page.getByRole("button", { name: "下一關" })).toBeFocused();
});

test("首次答對即時加一分並可進入下一關", async ({ page }) => {
  await startGame(page);
  await answerCurrentQuestion(page, "麻雀");

  await expect(page.getByText("目前得分：1 分，共 12 分")).toBeVisible();
  await page.getByRole("button", { name: "下一關" }).click();
  await expect(
    page.getByRole("heading", { level: 2, name: "第 2 關，共 12 關" })
  ).toBeFocused();
});

test("完成十二關後顯示滿分結果和學習重點", async ({ page }) => {
  await startGame(page);

  for (let index = 0; index < correctAnswers.length; index += 1) {
    await answerCurrentQuestion(page, correctAnswers[index]);
    const actionName =
      index === correctAnswers.length - 1 ? "查看結果" : "下一關";
    await page.getByRole("button", { name: actionName }).click();
  }

  await expect(
    page.getByRole("heading", { level: 2, name: "闖關完成！" })
  ).toBeFocused();
  await expect(page.getByText("你的得分是 12 分，共 12 分")).toBeVisible();
  await expect(page.getByText("動物和植物都有生命")).toBeVisible();
  await expect(page.getByRole("button", { name: "重新挑戰" })).toBeVisible();
});

test("字型與對比設定會保存，但遊戲進度不會保存", async ({ page }) => {
  await page.getByRole("radio", { name: "特大字型" }).check();
  await page.getByRole("radio", { name: "黑底黃字" }).check();
  await startGame(page);
  await answerCurrentQuestion(page, "麻雀");
  await page.reload();

  await expect(page.getByRole("radio", { name: "特大字型" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "黑底黃字" })).toBeChecked();
  await expect(page.getByRole("button", { name: "開始遊戲" })).toBeVisible();
  await expect(page.locator("html")).toHaveClass(/font-xlarge/);
  await expect(page.locator("html")).toHaveClass(/theme-yellow/);
});

test("可用鍵盤選答和提交", async ({ page }) => {
  await page.getByRole("button", { name: "開始遊戲" }).focus();
  await page.keyboard.press("Enter");
  const firstAnswer = page.getByRole("radio", { name: "麻雀", exact: true });
  await firstAnswer.focus();
  await page.keyboard.press("Space");
  await expect(firstAnswer).toBeChecked();
  await page.getByRole("button", { name: "提交答案" }).focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: "下一關" })).toBeFocused();
});

test("窄螢幕和放大字型不會造成水平捲動", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole("radio", { name: "特大字型" }).check();
  await startGame(page);

  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByRole("button", { name: "提交答案" })).toBeVisible();
});

test("寬螢幕的主要內容保持可閱讀行寬", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const mainWidth = await page.locator("main").evaluate(
    (element) => element.getBoundingClientRect().width
  );
  expect(mainWidth).toBeLessThanOrEqual(1120);
});
