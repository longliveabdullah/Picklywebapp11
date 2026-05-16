from urllib.parse import quote_plus

from models import RawCandidate
from scrapers.common import search_retailer

RETAILER = "gratis"
BASE_URL = "https://www.gratis.com"

# Gratis is a React SPA. Product cards are rendered client-side as anchors
# whose href contains "/p/" (the product detail page). The card's innerText
# starts with the product title and includes "XX,YY TL" prices. We take the
# lower of the two prices when "Gratis Kart ile" loyalty pricing is present.
DOM_EXTRACT_JS = """
() => {
  const items = [];
  const seen = new Set();
  const anchors = document.querySelectorAll('a[href*="/p/"]');
  for (const a of anchors) {
    const href = a.href || '';
    if (!href || seen.has(href)) continue;
    const card = a.closest('div[class*="rounded-xl"], li, article') || a.parentElement;
    const text = (card?.innerText || '').trim();
    if (!text) continue;
    const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;
    const title = lines[0];
    if (title.length < 4) continue;
    // collect all TL prices, pick the lowest (Gratis Card price beats the strikethrough original)
    const priceMatches = [...text.matchAll(/(\\d{1,4}(?:\\.\\d{3})*,\\d{2})\\s*TL/g)]
      .map(m => parseFloat(m[1].replace(/\\./g, '').replace(',', '.')))
      .filter(p => p > 0);
    if (priceMatches.length === 0) continue;
    const price = Math.min(...priceMatches);
    seen.add(href);
    items.push({ title, url: href, price: price.toFixed(2).replace('.', ',') });
    if (items.length >= 8) break;
  }
  return items;
}
"""


async def search(query: str, brand: str) -> list[RawCandidate]:
    return await search_retailer(
        retailer=RETAILER,
        query=query,
        brand=brand,
        base_url=BASE_URL,
        build_url=lambda value: f"{BASE_URL}/search?q={quote_plus(value)}",
        browser=True,
        dom_extract_js=DOM_EXTRACT_JS,
        timeout_seconds=20.0,
        dom_max_wait_ms=10000,
    )
