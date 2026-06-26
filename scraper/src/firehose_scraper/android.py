"""Google Play review fetcher via google-play-scraper."""

from __future__ import annotations

from datetime import datetime, timezone

from google_play_scraper import Sort, reviews as gp_reviews

from .apps import AppConfig
from .normalize import Review, normalize_android

# How many to pull per page. 200 is the API's per-call upper bound.
_PAGE = 200
# Safety cap: a single app should never exceed this in a 90-day window.
_MAX_TOTAL = 5000


def fetch_android_reviews(app: AppConfig, since: datetime) -> list[Review]:
    """Fetch reviews for a Google Play app newer than `since`.

    Google Play's newest-first pagination is driven by continuation tokens.
    We stop as soon as the most recent page yields reviews older than `since`.
    """
    assert app.os == "android"
    out: list[Review] = []
    token = None
    while len(out) < _MAX_TOTAL:
        batch, token = gp_reviews(
            app.store_id,
            lang="en",
            country=app.country,
            sort=Sort.NEWEST,
            count=_PAGE,
            continuation_token=token,
        )
        if not batch:
            break
        stop = False
        for raw in batch:
            raw_date = raw["at"]
            if raw_date.tzinfo is None:
                raw_date = raw_date.replace(tzinfo=timezone.utc)
            if raw_date < since:
                stop = True
                break
            out.append(normalize_android(raw, app))
        if stop or token is None:
            break
    return out
