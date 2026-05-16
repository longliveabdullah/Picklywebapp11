import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from matcher import extract_sizes, match_all, normalize, score_candidate
from models import RawCandidate

GOLDEN_SET = json.loads((Path(__file__).parent / "golden_set.json").read_text(encoding="utf-8"))


def candidate(retailer: str, title: str, price: float = 100.0) -> RawCandidate:
    return RawCandidate(
        title=title,
        raw_title=title,
        price_try=price,
        url=f"https://example.com/{retailer}/{abs(hash(title))}",
        retailer=retailer,
    )


def test_normalize_handles_turkish_characters_and_punctuation():
    assert normalize("Şampuan İçin ÇÖZÜM!") == "sampuan icin cozum"


def test_extract_sizes_normalizes_gr_to_g():
    assert extract_sizes("Cream 50 gr") == {"50g"}
    assert extract_sizes("Cream 340ml") == {"340ml"}


THRESHOLD = 0.45  # single constant so tests always match runtime default


def test_size_mismatch_is_penalized_below_threshold():
    wrong_size = candidate("gratis", "CeraVe Nemlendirici Krem 50ml")
    score = score_candidate(wrong_size, "CeraVe", "Nemlendirici Krem", "CeraVe Nemlendirici Krem 340ml")
    assert score < THRESHOLD


def test_brand_only_match_without_category_bonus_is_rejected():
    # Same brand, completely different product type, no category hint → below threshold.
    wrong_variant = candidate("gratis", "Bioxcin Forte Shampoo 300ml")
    score = score_candidate(
        wrong_variant,
        "Bioxcin",
        "Collagen Biotin Liquid Hair Conditioner",
        "Bioxcin Collagen & Biotin Liquid Hair Conditioner",
        category=None,
    )
    assert score < THRESHOLD


def test_cross_language_match_passes_with_category_bonus():
    # "Anti-Resequedad Shampoo" (Spanish) vs Turkish "Kepek Karsiti Sampuan" —
    # brand matches + haircare category keyword ("sampuan") → should pass.
    turkish_listing = candidate("trendyol", "Head Shoulders Kepek Karsiti Sampuan 350ml")
    score = score_candidate(
        turkish_listing,
        "Head & Shoulders",
        "Anti-Resequedad Shampoo",
        "Head & Shoulders Anti-Resequedad Shampoo",
        category="haircare",
    )
    assert score >= THRESHOLD


def test_majority_token_overlap_accepts_match():
    strong = candidate("trendyol", "Bioxcin Collagen Biotin Hair Conditioner 300ml")
    score = score_candidate(
        strong,
        "Bioxcin",
        "Collagen Biotin Liquid Hair Conditioner",
        "Bioxcin Collagen & Biotin Liquid Hair Conditioner",
    )
    assert score >= THRESHOLD


def test_match_all_returns_one_highest_confidence_match_per_retailer():
    candidates = [
        candidate("watsons", "CeraVe Nemlendirici Krem 50ml", 99.0),
        candidate("watsons", "CeraVe Nemlendirici Krem 340ml", 399.0),
        candidate("gratis", "CeraVe Nemlendirici Krem 340ml", 429.0),
    ]

    matches = match_all(
        candidates, "CeraVe", "Nemlendirici Krem", "CeraVe Nemlendirici Krem 340ml",
        category="skincare",
    )

    assert [match.retailer for match in matches] == ["watsons", "gratis"]
    assert all(match.confidence >= THRESHOLD for match in matches)
    assert matches[0].price == 399.0


def test_golden_set_positive_matches_and_size_guards():
    for index, case in enumerate(GOLDEN_SET):
        expected_retailers = case["retailers_expected"]
        if not expected_retailers:
            continue

        candidates = []
        for offset, retailer in enumerate(expected_retailers):
            title = case["full_title"]
            candidates.append(candidate(retailer, title, 100.0 + offset))
            if case["expected_size"]:
                candidates.append(candidate(retailer, title.replace(case["expected_size"], "15ml"), 50.0))

        matches = match_all(
            candidates, case["brand"], case["product_name"], case["full_title"],
            category=case.get("category"),
        )
        matched_retailers = {match.retailer for match in matches}

        assert matched_retailers & set(expected_retailers), f"case {index} produced no expected retailer match"
        for match in matches:
            if case["expected_size"]:
                assert case["expected_size"].lower() in match.product_title.lower()
