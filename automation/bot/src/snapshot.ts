import { chromium } from 'playwright';

export interface SnapshotResult {
  imageBuffer: Buffer;
  timestamp: string;
}

/**
 * Launches Playwright chromium headless, opens the target URL with snapshotMode=1,
 * waits for network idle plus a 2.5s delay for breathing/particle animations to settle,
 * and takes a screenshot matching the Dashboard.tsx SVG viewport dimensions.
 *
 * @param url The target dashboard URL.
 */
export async function captureSnapshot(url: string): Promise<SnapshotResult> {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Ensure snapshotMode=1 is present in the URL
    let targetUrl = url;
    if (!targetUrl.includes('snapshotMode=1')) {
      const separator = targetUrl.includes('?') ? '&' : '?';
      targetUrl = `${targetUrl}${separator}snapshotMode=1`;
    }

    // Navigate and wait for network idle
    await page.goto(targetUrl, { waitUntil: 'networkidle' });

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
