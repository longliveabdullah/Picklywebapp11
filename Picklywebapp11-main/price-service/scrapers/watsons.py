from urllib.parse import quote_plus

from models import RawCandidate
from scrapers.common import search_retailer

RETAILER = "watsons"
BASE_URL = "https://www.watsons.com.tr"


async def search(query: str, brand: str) -> list[RawCandidate]:
    return await search_retailer(
        retailer=RETAILER,
        query=query,
        brand=brand,
        base_url=BASE_URL,
        build_url=lambda value: f"{BASE_URL}/search?text={quote_plus(value)}",
        browser=False,
        stealth=True,
    )
