"""Normalize reviews from both scrapers into a single Review schema."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import TypedDict

from .apps import AppConfig


class Review(TypedDict):
    id: str
    app: str
    appDisplayName: str
    platform: str          # "mobile" for v1
    os: str                # "ios" | "android"
    rating: int
    title: str | None
    body: str
    author: str | None
    date: str              # ISO 8601 UTC
    url: str | None


def _to_utc_iso(dt: datetime) -> str:
    """Convert a datetime (naive or aware) to an ISO-8601 UTC string.

    Google Play returns naive datetimes that are already UTC.
    app-store-web-scraper returns tz-aware datetimes.
    """
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def _ios_review_url(app_id: str, review_id: str, country: str) -> str:
    return (
        f"https://apps.apple.com/{country}/app/id{app_id}?see-all=reviews"
        f"#review-{review_id}"
    )


def normalize_ios(raw, app: AppConfig) -> Review:
    """Map an app_store_web_scraper AppReview to the unified schema."""
    return Review(
        id=f"mobile:ios:{app.store_id}:{raw.id}",
        app=app.slug,
        appDisplayName=app.display_name,
        platform="mobile",
        os="ios",
        rating=int(raw.rating),
        title=(raw.title or None),
        body=(raw.content or ""),
        author=(raw.user_name or None),
        date=_to_utc_iso(raw.date),
        url=_ios_review_url(app.store_id, str(raw.id), app.country),
    )


def normalize_android(raw: dict, app: AppConfig) -> Review:
    """Map a google-play-scraper review dict to the unified schema."""
    dt = raw["at"]
    if isinstance(dt, str):
        dt = datetime.fromisoformat(dt)
    return Review(
        id=f"mobile:android:{app.store_id}:{raw['reviewId']}",
        app=app.slug,
        appDisplayName=app.display_name,
        platform="mobile",
        os="android",
        rating=int(raw["score"]),
        title=None,  # Google Play has no review title
        body=(raw.get("content") or ""),
        author=(raw.get("userName") or None),
        date=_to_utc_iso(dt),
        url=(
            f"https://play.google.com/store/apps/details?id={app.store_id}"
            f"&reviewId={raw['reviewId']}"
        ),
    )
