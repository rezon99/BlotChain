import { chromium } from 'playwright';

export interface SnapshotResult {
  imageBuffer: Buffer;
  timestamp: string;
}

export async function captureSnapshot(url?: string): Promise<SnapshotResult> {
  const targetUrl = url || process.env.DASHBOARD_SNAPSHOT_URL || 'http://localhost:5173?snapshotMode=1';
  const timestamp = new Date().toISOString();

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
    });
    const page = await browser.newPage();
    await page.setViewportSize({ width: 800, height: 600 });

    await page.goto(targetUrl, {
      waitUntil: 'networkidle',
      timeout: 15000,
    });

    // Wait 2.5s delay for animation stability
    await page.waitForTimeout(2500);

    const screenshot = await page.screenshot({ type: 'png' });

    return {
      imageBuffer: screenshot,
      timestamp,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to capture dashboard snapshot for URL "${targetUrl}": ${message}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
  }
}
