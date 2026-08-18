## 2026-08-16 - Sanitizing API Path Parameters
**Vulnerability:** External input passed directly as a path segment in API endpoint construction can lead to path traversal or URL path injection.
**Learning:** `CoinGeckoApiService.getCoinHistory` interpolated `coinId` directly into the path string `/coins/${coinId}/market_chart`.
**Prevention:** Always wrap path parameters in `encodeURIComponent()` prior to string interpolation in endpoint URLs.
