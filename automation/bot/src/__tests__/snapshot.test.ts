import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import { captureSnapshot } from '../snapshot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('captureSnapshot', () => {
  test('successfully takes a screenshot of the local SVG fixture', async () => {
    let fixturePath = path.resolve(__dirname, 'fixtures', 'dashboard-mock.html');

    // Fallback if running from dist/ directory
    if (!fs.existsSync(fixturePath)) {
      fixturePath = path.resolve(__dirname, '..', '..', 'src', '__tests__', 'fixtures', 'dashboard-mock.html');
    }

    const fixtureUrl = `file://${fixturePath}`;

    // Capture snapshot using our implementation
    const result = await captureSnapshot(fixtureUrl);

    // Verify properties of the returned object
    expect(result).toBeDefined();
    expect(result.imageBuffer).toBeInstanceOf(Buffer);
    expect(result.imageBuffer.length).toBeGreaterThan(0);
    expect(result.timestamp).toBeDefined();

    // Verify timestamp is a valid ISO string
    const parsedDate = Date.parse(result.timestamp);
    expect(isNaN(parsedDate)).toBe(false);
  }, 30000); // 30 seconds timeout
});
