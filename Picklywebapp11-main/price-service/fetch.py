import asyncio
import logging
import time
from typing import Any

import httpx
from playwright.async_api import Browser, Playwright, async_playwright

logger = logging.getLogger(__name__)

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

_playwright: Playwright | None = None
_browser: Browser | None = None
_http_client: httpx.AsyncClient | None = None
browser_ready = False


async def startup() -> None:
    global _playwright, _browser, _http_client, browser_ready

    if _http_client is None:
        _http_client = httpx.AsyncClient(timeout=10.0, headers=DEFAULT_HEADERS, follow_redirects=True)

    if _browser is None:
        _playwright = await async_playwright().start()
        _browser = await _playwright.chromium.launch(
            headless=True,
            args=[
                "--no-sandbox",
                "--disable-dev-shm-usage",
                "--disable-gpu",
            ],
        )
        browser_ready = True
        logger.info("browser pool initialized")


async def shutdown() -> None:
    global _playwright, _browser, _http_client, browser_ready

    browser_ready = False
    if _browser is not None:
        await _browser.close()
        _browser = None
    if _playwright is not None:
        await _playwright.stop()
        _playwright = None
    if _http_client is not None:
        await _http_client.aclose()
        _http_client = None


async def get_browser() -> Browser:
    if _browser is None:
        await startup()
    if _browser is None:
        raise RuntimeError("browser failed to initialize")
    return _browser


async def get_http_client() -> httpx.AsyncClient:
    if _http_client is None:
        await startup()
    if _http_client is None:
        raise RuntimeError("http client failed to initialize")
    return _http_client


def _html_from_scrapling_page(page: Any) -> str:
    for attr in ("html", "content", "body"):
        value = getattr(page, attr, None)
        if isinstance(value, str):
            return value
        if callable(value):
            resolved = value()
            if isinstance(resolved, str):
                return resolved
    return str(page)


def _fetch_with_scrapling(url: str) -> str:
    from scrapling.fetchers import Fetcher, StealthyFetcher

    try:
        page = Fetcher.get(url, headers=DEFAULT_HEADERS, timeout=10)
    except Exception:
        page = StealthyFetcher.fetch(url, headless=True, timeout=10)
    return _html_from_scrapling_page(page)


async def _fetch_with_stealthy_async(url: str) -> str:
    """Use Scrapling's StealthyFetcher (patchright-powered, evades bot detection).
    Required for sites that return 403 to standard Playwright (e.g. Watsons)."""
    from scrapling.fetchers import StealthyFetcher

    page = await StealthyFetcher.async_fetch(url, headless=True, timeout=10)
    return _html_from_scrapling_page(page)


async def fetch_dom(
    url: str,
    *,
    extractor_js: str,
    max_wait_ms: int = 12000,
    poll_interval_ms: int = 500,
) -> list[dict]:
    """Render the page in the shared Chromium browser and poll a JS extractor
    until it returns a non-empty list of objects (or the deadline elapses).

    Use this for SPA retailers (e.g. Gratis, Rossmann) whose product cards are
    rendered client-side via Alpine/Vue/etc. The extractor JS must be an
    IIFE-style function returning an array of plain objects.
    """
    shared_browser = await get_browser()
    context = await shared_browser.new_context(
        user_agent=DEFAULT_HEADERS["User-Agent"],
        locale="tr-TR",
        extra_http_headers={key: value for key, value in DEFAULT_HEADERS.items() if key != "User-Agent"},
    )
    try:
        page = await context.new_page()
        await page.goto(url, wait_until="domcontentloaded", timeout=15_000)

        deadline = time.monotonic() + max_wait_ms / 1000
        last_result: list[dict] = []
        while True:
            try:
                result = await page.evaluate(extractor_js)
            except Exception as exc:
                logger.debug("fetch_dom evaluate error url=%s: %s", url, exc)
                result = []
            if isinstance(result, list) and result:
                return result
            last_result = result if isinstance(result, list) else last_result
            if time.monotonic() >= deadline:
                return last_result
            await page.wait_for_timeout(poll_interval_ms)
    finally:
        await context.close()


async def fetch_html(url: str, *, browser: bool = False, stealth: bool = False) -> str:
    if stealth:
        try:
            return await _fetch_with_stealthy_async(url)
        except Exception as exc:
            logger.warning("stealthy fetch failed url=%s error=%s", url, exc)
            raise

    if browser:
        shared_browser = await get_browser()
        context = await shared_browser.new_context(
            user_agent=DEFAULT_HEADERS["User-Agent"],
            locale="tr-TR",
            extra_http_headers={key: value for key, value in DEFAULT_HEADERS.items() if key != "User-Agent"},
        )
        try:
            page = await context.new_page()
            await page.goto(url, wait_until="domcontentloaded", timeout=10_000)
            try:
                await page.wait_for_load_state("networkidle", timeout=3_000)
            except Exception:
                pass
            return await page.content()
        finally:
            await context.close()

    try:
        return await asyncio.to_thread(_fetch_with_scrapling, url)
    except Exception as exc:
        logger.info("scrapling HTTP fetch failed, falling back to httpx: %s", exc)
        client = await get_http_client()
        response = await client.get(url)
        response.raise_for_status()
        return response.text
