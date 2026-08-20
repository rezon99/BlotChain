import { describe, it, expect } from '@jest/globals';
import path from 'path';
import { pathToFileURL } from 'url';
import { captureSnapshot } from '../src/snapshot.js';

describe('captureSnapshot', () => {
  it('should take a snapshot from a local static HTML fixture', async () => {
    const fixturePath = path.resolve(process.cwd(), 'test/fixtures/dashboard.html');
    const fileUrl = pathToFileURL(fixturePath).href;

    const result = await captureSnapshot(fileUrl);

    expect(result).toBeDefined();
    expect(Buffer.isBuffer(result.imageBuffer)).toBe(true);
    expect(result.imageBuffer.length).toBeGreaterThan(0);
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp).getTime()).not.toBeNaN();
  }, 30000);

  it('should throw a clear error when page fails to load or times out', async () => {
    // Port 1 is blocked/unreachable and will fail or timeout immediately
    const invalidUrl = 'http://127.0.0.1:1';

    await expect(captureSnapshot(invalidUrl)).rejects.toThrow(
      /Failed to capture dashboard snapshot for URL/
    );
  }, 30000);

  it('should reject invalid URL strings and dangerous schemes', async () => {
    await expect(captureSnapshot('javascript:alert(1)')).rejects.toThrow(
      /Unsupported scheme "javascript:"/
    );
    await expect(captureSnapshot('data:text/html,<h1>test</h1>')).rejects.toThrow(
      /Unsupported scheme "data:"/
    );
    await expect(captureSnapshot('not_a_valid_url')).rejects.toThrow(
      /Invalid URL format/
    );
  });
});
