import { test, expect } from '@playwright/test';

test.describe('MarketVision E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173/MarketVision/');
  });

  test('ページが正しく読み込まれること', async ({ page }) => {
    // タイトル確認
    await expect(page.locator('h1')).toContainText('MarketVision');
    
    // 銘柄選択ボタン確認
    await expect(page.getByRole('button', { name: /東京電力HD/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /中部電力/ })).toBeVisible();
  });

  test('銘柄切り替えが動作すること', async ({ page }) => {
    // 東京電力HDをクリック
    await page.getByRole('button', { name: /東京電力HD/ }).click();
    await expect(page.getByRole('button', { name: /東京電力HD/ })).toHaveClass(/neon-border/);
    
    // 中部電力をクリック
    await page.getByRole('button', { name: /中部電力/ }).click();
    await expect(page.getByRole('button', { name: /中部電力/ })).toHaveClass(/neon-border/);
  });

  test('期間フィルタが動作すること', async ({ page }) => {
    const periods = ['1M', '3M', '6M', '1Y', '3Y', '5Y'];
    
    for (const period of periods) {
      await page.getByRole('button', { name: period, exact: true }).click();
      await expect(page.getByRole('button', { name: period, exact: true })).toHaveClass(/border-neon-green/);
    }
  });

  test('テクニカル指標パネルが表示されること', async ({ page }) => {
    await expect(page.locator('text=テクニカル指標')).toBeVisible();
    await expect(page.getByText('SMA5 (短期)')).toBeVisible();
    await expect(page.getByText('SMA25 (中期)')).toBeVisible();
    await expect(page.getByRole('button', { name: /RSI/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /MACD/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /ボリンジャーバンド/ })).toBeVisible();
  });

  test('RSI指標のトグルが動作すること', async ({ page }) => {
    // RSIボタンをクリック
    await page.getByRole('button', { name: /RSI/ }).click();
    
    // RSIチャートが表示される
    await expect(page.locator('text=RSI (14日) - 相対力指数')).toBeVisible();
    
    // 再度クリックすると非表示
    await page.getByRole('button', { name: /RSI/ }).click();
    await expect(page.locator('text=RSI (14日) - 相対力指数')).not.toBeVisible();
  });

  test('MACDチャートのトグルが動作すること', async ({ page }) => {
    // MACDボタンをクリック
    await page.getByRole('button', { name: /MACD/ }).click();
    
    // MACDチャートが表示される
    await expect(page.locator('text=MACD (12, 26, 9) - 移動平均収束拡散法')).toBeVisible();
    
    // 再度クリックすると非表示
    await page.getByRole('button', { name: /MACD/ }).click();
    await expect(page.locator('text=MACD (12, 26, 9) - 移動平均収束拡散法')).not.toBeVisible();
  });

  test('ローソク足チャートが表示されること', async ({ page }) => {
    // チャートコンテナが表示されているか（最初の1つを確認）
    await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    
    // ローソク足レイヤーが存在するか確認（内部に要素がなくてもgタグは存在する）
    const candlesticks = page.locator('.candlesticks');
    await expect(candlesticks).toHaveCount(1);
  });

  test('フッターが表示されること', async ({ page }) => {
    await expect(page.locator('footer')).toContainText('MarketVision');
    await expect(page.locator('footer')).toContainText('Data provided by Stooq');
  });
});
