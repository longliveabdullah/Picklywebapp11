from urllib.parse import quote_plus

from models import RawCandidate
from scrapers.common import search_retailer

RETAILER = "trendyol"
BASE_URL = "https://www.trendyol.com"


async def search(query: str, brand: str) -> list[RawCandidate]:
    return await search_retailer(
        retailer=RETAILER,
        query=query,
        brand=brand,
        base_url=BASE_URL,
        build_url=lambda value: f"{BASE_URL}/sr?q={quote_plus(value)}",
        browser=True,
    )
