import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        # Use the port found in the logs (5175)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})

        try:
            await page.goto('http://localhost:5175', timeout=60000)
            print("Page loaded")

            # Wait for nodes to appear
            await page.wait_for_selector('circle', timeout=10000)

            # 1. Hover over the first node to show Tooltip with Sparkline
            circles = await page.query_selector_all('circle')
            if len(circles) > 0:
                await circles[0].hover()
                await asyncio.sleep(2) # Wait for tooltip animation
                await page.screenshot(path='tooltip_sparkline.png')
                print("Captured tooltip_sparkline.png")

            # 2. Click two nodes to show ComparisonPanel with Sparklines
            if len(circles) >= 2:
                # Clear selection first if any
                clear_btn = await page.query_selector('button:has-text("Clear Selection")')
                if clear_btn:
                    await clear_btn.click()

                await circles[0].click()
                await circles[1].click()
                await asyncio.sleep(2) # Wait for panel animation
                await page.screenshot(path='comparison_sparklines.png')
                print("Captured comparison_sparklines.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
