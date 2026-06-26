"""The seven FreeStyle Libre app/OS combinations we scrape."""

from dataclasses import dataclass


@dataclass(frozen=True)
class AppConfig:
    slug: str              # stable short key used everywhere
    display_name: str      # human-readable label for the UI
    os: str                # "ios" | "android"
    store_id: str          # iOS: numeric App Store id; Android: package name
    country: str = "us"


APPS: list[AppConfig] = [
    # iOS (App Store)
    AppConfig(
        slug="libre-by-abbott",
        display_name="Libre by Abbott",
        os="ios",
        store_id="6670330506",
    ),
    AppConfig(
        slug="libre-3-us",
        display_name="FreeStyle Libre 3 (US)",
        os="ios",
        store_id="1524572429",
    ),
    AppConfig(
        slug="librelink-us",
        display_name="FreeStyle LibreLink (US)",
        os="ios",
        store_id="1325992472",
    ),
    AppConfig(
        slug="librelinkup",
        display_name="LibreLinkUp",
        os="ios",
        store_id="1234323923",
    ),
    # Android (Google Play)
    AppConfig(
        slug="libre-3-us",
        display_name="FreeStyle Libre 3 (US)",
        os="android",
        store_id="com.freestylelibre3.app.us",
    ),
    AppConfig(
        slug="librelink-us",
        display_name="FreeStyle LibreLink (US)",
        os="android",
        store_id="com.freestylelibre.app.us",
    ),
    AppConfig(
        slug="librelinkup",
        display_name="LibreLinkUp",
        os="android",
        store_id="com.librelinkup.app.us",
    ),
]
