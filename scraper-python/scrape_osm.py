"""Scraper kafe Tegal dari OpenStreetMap via Overpass API (gratis, tanpa API key).

Output: ../data/osm-cafes.json
Jalankan: python scrape_osm.py
"""
import json
import sys
from pathlib import Path

import requests

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUT = DATA_DIR / "osm-cafes.json"

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
]

# Bounding box mencakup Kota Tegal + Kabupaten Tegal
BBOX = "-7.10,108.95,-6.68,109.42"
QUERY = f"""[out:json][timeout:90];
(
  nwr["amenity"~"^(cafe|bar|ice_cream)$"]({BBOX});
  nwr["shop"="coffee"]({BBOX});
);
out center tags;"""

HEADERS = {
    "User-Agent": "list-kafe-tegal-scraper/1.0 (personal project)",
    "Content-Type": "application/x-www-form-urlencoded",
}


def fetch_overpass() -> dict:
    last_err = None
    for url in ENDPOINTS:
        try:
            print(f"[osm] mencoba endpoint: {url}")
            res = requests.post(
                url,
                data={"data": QUERY},
                headers=HEADERS,
                timeout=120,
            )
            res.raise_for_status()
            return res.json()
        except Exception as err:  # noqa: BLE001
            print(f"[osm] gagal: {err}")
            last_err = err
    raise last_err


def to_cafe(el: dict) -> dict | None:
    tags = el.get("tags") or {}
    lat = el.get("lat") or (el.get("center") or {}).get("lat")
    lon = el.get("lon") or (el.get("center") or {}).get("lon")
    name = tags.get("name")
    if not name or lat is None or lon is None:
        return None

    amenity = tags.get("amenity") or tags.get("shop") or "unknown"
    maps_url = (
        "https://www.google.com/maps/search/?api=1&query="
        + requests.utils.quote(f"{name} Tegal")
        + f"&center={lat},{lon}"
    )

    address_parts = [
        tags.get("addr:street"),
        tags.get("addr:housenumber"),
        tags.get("addr:village"),
    ]
    return {
        "name": name,
        "source": "osm",
        "osmId": f"{el['type']}/{el['id']}",
        "category": amenity if amenity != "cafe" else "kafe",
        "servesCoffee": amenity == "cafe",
        "address": " ".join(p for p in address_parts if p) or None,
        "area": tags.get("addr:subdistrict") or tags.get("addr:district") or tags.get("addr:village"),
        "phone": tags.get("phone") or tags.get("contact:phone") or tags.get("contact:mobile"),
        "website": tags.get("website") or tags.get("contact:website"),
        "hours": tags.get("opening_hours"),
        "cuisine": tags.get("cuisine"),
        "outdoorSeating": tags.get("outdoor_seating") == "yes",
        "lat": lat,
        "lon": lon,
        "mapsUrl": maps_url,
    }


def main() -> None:
    data = fetch_overpass()
    cafes = [c for c in map(to_cafe, data.get("elements", [])) if c]

    seen: dict[str, dict] = {}
    for c in cafes:
        key = c["name"].lower().strip()
        seen.setdefault(key, c)

    result = sorted(seen.values(), key=lambda c: c["name"].lower())

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    categories = sorted({c["category"] for c in result})
    print(f"[osm] selesai: {len(result)} tempat tersimpan -> {OUT}")
    print(f"[osm] kategori: {', '.join(categories)}")


if __name__ == "__main__":
    try:
        main()
    except Exception as err:  # noqa: BLE001
        print(f"[osm] FATAL: {err}", file=sys.stderr)
        sys.exit(1)
