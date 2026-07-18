"""Agent memory: facts are extracted and never re-collected once known."""

from __future__ import annotations

from app.models.conversation import CollectedInfo
from app.services.extraction import extract_from_message, merge_extracted


def test_extracts_core_facts():
    info = extract_from_message(
        "We are a family of 4 planning a 5 day trip from Hyderabad, "
        "budget around 50000 rupees, we love beaches and food."
    )
    assert info.duration_days == 5
    assert info.starting_city == "Hyderabad"
    assert info.travel_type == "family"
    assert info.has_children is None or isinstance(info.has_children, bool)
    assert info.budget == 50000
    assert info.currency == "INR"
    assert "beach" in info.interests and "food" in info.interests


def test_merge_preserves_existing_and_unions_interests():
    base = CollectedInfo(budget=50000, interests=["beach"], starting_city="Delhi")
    new = extract_from_message("Actually we also enjoy history and nightlife")

    merged = merge_extracted(base, new)

    # Existing scalar values are preserved.
    assert merged.budget == 50000
    assert merged.starting_city == "Delhi"
    # Interests are unioned, not overwritten.
    assert "beach" in merged.interests
    assert "history" in merged.interests
    assert "nightlife" in merged.interests


def test_missing_fields_shrinks_as_info_is_collected():
    empty = CollectedInfo()
    assert set(empty.missing_fields()) == {
        "budget", "duration_days", "starting_city", "travel_type", "interests"
    }

    full = CollectedInfo(
        budget=50000, duration_days=5, starting_city="Goa",
        travel_type="couple", interests=["beach"],
    )
    assert full.missing_fields() == []
