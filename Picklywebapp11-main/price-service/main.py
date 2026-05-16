import asyncio
import logging
import sys
import time
from contextlib import asynccontextmanager
from typing import Awaitable, Callable
from uuid import uuid4

# Windows + Python 3.12 + Playwright: the default SelectorEventLoop on Windows
# does NOT implement subprocess_exec, which Playwright (and Scrapling's
# StealthyFetcher) need to spawn the browser. We must install the Proactor
# policy BEFORE uvicorn creates its event loop, i.e. at import time.
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

from fastapi import FastAPI, Response

import fetch
import matcher
from models import MatchedListing, PriceSearchRequest, RawCandidate
from scrapers import akakce, eve, gratis, rossmann, sephora, trendyol, watsons

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s %(message)s")
logger = logging.getLogger("price-service")

ScraperFn = Callable[[str, str], Awaitable[list[RawCandidate]]]

SCRAPERS: list[tuple[str, ScraperFn]] = [
    ("akakce", akakce.search),
    ("trendyol", trendyol.search),
    ("gratis", gratis.search),
    ("rossmann", rossmann.search),
    ("watsons", watsons.search),
    ("eve", eve.search),
    ("sephora", sephora.search),
]


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await fetch.startup()
    except Exception as exc:
        logger.exception("startup browser initialization failed: %s", exc)
    yield
    await fetch.shutdown()


app = FastAPI(title="Pickly Price Service", version="1.0.0", lifespan=lifespan)


@app.get("/health")
async def health() -> dict[str, bool | str]:
    return {"status": "ok", "browser_ready": fetch.browser_ready}


@app.get("/ready")
async def ready(response: Response) -> dict[str, bool | str]:
    if not fetch.browser_ready:
        response.status_code = 503
        return {"status": "starting", "browser_ready": False}
    return {"status": "ready", "browser_ready": True}


async def run_scraper(name: str, scraper: ScraperFn, query: str, brand: str) -> tuple[str, list[RawCandidate], float, str | None]:
    start = time.perf_counter()
    try:
        candidates = await scraper(query, brand)
        return name, candidates, (time.perf_counter() - start) * 1000, None
    except Exception as exc:
        return name, [], (time.perf_counter() - start) * 1000, str(exc)


@app.post("/price-search", response_model=list[MatchedListing])
async def price_search(request: PriceSearchRequest) -> list[MatchedListing]:
    request_id = str(uuid4())
    total_start = time.perf_counter()
    query = f"{request.brand} {request.product_name}".strip()

    logger.info(
        "price_search_start request_id=%s brand=%r product_name=%r category=%r",
        request_id,
        request.brand,
        request.product_name,
        request.category,
    )

    tasks = [run_scraper(name, scraper, query, request.brand) for name, scraper in SCRAPERS]
    try:
        # 20s outer cap covers the slowest SPA renders (Rossmann ~10-12s) while
        # still failing fast if a retailer hangs. Individual scrapers also have
        # their own internal timeouts (see search_retailer.timeout_seconds).
        scraper_results = await asyncio.wait_for(asyncio.gather(*tasks, return_exceptions=False), timeout=20)
    except TimeoutError:
        logger.warning("price_search_timeout request_id=%s", request_id)
        scraper_results = []

    raw_candidates: list[RawCandidate] = []
    retailer_counts: dict[str, int] = {}
    retailer_durations: dict[str, int] = {}
    retailer_errors: dict[str, str] = {}

    for name, candidates, duration_ms, error in scraper_results:
        retailer_counts[name] = len(candidates)
        retailer_durations[name] = int(duration_ms)
        if error:
            retailer_errors[name] = error
            logger.warning("scraper_error request_id=%s retailer=%s error=%s", request_id, name, error)
        raw_candidates.extend(candidates)

    listings = matcher.match_all(
        raw_candidates,
        request.brand,
        request.product_name,
        request.full_title,
        category=request.category,
    )
    matched_retailers = {listing.retailer: round(listing.confidence, 3) for listing in listings}
    total_ms = int((time.perf_counter() - total_start) * 1000)

    logger.info(
        "price_search_done request_id=%s counts=%s matches=%s durations_ms=%s errors=%s response_ms=%d",
        request_id,
        retailer_counts,
        matched_retailers,
        retailer_durations,
        retailer_errors,
        total_ms,
    )

    if not listings and raw_candidates:
        sample_titles = {
            retailer: [candidate.title for candidate in raw_candidates if candidate.retailer == retailer][:3]
            for retailer in retailer_counts
            if retailer_counts[retailer] > 0
        }
        logger.info(
            "price_search_no_match request_id=%s brand=%r product=%r samples=%s",
            request_id,
            request.brand,
            request.product_name,
            sample_titles,
        )

    return listings
