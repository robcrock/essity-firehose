"""iOS App Store review fetcher via app-store-web-scraper."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

from app_store_web_scraper import AppStoreEntry

from .apps import AppConfig
from .normalize import Review, normalize_ios


def fetch_ios_reviews(app: AppConfig, since: datetime, limit: int = 500) -> list[Review]:
    """Fetch reviews for an iOS app published on or after `since`.

    The scraper returns reviews newest-first. We stop iterating once we hit one
    older than `since`.
    """
    assert app.os == "ios"
    entry = AppStoreEntry(app_id=int(app.store_id), country=app.country)
    out: list[Review] = []
    for raw in entry.reviews(limit=limit):
        raw_date = raw.date
        if raw_date.tzinfo is None:
            raw_date = raw_date.replace(tzinfo=timezone.utc)
        if raw_date < since:
            break
        out.append(normalize_ios(raw, app))
    return out
