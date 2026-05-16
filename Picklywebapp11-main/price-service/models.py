from typing import Literal

from pydantic import BaseModel, Field


class RawCandidate(BaseModel):
    title: str
    price_try: float = Field(gt=0)
    url: str
    retailer: str
    raw_title: str


class MatchedListing(BaseModel):
    retailer: str
    price: float = Field(gt=0)
    currency: Literal["TRY"] = "TRY"
    product_title: str
    url: str
    confidence: float = Field(ge=0, le=1)


class PriceSearchRequest(BaseModel):
    product_name: str = Field(min_length=1)
    brand: str = Field(min_length=1)
    category: str | None = None
    full_title: str | None = None
