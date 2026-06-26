"""CLI entry point: scrape all 7 apps and write data/reviews.json."""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from .android import fetch_android_reviews
from .apps import APPS, AppConfig
from .ios import fetch_ios_reviews
from .normalize import Review

DEFAULT_OUTPUT = Path(__file__).resolve().parents[3] / "data" / "reviews.json"


def _fetch_for(app: AppConfig, since: datetime) -> list[Review]:
    if app.os == "ios":
        return fetch_ios_reviews(app, since)
    if app.os == "android":
        return fetch_android_reviews(app, since)
    raise ValueError(f"Unknown os: {app.os}")


def scrape(days: int, output: Path) -> None:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    all_reviews: list[Review] = []
    seen: set[str] = set()

    print(f"Scraping last {days} days (since {since.isoformat()})...", file=sys.stderr)
    for app in APPS:
        label = f"{app.display_name} [{app.os}]"
        print(f"  {label}...", end=" ", flush=True, file=sys.stderr)
        try:
            batch = _fetch_for(app, since)
        except Exception as e:  # noqa: BLE001 - surface any scraper failure, keep going
            print(f"FAILED: {e!r}", file=sys.stderr)
            continue
        added = 0
        for r in batch:
            if r["id"] in seen:
                continue
            seen.add(r["id"])
            all_reviews.append(r)
            added += 1
        print(f"{added} reviews", file=sys.stderr)

    all_reviews.sort(key=lambda r: r["date"], reverse=True)

    payload = {
        "generatedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "windowDays": days,
        "apps": [
            {
                "slug": a.slug,
                "displayName": a.display_name,
                "os": a.os,
                "storeId": a.store_id,
            }
            for a in APPS
        ],
        "reviews": all_reviews,
    }

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    print(f"\nWrote {len(all_reviews)} reviews -> {output}", file=sys.stderr)


def main() -> None:
    parser = argparse.ArgumentParser(description="Scrape FreeStyle Libre app reviews.")
    parser.add_argument("--days", type=int, default=90, help="look-back window in days")
    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT,
        help="output JSON path",
    )
    args = parser.parse_args()
    scrape(days=args.days, output=args.output)


if __name__ == "__main__":
    main()
