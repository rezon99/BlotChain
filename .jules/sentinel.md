## 2026-08-16 - Sanitizing API Path Parameters
**Vulnerability:** External input passed directly as a path segment in API endpoint construction can lead to path traversal or URL path injection.
**Learning:** `CoinGeckoApiService.getCoinHistory` interpolated `coinId` directly into the path string `/coins/${coinId}/market_chart`.
**Prevention:** Always wrap path parameters in `encodeURIComponent()` prior to string interpolation in endpoint URLs.

## 2026-08-19 - Restricting URL Protocols for Headless Browser Navigation
**Vulnerability:** Unvalidated target URLs passed to headless browser navigation (`page.goto(targetUrl)`) can expose SSRF or protocol injection (`javascript:`, `data:`, `gopher:`, etc.).
**Learning:** `captureSnapshot` accepted arbitrary target URL inputs or environment variable overrides without validating protocol schemes before Playwright execution.
**Prevention:** Parse target URLs using `new URL()` and explicitly enforce an allowlist of permitted protocols (`http:`, `https:`, `file:`) prior to browser navigation.
