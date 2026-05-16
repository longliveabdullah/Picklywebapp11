from urllib.parse import quote_plus

from models import RawCandidate
from scrapers.common import search_retailer

RETAILER = "rossmann"
BASE_URL = "https://www.rossmann.com.tr"

# Rossmann uses Magento + Hyvä Theme + Alpine.js. Products are fetched via an
# Elastic search XHR after the page mounts and rendered into ".product-item"
# divs (note: there are duplicate cards due to nested x-for templates — we
# de-dupe by href). The product anchor has its href fully resolved to a URL
# like https://www.rossmann.com.tr/<slug>-p-st<id>?waw_keyword=... — the slug
# never ends in .html. Prices are split into "499," "00" "TL" lines because of
# the Alpine span structure, so we reassemble them.
DOM_EXTRACT_JS = """
() => {
  const items = [];
  const seen = new Set();
  const cards = document.querySelectorAll('.product-item');
  for (const card of cards) {
    const a = card.querySelector('a[href*="rossmann.com.tr"], a[href^="/"]');
    if (!a) continue;
    const href = a.href || '';
    if (!href || href.includes('catalogsearch') || href.endsWith('#')) continue;
    if (seen.has(href)) continue;
    const text = (card.innerText || '').trim();
    if (!text) continue;
    const lines = text.split('\\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) continue;
    // brand on line 0, name+size on line 1 — combine into a single title
    const title = (lines[0] + ' ' + lines[1]).trim();
    if (title.length < 4) continue;
    // Recover prices from split spans: pattern is /^\\d+,$/ then /^\\d{2}$/ then /^TL$/
    const prices = [];
    for (let i = 0; i < lines.length - 2; i++) {
      const a1 = /^(\\d{1,4}(?:\\.\\d{3})*),$/.exec(lines[i]);
      const a2 = /^(\\d{2})$/.exec(lines[i + 1]);
      const a3 = /^TL$/i.exec(lines[i + 2]);
      if (a1 && a2 && a3) {
        const combined = a1[1].replace(/\\./g, '') + '.' + a2[1];
        const value = parseFloat(combined);
        if (value > 0) prices.push(value);
      } else {
        // inline "499,00 TL"
        const m = /^(\\d{1,4}(?:\\.\\d{3})*,\\d{2})\\s*TL$/i.exec(lines[i]);
        if (m) {
          const value = parseFloat(m[1].replace(/\\./g, '').replace(',', '.'));
          if (value > 0) prices.push(value);
        }
      }
    }
    if (prices.length === 0) continue;
    // pick the Rossmann Card price (lower) if present
    const price = Math.min(...prices);
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
        build_url=lambda value: f"{BASE_URL}/catalogsearch/result/?q={quote_plus(value)}",
        browser=True,
        dom_extract_js=DOM_EXTRACT_JS,
        timeout_seconds=25.0,
        dom_max_wait_ms=12000,
    )
