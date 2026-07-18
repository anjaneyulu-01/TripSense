"""Lightweight heuristic extraction of trip facts from user messages.

This keeps the consultant "agentic" (it remembers what's been said and stops
re-asking) without a second LLM round-trip on every turn. It is intentionally
conservative: it only fills a field when reasonably confident, and never
overwrites a value the user already gave.

A future enhancement is to replace/augment this with the model's own
structured-output extraction; the interface (`merge_extracted`) stays the same.
"""

from __future__ import annotations

import re

from app.models.conversation import CollectedInfo

_NUM = r"(\d[\d,]*)"

_TRAVEL_TYPES = {
    "solo": ["solo", "alone", "by myself", "just me"],
    "couple": ["couple", "honeymoon", "with my wife", "with my husband", "partner"],
    "family": ["family", "with kids", "with my parents", "with children"],
    "friends": ["friends", "group of friends", "with my friends"],
}

_LUXURY = {
    "budget": ["on a budget", "tight budget", "budget trip", "cheap", "backpack",
               "backpacking", "economical", "low cost", "shoestring"],
    "comfort": ["comfort", "mid range", "mid-range", "moderate", "standard"],
    "luxury": ["luxury", "luxurious", "5 star", "five star", "premium", "high end"],
}

_INTEREST_KEYWORDS = [
    "beach", "mountains", "trekking", "hiking", "history", "culture", "food",
    "nightlife", "adventure", "wildlife", "nature", "shopping", "temples",
    "photography", "relaxation", "spa", "skiing", "diving", "art", "museums",
]


def _scale(raw: str, unit: str | None) -> float:
    value = float(raw.replace(",", ""))
    if unit in ("k", "thousand"):
        return value * 1_000
    if unit in ("lakh", "lakhs", "l"):
        return value * 100_000
    return value


def _extract_budget(text: str, lower: str) -> float | None:
    """Extract a budget only when the number is bound to a money signal."""
    unit = r"(k|thousand|lakhs?|l)?"

    # 1) Currency symbol/word immediately before the number: ₹50,000 / $2000
    m = re.search(rf"[₹$€]\s*{_NUM}\s*{unit}", lower)
    if m:
        return _scale(m.group(1), m.group(2))

    # 2) Number followed by a currency word: "50000 rupees", "2000 usd"
    m = re.search(rf"{_NUM}\s*{unit}\s*(?:rupees?|rs|inr|dollars?|usd|eur|euros?)", lower)
    if m:
        return _scale(m.group(1), m.group(2))

    # 3) Number with a magnitude unit: "50k", "2 lakh"
    m = re.search(rf"{_NUM}\s*(k|thousand|lakhs?)\b", lower)
    if m:
        return _scale(m.group(1), m.group(2))

    # 4) A budget/spend keyword directly preceding the number.
    m = re.search(rf"(?:budget|spend|cost|around|about|up ?to|max)\D{{0,12}}?{_NUM}\s*{unit}", lower)
    if m and int(m.group(1).replace(",", "")) >= 500:
        return _scale(m.group(1), m.group(2))

    return None


def _find_currency(text: str) -> str | None:
    if "₹" in text or re.search(r"\b(inr|rupees?|rs)\b", text, re.I):
        return "INR"
    if "$" in text or re.search(r"\b(usd|dollars?)\b", text, re.I):
        return "USD"
    if "€" in text or re.search(r"\beur(os)?\b", text, re.I):
        return "EUR"
    return None


def extract_from_message(text: str) -> CollectedInfo:
    """Return a partial CollectedInfo containing only fields found in `text`."""
    lower = text.lower()
    info = CollectedInfo()

    # Budget — only accept a number that carries a strong money signal, so
    # "family of 4" is never mistaken for a budget. Tried in priority order.
    budget = _extract_budget(text, lower)
    if budget is not None:
        info.budget = budget
        info.currency = _find_currency(text)

    # Duration: "5 days", "for a week", "10-day trip"
    days_match = re.search(rf"{_NUM}\s*[- ]?\s*(days?|nights?)", lower)
    if days_match:
        info.duration_days = int(days_match.group(1).replace(",", ""))
    elif re.search(r"\b(a|one)\s+week\b", lower):
        info.duration_days = 7
    elif re.search(r"\b(two|2)\s+weeks?\b", lower):
        info.duration_days = 14

    # Starting city: "from Hyderabad", "starting in Delhi"
    city_match = re.search(
        r"\b(?:from|starting (?:in|from)|departing from|leaving from)\s+([A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)?)",
        text,
    )
    if city_match:
        info.starting_city = city_match.group(1).strip()

    # Group size: "4 people", "group of 6", "we are 3"
    group_match = re.search(rf"(?:group of|we are|party of|)\s*{_NUM}\s*(?:people|persons|adults|pax)", lower)
    if group_match:
        info.group_size = int(group_match.group(1).replace(",", ""))

    # Travel type
    for kind, keywords in _TRAVEL_TYPES.items():
        if any(k in lower for k in keywords):
            info.travel_type = kind
            break

    # Luxury level
    for level, keywords in _LUXURY.items():
        if any(k in lower for k in keywords):
            info.luxury_level = level
            break

    # Children / seniors
    if re.search(r"\b(kids|children|toddler|baby|infant)\b", lower):
        info.has_children = True
    if re.search(r"\b(senior|elderly|grandparent|old age|parents.*age)\b", lower):
        info.has_seniors = True

    # Interests
    found = [kw for kw in _INTEREST_KEYWORDS if kw in lower]
    if found:
        info.interests = found

    return info


def merge_extracted(base: CollectedInfo, new: CollectedInfo) -> CollectedInfo:
    """Merge newly-extracted facts into the accumulated state.

    Existing values are preserved (never clobbered); lists are unioned.
    """
    merged = base.model_copy(deep=True)
    for field in CollectedInfo.model_fields:
        new_value = getattr(new, field)
        if new_value in (None, "", []):
            continue
        current = getattr(merged, field)
        if field == "interests":
            union = list(dict.fromkeys([*current, *new_value]))
            setattr(merged, field, union)
        elif current in (None, "", []):
            setattr(merged, field, new_value)
    return merged
