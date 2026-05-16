"""Akakçe price comparison search (https://www.akakce.com)."""

import logging
import re
from urllib.parse import quote_plus

from models import RawCandidate
from scrapers.common import clean_text, extract_candidates, find_first_price, search_retailer

logger = logging.getLogger(__name__)

RETAILER = "akakce"
BASE_URL = "https://www.akakce.com"

# Opening <a ...> with product path ...-p-{digits}.html (Akakçe canonical product URLs)
_AKAKCE_PRODUCT_ANCHOR_RE = re.compile(
    r'<a\s+(?P<attrs>[^>]*href=["\'](?P<href>(?:https://www\.akakce\.com)?/(?P<path>[^"\']+-p-\d+\.html))["\'][^>]*)>',
    re.IGNORECASE | re.DOTALL,
)


def _title_from_slug(path: str) -> str:
    slug = path.split("/")[-1].removesuffix(".html")
    slug = re.sub(r"-p-\d+$", "", slug, flags=re.IGNORECASE)
    return slug.replace("-", " ").strip()


def extract_akakce_candidates(html_text: str, *, limit: int = 8) -> list[RawCandidate]:
    """Parse Akakçe search result rows; fall back to generic LD+JSON / anchor heuristic."""
    generic = extract_candidates(html_text, retailer=RETAILER, base_url=BASE_URL, limit=limit)
    if len(generic) >= 3:
        return generic[:limit]

    candidates: list[RawCandidate] = []
    seen_pid: set[str] = set()

    for match in _AKAKCE_PRODUCT_ANCHOR_RE.finditer(html_text):
        attrs = match.group("attrs")
        href_path = match.group("href")
        if href_path.startswith("https://"):
            url = href_path
        else:
            url = f"{BASE_URL}{href_path}" if href_path.startswith("/") else f"{BASE_URL}/{href_path}"

        pid_m = re.search(r"-p-(\d+)\.html", href_path, re.IGNORECASE)
        if not pid_m:
            continue
        pid = pid_m.group(1)
        if pid in seen_pid:
            continue

        title_m = re.search(r'title=["\']([^"\']{3,})["\']', attrs, re.IGNORECASE)
        raw_title = clean_text(title_m.group(1)) if title_m else _title_from_slug(match.group("path"))

        if len(raw_title) < 3:
            continue

        segment = html_text[match.end() : match.end() + 4500]
        price = find_first_price(segment)
        if price is None:
            continue

        seen_pid.add(pid)
        candidates.append(
            RawCandidate(
                title=raw_title,
                raw_title=raw_title,
                price_try=price,
                url=url,
                retailer=RETAILER,
            )
        )
        logger.debug("akakce candidate pid=%s title=%r price=%s", pid, raw_title[:80], price)
        if len(candidates) >= limit:
            break

    if candidates:
        return candidates
    return generic[:limit]


async def search(query: str, brand: str) -> list[RawCandidate]:
    def extract(html_text: str) -> list[RawCandidate]:
        return extract_akakce_candidates(html_text, limit=8)

    return await search_retailer(
        retailer=RETAILER,
        query=query,
        brand=brand,
        base_url=BASE_URL,
        build_url=lambda value: f"{BASE_URL}/arama/?q={quote_plus(value)}",
        browser=True,
        extract=extract,
    )
