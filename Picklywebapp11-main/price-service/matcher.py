import re
import string
from collections import defaultdict

from models import MatchedListing, RawCandidate

TURKISH_TRANSLATION = str.maketrans(
    {
        "ı": "i",
        "İ": "i",
        "ş": "s",
        "Ş": "s",
        "ğ": "g",
        "Ğ": "g",
        "ç": "c",
        "Ç": "c",
        "ö": "o",
        "Ö": "o",
        "ü": "u",
        "Ü": "u",
    }
)

STOPWORDS = {
    "a", "an", "the", "ve", "bir", "icin", "icin", "ile", "with", "for", "and", "ml", "gr", "g",
}

# Maps category → Turkish/English keywords that appear in retailer listing titles.
# If the brand matches AND any keyword from the scanned category appears in the
# candidate title, we award a +0.15 category-alignment bonus regardless of
# product-name token overlap. This handles cross-language product names (e.g.
# Spanish "Anti-Resequedad" matching Turkish "Kepek Karsiti Sampuan").
CATEGORY_KEYWORDS: dict[str, set[str]] = {
    "haircare":  {"sampuan", "sac", "hair", "kepek", "sac kremi", "bakim", "kondisyoner", "serum"},
    "skincare":  {"krem", "nemlendirici", "serum", "temizleyici", "tonik", "maske", "cilt", "yuz", "losyon"},
    "fragrance": {"parfum", "edp", "edt", "eau", "koku", "deodorant"},
    "makeup":    {"fondoten", "ruj", "maskara", "allık", "far", "allik", "makyaj", "pudra", "primer"},
    "bodycare":  {"vucut", "losyon", "dus", "sabun", "body"},
    "suncare":   {"gunes", "spf", "koruyucu", "sunscreen"},
}

SIZE_RE = re.compile(r"(\d+(?:[.,]\d+)?)\s?(ml|g|gr|mg|adet|pcs|fl\s?oz)", re.IGNORECASE)


def normalize(value: str | None) -> str:
    if not value:
        return ""
    translated = value.translate(TURKISH_TRANSLATION).lower()
    punctuation = string.punctuation.replace(" ", "")
    without_punctuation = translated.translate(str.maketrans({char: " " for char in punctuation}))
    return re.sub(r"\s+", " ", without_punctuation).strip()


def tokenize(value: str) -> list[str]:
    return [token for token in normalize(value).split() if token and token not in STOPWORDS]


def extract_sizes(value: str | None) -> set[str]:
    normalized_sizes: set[str] = set()
    if not value:
        return normalized_sizes
    for amount, unit in SIZE_RE.findall(normalize(value)):
        compact_amount = amount.replace(",", ".")
        if compact_amount.endswith(".0"):
            compact_amount = compact_amount[:-2]
        compact_unit = unit.replace(" ", "")
        if compact_unit == "gr":
            compact_unit = "g"
        normalized_sizes.add(f"{compact_amount}{compact_unit}")
    return normalized_sizes


def _category_bonus(candidate_title: str, category: str | None) -> float:
    """Return 0.15 when the candidate title contains a keyword matching the category."""
    if not category:
        return 0.0
    keywords = CATEGORY_KEYWORDS.get(normalize(category), set())
    normalized_title = normalize(candidate_title)
    for kw in keywords:
        if kw in normalized_title:
            return 0.15
    return 0.0


def score_candidate(
    candidate: RawCandidate,
    brand: str,
    product_name: str,
    full_title: str | None = None,
    category: str | None = None,
) -> float:
    candidate_title = normalize(candidate.title)
    normalized_brand = normalize(brand)

    brand_matched = bool(normalized_brand) and normalized_brand in candidate_title

    brand_tokens = set(normalized_brand.split()) if normalized_brand else set()
    product_source = full_title or product_name
    product_tokens = [token for token in tokenize(product_source) if token not in brand_tokens]
    candidate_tokens = set(tokenize(candidate.title))

    matching_count = sum(1 for token in product_tokens if token in candidate_tokens)
    overlap_ratio = matching_count / len(product_tokens) if product_tokens else 1.0

    # Brand match is the dominant signal (0.55 weight).
    # Without brand match the candidate is almost certainly wrong — reject early.
    if not brand_matched:
        base_score = 0.10
    elif overlap_ratio >= 0.50:
        base_score = 0.55
    elif overlap_ratio > 0:
        base_score = 0.40
    else:
        base_score = 0.30

    # Token overlap component (0.25 weight — reduced because product names vary
    # across markets and languages).
    token_score = min(overlap_ratio * 0.25, 0.25)
    score = base_score + token_score

    # Category-alignment bonus: brand matches + correct product type → +0.15.
    # This recovers valid cross-language matches (e.g. "Anti-Resequedad" vs
    # "Kepek Karsiti Sampuan" — both haircare/shampoo).
    if brand_matched:
        score += _category_bonus(candidate.title, category)

    # Size mismatch penalty — wrong pack size is worse than no result.
    original_sizes = extract_sizes(full_title or product_name)
    candidate_sizes = extract_sizes(candidate.title)
    if original_sizes and candidate_sizes and original_sizes.isdisjoint(candidate_sizes):
        score -= 0.40

    return max(0.0, min(1.0, round(score, 4)))


def match_all(
    candidates: list[RawCandidate],
    brand: str,
    product_name: str,
    full_title: str | None = None,
    *,
    category: str | None = None,
    threshold: float = 0.45,
) -> list[MatchedListing]:
    by_retailer: dict[str, list[tuple[RawCandidate, float]]] = defaultdict(list)

    for candidate in candidates:
        confidence = score_candidate(candidate, brand, product_name, full_title, category)
        if confidence >= threshold:
            by_retailer[candidate.retailer].append((candidate, confidence))

    listings: list[MatchedListing] = []
    for retailer, matches in by_retailer.items():
        best_candidate, confidence = max(matches, key=lambda item: item[1])
        listings.append(
            MatchedListing(
                retailer=retailer,
                price=best_candidate.price_try,
                product_title=best_candidate.raw_title or best_candidate.title,
                url=best_candidate.url,
                confidence=confidence,
            )
        )

    return sorted(listings, key=lambda listing: listing.price)
