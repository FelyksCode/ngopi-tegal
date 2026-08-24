"""Gabungkan hasil semua scraper menjadi satu file data siap pakai untuk website.

Input : ../data/google-maps-cafes.json + ../data/osm-cafes.json
Output: ../data/tegal-cafes.json

Jalankan: python merge.py
"""
import json
import re
import unicodedata
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUT = DATA_DIR / "tegal-cafes.json"
# salinan untuk website (Root Directory Vercel = web/, jadi data harus di dalam web/)
WEB_OUT = DATA_DIR.parent / "web" / "data" / "tegal-cafes.json"

# glyph ikon private-use (Material Icons) + karakter tak terlihat lainnya
INVISIBLE = re.compile(r"[\uE000-\uF8FF\u200b-\u200f\u2060-\u2064\ufe00-\ufe0f\u00ad]")


def clean(s) -> str | None:
    if not isinstance(s, str):
        return None
    s = INVISIBLE.sub("", s)
    # en-dash / em-dash dilarang di tampilan: normalisasi ke hyphen
    s = s.replace("\u2013", "-").replace("\u2014", "-")
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"^[\s:]+|[\s:]+$", "", s).strip()
    return s or None


def parse_hours_table(rows) -> dict | None:
    if not isinstance(rows, list):
        return None
    out: dict[str, str | None] = {}
    matched = False
    for row in rows:
        m = re.match(r"^([A-Za-z]+)\s*:\s*(.*)$", row)
        if not m:
            continue
        day, rest = m.group(1), m.group(2)
        out[day] = clean(re.sub(r":$", "", rest))
        matched = True
    return out if matched else None


def slugify(name: str) -> str:
    slug = unicodedata.normalize("NFKD", name.lower())
    slug = re.sub(r"[^\w\s-]", "", slug, flags=re.UNICODE).strip()
    return re.sub(r"\s+", "-", slug)


def classify(category: str | None) -> list[str]:
    c = (category or "").lower()
    if re.search(r"kedai kopi|kopi|coffee|kafe|cafe|matcha|tea house", c):
        return ["kopi"]
    if re.search(
        r"restoran|restaurant|rumah makan|warung|bakery|toko roti|es |juice|bar\b|dessert|ice cream",
        c,
    ):
        return ["non-kopi"]
    return ["kopi"]  # default: kafe umum diasumsikan menyajikan kopi


def read_json(path: Path) -> list:
    if not path.exists():
        return []
    return json.loads(path.read_text(encoding="utf-8"))


def normalize_gmaps(c: dict) -> dict | None:
    if not c or not c.get("name"):
        return None
    return {
        "slug": slugify(c["name"]),
        "name": clean(c["name"]),
        "category": clean(c.get("category")),
        "types": classify(c.get("category")),
        "rating": c.get("rating"),
        "reviews": c.get("reviews"),
        "priceRange": c.get("priceRange"),
        "address": clean(c.get("address") or c.get("detailAddress")),
        "phone": clean(c.get("phone")),
        "website": clean(c.get("website")),
        "mapsUrl": c.get("mapsUrl"),
        "photoUrl": c.get("photoUrl"),
        "hoursToday": clean(c.get("hoursToday")) or clean(c.get("statusNow")),
        "hours": parse_hours_table(c.get("hoursTable")),
        "lat": c.get("lat"),
        "lon": c.get("lon"),
        "sources": ["google-maps"],
    }


def normalize_osm(c: dict) -> dict | None:
    if not c or not c.get("name"):
        return None
    cat = "Kafe" if "cafe" in (c.get("category") or "").lower() else c.get("category")
    hours_raw = c.get("hours")
    return {
        "slug": slugify(c["name"]),
        "name": clean(c["name"]),
        "category": clean(cat),
        "types": classify(cat),
        "rating": None,
        "reviews": None,
        "priceRange": None,
        "address": clean(c.get("address")),
        "phone": clean(c.get("phone")),
        "website": clean(c.get("website")),
        "mapsUrl": c.get("mapsUrl"),
        "photoUrl": None,
        "hoursToday": None,
        "hours": {"raw": hours_raw} if hours_raw else None,
        "lat": c.get("lat"),
        "lon": c.get("lon"),
        "sources": ["osm"],
    }


def norm_name(s: str | None) -> str:
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def main() -> None:
    gmaps = [
        g for g in map(normalize_gmaps, read_json(DATA_DIR / "google-maps-cafes.json")) if g
    ]
    osm = [o for o in map(normalize_osm, read_json(DATA_DIR / "osm-cafes.json")) if o]

    merged: dict[str, dict] = {}
    for c in gmaps:
        merged[norm_name(c["name"])] = c

    osm_added = 0
    for o in osm:
        key = norm_name(o["name"])
        existing = merged.get(key)
        if not existing:
            merged[key] = o
            osm_added += 1
        else:
            # perkaya entri google maps dengan data osm yang mungkin lebih lengkap
            if not existing.get("phone") and o.get("phone"):
                existing["phone"] = o["phone"]
            if not existing.get("website") and o.get("website"):
                existing["website"] = o["website"]
            if not existing.get("hours") and o.get("hours"):
                existing["hours"] = o["hours"]
            existing["sources"] = sorted(set(existing["sources"]) | set(o["sources"]))
    if osm_added:
        print(f"[merge] {osm_added} tempat tambahan dari OSM")

    # unikkan slug
    seen_slug: dict[str, int] = {}
    for c in merged.values():
        base = c["slug"]
        if base not in seen_slug:
            seen_slug[base] = 1
        else:
            n = seen_slug[base] + 1
            seen_slug[base] = n
            c["slug"] = f"{base}-{n}"

    result = sorted(merged.values(), key=lambda c: c.get("reviews") if c.get("reviews") is not None else -1, reverse=True)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")
    WEB_OUT.parent.mkdir(parents=True, exist_ok=True)
    WEB_OUT.write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding="utf-8")

    stats = {
        "total": len(result),
        "kopi": sum(1 for c in result if "kopi" in c["types"]),
        "non-kopi": sum(1 for c in result if "kopi" not in c["types"]),
        "denganJam": sum(1 for c in result if c.get("hours")),
        "denganFoto": sum(1 for c in result if c.get("photoUrl")),
        "denganTelepon": sum(1 for c in result if c.get("phone")),
    }
    print(f"[merge] SELESAI: {len(result)} tempat -> {OUT}")
    print(f"[merge] statistik: {json.dumps(stats)}")


if __name__ == "__main__":
    main()
