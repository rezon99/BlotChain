import { chromium } from 'playwright';

export interface SnapshotResult {
  imageBuffer: Buffer;
  timestamp: string;
}

/**
 * Launches Playwright chromium headless, opens the target URL,
 * waits for network idle plus a 2.5s delay for breathing/particle animations to settle,
 * and takes a screenshot matching the Dashboard.tsx SVG viewport dimensions (800x600).
 *
 * @param url The target dashboard URL.
 */
export async function captureSnapshot(url: string): Promise<SnapshotResult> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set page viewport size to exactly 800x600 matching Dashboard.tsx SVG dimensions
    await page.setViewportSize({ width: 800, height: 600 });

    try {
      // Navigate to the provided URL (with a 15-second timeout) and wait for network idle
      await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Dashboard failed to load or timed out after 15 seconds: ${message}`);
    }

    // Wait for the breathing and particle animations to settle (fixed 2.5s delay)
    await page.waitForTimeout(2500);

    // Locate the main dashboard SVG element
    const svgElement = await page.$('svg');
    let imageBuffer: Buffer;

    if (svgElement) {
      // Takes screenshot matching the Dashboard.tsx SVG viewport dimensions exactly
      imageBuffer = await svgElement.screenshot();
    } else {
      // Fallback to page-level screenshot if SVG is not present
      imageBuffer = await page.screenshot();
    }

    return {
      imageBuffer,
      timestamp: new Date().toISOString()
    };
  } finally {
    await browser.close();
  }
}
