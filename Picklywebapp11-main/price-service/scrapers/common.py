import asyncio
import html
import json
import logging
import re
from collections.abc import Callable
from urllib.parse import urljoin

from fetch import fetch_dom, fetch_html
from models import RawCandidate

logger = logging.getLogger(__name__)

PRICE_RE = re.compile(
    r"(?:₺|TL|TRY)\s*([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{1,2})?|[0-9]+(?:,[0-9]{1,2})?)|"
    r"([0-9]{1,3}(?:\.[0-9]{3})*(?:,[0-9]{1,2})?|[0-9]+(?:,[0-9]{1,2})?)\s*(?:₺|TL|TRY)",
    re.IGNORECASE,
)
SCRIPT_LD_RE = re.compile(
    r"<script[^>]+type=[\"']application/ld\+json[\"'][^>]*>(.*?)</script>",
    re.IGNORECASE | re.DOTALL,
)
ANCHOR_RE = re.compile(r"<a\b(?P<attrs>[^>]*)>(?P<body>.*?)</a>", re.IGNORECASE | re.DOTALL)
HREF_RE = re.compile(r"href=[\"'](?P<href>[^\"']+)[\"']", re.IGNORECASE)
TITLE_ATTR_RE = re.compile(r"(?:title|aria-label|alt)=[\"'](?P<title>[^\"']+)[\"']", re.IGNORECASE)


def normalize_price(value: str) -> float | None:
    cleaned = value.strip().replace("₺", "").replace("TL", "").replace("TRY", "").strip()
    cleaned = cleaned.replace(".", "").replace(",", ".")
    try:
        price = float(cleaned)
    except ValueError:
        return None
    return price if price > 0 else None


def absolute_url(base_url: str, url: str) -> str:
    return url if url.startswith("https://") else urljoin(base_url, url)


def clean_text(value: str) -> str:
    without_tags = re.sub(r"<[^>]+>", " ", value)
    unescaped = html.unescape(without_tags)
    return re.sub(r"\s+", " ", unescaped).strip()


def _extract_price(segment: str) -> float | None:
    for match in PRICE_RE.finditer(html.unescape(segment)):
        amount = match.group(1) or match.group(2)
        if not amount:
            continue
        price = normalize_price(amount)
        if price is not None:
            return price
    return None


def find_first_price(segment: str) -> float | None:
    """First TRY price found in an HTML segment (used by retailer-specific parsers)."""
    return _extract_price(segment)


def _iter_json_objects(value: object):
    if isinstance(value, dict):
        yield value
        for nested in value.values():
            yield from _iter_json_objects(nested)
    elif isinstance(value, list):
        for item in value:
            yield from _iter_json_objects(item)


def extract_candidates(html_text: str, *, retailer: str, base_url: str, limit: int = 8) -> list[RawCandidate]:
    seen: set[tuple[str, float]] = set()
    candidates: list[RawCandidate] = []

    for script_body in SCRIPT_LD_RE.findall(html_text):
        try:
            parsed = json.loads(html.unescape(script_body.strip()))
        except json.JSONDecodeError:
            continue
        for obj in _iter_json_objects(parsed):
            if obj.get("@type") not in {"Product", "ListItem"}:
                continue
            product = obj.get("item") if isinstance(obj.get("item"), dict) else obj
            title = str(product.get("name") or "").strip()
            offers = product.get("offers")
            if isinstance(offers, list):
                offers = offers[0] if offers else None
            if not title or not isinstance(offers, dict):
                continue
            price_raw = str(offers.get("price") or offers.get("lowPrice") or "")
            price = normalize_price(price_raw)
            url = str(product.get("url") or offers.get("url") or "")
            if price is None or not url:
                continue
            key = (absolute_url(base_url, url), price)
            if key in seen:
                continue
            seen.add(key)
            candidates.append(
                RawCandidate(
                    title=clean_text(title),
                    raw_title=clean_text(title),
                    price_try=price,
                    url=absolute_url(base_url, url),
                    retailer=retailer,
                )
            )
            if len(candidates) >= limit:
                return candidates

    for anchor in ANCHOR_RE.finditer(html_text):
        attrs = anchor.group("attrs")
        href_match = HREF_RE.search(attrs)
        if not href_match:
            continue
        href = href_match.group("href")
        if href.startswith("#") or href.startswith("javascript:") or "search" in href.lower():
            continue

        raw_title = clean_text(anchor.group("body"))
        if len(raw_title) < 4:
            attr_match = TITLE_ATTR_RE.search(attrs)
            raw_title = clean_text(attr_match.group("title")) if attr_match else ""
        if len(raw_title) < 4:
            continue

        segment = html_text[anchor.start() : min(len(html_text), anchor.end() + 2500)]
        price = _extract_price(segment)
        if price is None:
            continue

        url = absolute_url(base_url, href)
        key = (url, price)
        if key in seen:
            continue
        seen.add(key)
        candidates.append(
            RawCandidate(
                title=raw_title,
                raw_title=raw_title,
                price_try=price,
                url=url,
                retailer=retailer,
            )
        )
        if len(candidates) >= limit:
            break

    return candidates


async def search_retailer(
    *,
    retailer: str,
    query: str,
    brand: str,
    base_url: str,
    build_url: Callable[[str], str],
    browser: bool,
    stealth: bool = False,
    timeout_seconds: float = 10.0,
    extract: Callable[[str], list[RawCandidate]] | None = None,
    dom_extract_js: str | None = None,
    dom_max_wait_ms: int = 10000,
) -> list[RawCandidate]:
    """Run a search against a retailer and return matching candidates.

    Three extraction paths are supported (priority order):
      1. dom_extract_js  – render with Playwright and call page.evaluate()
                           with the provided JS. Use for SPAs (Gratis, Rossmann).
                           The JS must return [{title, url, price}, ...].
      2. extract         – custom HTML-text parser (e.g. for retailer-specific JSON blobs).
      3. (default)       – generic LD+JSON / anchor parser.
    """

    def candidates_from_dom(raw: list[dict]) -> list[RawCandidate]:
        out: list[RawCandidate] = []
        seen: set[tuple[str, float]] = set()
        for item in raw:
            if not isinstance(item, dict):
                continue
            title = clean_text(str(item.get("title") or "").strip())
            url = str(item.get("url") or "").strip()
            price_raw = str(item.get("price") or "").strip()
            if not title or not url or not price_raw:
                continue
            price = normalize_price(price_raw)
            if price is None:
                continue
            key = (url, price)
            if key in seen:
                continue
            seen.add(key)
            out.append(
                RawCandidate(
                    title=title,
                    raw_title=title,
                    price_try=price,
                    url=url,
                    retailer=retailer,
                )
            )
        return out

    def run_extract(html_text: str) -> list[RawCandidate]:
        if extract is not None:
            return extract(html_text)
        return extract_candidates(html_text, retailer=retailer, base_url=base_url)

    async def attempt(search_query: str, fallback: bool = False) -> list[RawCandidate]:
        url = build_url(search_query)
        if dom_extract_js is not None:
            raw = await fetch_dom(url, extractor_js=dom_extract_js, max_wait_ms=dom_max_wait_ms)
            candidates = candidates_from_dom(raw)
        else:
            html_text = await fetch_html(url, browser=browser, stealth=stealth)
            candidates = run_extract(html_text)
        logger.info(
            "%s search path=%s query=%r candidates=%d",
            retailer,
            "brand_fallback" if fallback else "primary",
            search_query,
            len(candidates),
        )
        return candidates

    try:
        async with asyncio.timeout(timeout_seconds):
            candidates = await attempt(query)
            if candidates:
                return candidates
            if brand.strip() and brand.strip().lower() != query.strip().lower():
                return await attempt(brand.strip(), fallback=True)
            return []
    except TimeoutError:
        logger.warning("%s scraper timed out query=%r", retailer, query)
    except Exception as exc:
        logger.exception("%s scraper failed query=%r error=%s", retailer, query, exc)
    return []
