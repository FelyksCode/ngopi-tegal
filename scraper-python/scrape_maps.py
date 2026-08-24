"""Scraper kafe Tegal dari Google Maps via Playwright (browser: Microsoft Edge).

Cara pakai:
  python scrape_maps.py                 -> normal (list + detail)
  HEADED=1 python scrape_maps.py        -> tampilkan jendela browser (kalau diblokir bot)
  python scrape_maps.py --list-only     -> tanpa klik tiap tempat (cepat, data kurang lengkap)

Output: ../data/google-maps-cafes.json
"""
import json
import os
import re
import sys
import time
from pathlib import Path
from urllib.parse import quote, unquote, urlparse

from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
OUT = DATA_DIR / "google-maps-cafes.json"

LIST_ONLY = "--list-only" in sys.argv
HEADED = os.environ.get("HEADED", "") not in ("", "0")
QUERIES = [
    "kafe di Kota Tegal",
    "kedai kopi di Tegal",
    "coffee shop di Tegal",
]
MAX_PER_QUERY = 60
SCROLL_STAGNANT_LIMIT = 4

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"
)


def sleep(ms: float) -> None:
    time.sleep(ms / 1000)


def load_existing() -> dict[str, dict]:
    if not OUT.exists():
        return {}
    try:
        arr = json.loads(OUT.read_text(encoding="utf-8"))
        return {c["placeKey"]: c for c in arr}
    except Exception:  # noqa: BLE001
        return {}


def save(store: dict[str, dict]) -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    arr = sorted(store.values(), key=lambda c: c.get("reviews") or -1, reverse=True)
    OUT.write_text(json.dumps(arr, indent=2, ensure_ascii=False), encoding="utf-8")


def place_key_from_href(href: str) -> str:
    m = re.search(r"!1s(0x[0-9a-f]+:0x[0-9a-f]+)", href)
    if m:
        return m.group(1)
    try:
        part = urlparse(href).path.split("/place/")[-1].split("/")[0]
        return unquote(part) or href
    except Exception:  # noqa: BLE001
        return href


def coords_from_href(href: str) -> tuple[float | None, float | None]:
    m = re.search(r"!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)", href)
    if not m:
        return None, None
    return float(m.group(1)), float(m.group(2))


# "Rp 25–50 rb" / "Rp 50.000–100.000" -> "$" | "$$" | "$$$"
NUM_TOKEN = re.compile(r"([\d.,]+)\s*(rb|ribu)?", re.IGNORECASE)


def price_bucket(price_text: str | None) -> str | None:
    if not price_text:
        return None
    nums: list[float] = []
    for m in NUM_TOKEN.finditer(price_text):
        raw = m.group(1).replace(".", "").replace(",", ".")
        v = float(raw) if raw else 0.0
        unit = m.group(2) or ""
        if "rb" in unit.lower() or "ribu" in unit.lower() or v < 1000:
            v *= 1000
        nums.append(v)
    if not nums:
        return None
    mx = max(nums)
    if mx == 0:
        return None
    if mx <= 25_000:
        return "$"
    if mx <= 60_000:
        return "$$"
    return "$$$"


def dismiss_consent(page) -> None:
    if "consent" not in page.url:
        return
    print("[maps] layar consent terdeteksi, mencoba menyetujui...")
    for label in ["Terima semua", "Accept all", "Setuju", "I agree"]:
        btn = page.get_by_role("button", name=label).first
        if btn.count():
            try:
                btn.click(timeout=3000)
                page.wait_for_load_state("domcontentloaded")
                if "consent" not in page.url:
                    return
            except Exception:  # noqa: BLE001
                pass
    page.keyboard.press("Enter")
    sleep(1500)


def scroll_to_feed_end(page) -> None:
    feed = page.locator('div[role="feed"]')
    feed.wait_for(state="visible", timeout=20_000)
    sleep(1200)

    stagnant = 0
    rnd = 0
    while rnd < 80 and stagnant < SCROLL_STAGNANT_LIMIT:
        rnd += 1
        before = feed.evaluate("el => ({ h: el.scrollHeight, top: el.scrollTop })")
        feed.evaluate("el => el.scrollBy(0, el.clientHeight * 3)")
        sleep(1300)

        end_marker = page.locator(
            'div[role="feed"] p.fontBodyMedium, div[role="feed"] span.HlvSq'
        ).filter(has_text=re.compile(r"akhir dari|end of|reached the end", re.I)).count()

        after = feed.evaluate("el => ({ h: el.scrollHeight, top: el.scrollTop })")
        moved = after["h"] != before["h"] or after["top"] != before["top"]

        count = page.locator("a.hfpxzc").count()
        print(f"[maps] scroll #{rnd}: {count} hasil ditemukan")

        if end_marker:
            break
        stagnant = 0 if moved else stagnant + 1

        if count >= MAX_PER_QUERY:
            print(f"[maps] cap {MAX_PER_QUERY} tercapai")
            break


EXTRACT_LISTINGS_JS = """
(anchors) => anchors.map((a) => {
  const scope = a.closest('div.Nv2PK') || a.parentElement;
  const txt = (sel) => {
    const el = scope.querySelector(sel);
    return el ? el.textContent.replace(/\\s+/g, ' ').trim() : null;
  };

  const rating = txt('.MW4etd');
  const reviews = txt('.UY7F9');

  // Baris info: kategori · fasilitas · alamat
  const infoRow = scope.querySelector('.W4Efsd .W4Efsd');
  let category = null;
  let address = null;
  if (infoRow) {
    const parts = [...infoRow.querySelectorAll(':scope > span')]
      .map((s) => (s.textContent || '').replace(/\\s+/g, ' ').trim())
      .filter((t) => t && t !== '\\u00b7' && /[a-zA-Z0-9]/.test(t));
    category =
      parts.find((t) => !/^(Jl|Jalan|Gg\\.?|Gang|Komplek|Pasar|Perum|Jr\\.?)\\b/i.test(t)) ||
      parts[0] || null;
    address =
      parts.find((t) =>
        /^(Jl|Jalan|Gg\\.?|Gang|Komplek|Pasar|Perum|Jr\\.?|Depan|Samping|Seberang)\\b/i.test(t)
      ) || null;
  }

  const statusNow =
    [...scope.querySelectorAll('.W4Efsd')]
      .map((el) => (el.textContent || '').replace(/\\s+/g, ' ').trim())
      .find((t) => /^(Buka|Tutup)\\b/i.test(t)) || null;

  const img = scope.querySelector("img[src*='googleusercontent']");
  const photoUrl = img && img.src ? img.src.replace(/=w\\d+-h\\d+[^/=]*$/i, '=w800-h520-k-no') : null;

  return {
    name: a.getAttribute('aria-label'),
    mapsUrl: a.href,
    rating,
    reviews,
    category,
    address,
    statusNow,
    photoUrl,
  };
})
"""


def extract_listings(page) -> list[dict]:
    return page.eval_on_selector_all("a.hfpxzc", EXTRACT_LISTINGS_JS)


def parse_listing(raw: dict, query: str) -> dict | None:
    name = raw.get("name")
    if not name:
        return None
    lat, lon = coords_from_href(raw["mapsUrl"])
    rating_raw = raw.get("rating")
    reviews_raw = raw.get("reviews")

    try:
        rating = float(str(rating_raw).replace(",", ".")) if rating_raw else None
    except ValueError:
        rating = None
    try:
        reviews = int(re.sub(r"[^\d]", "", reviews_raw)) if reviews_raw else None
    except ValueError:
        reviews = None

    return {
        "name": re.sub(r"\s+", " ", name).strip(),
        "placeKey": place_key_from_href(raw["mapsUrl"]),
        "mapsUrl": raw["mapsUrl"],
        "category": raw.get("category"),
        "priceRange": None,
        "rating": rating,
        "reviews": reviews,
        "address": raw.get("address"),
        "statusNow": raw.get("statusNow"),
        "photoUrl": raw.get("photoUrl"),
        "lat": lat,
        "lon": lon,
        "queriesFoundIn": [query],
        "source": "google-maps",
    }


PRICE_TEXT_JS = """
() => {
  const els = [...document.querySelectorAll('[role="main"] span, [role="main"] button')];
  const hit = els.map((el) => (el.textContent || '').trim()).find(
    (t) => t && t.length <= 30 && /Rp\\s?\\d/i.test(t) && !/menu|ulasan/i.test(t)
  );
  return hit || null;
}
"""

HOURS_TABLE_JS = """
(tbl) => [...tbl.querySelectorAll('tr')].map((tr) =>
  [...tr.querySelectorAll('td, th')]
    .map((td) => (td.textContent || '').replace(/\\s+/g, ' ').trim())
    .filter(Boolean)
    .join(': ')
).filter(Boolean)
"""


def extract_detail(page) -> dict:
    main = page.locator('[role="main"]')
    out: dict = {}

    def txt(sel: str) -> str | None:
        loc = main.locator(sel).first
        try:
            if not loc.count():
                return None
            t = " ".join(loc.inner_text(timeout=2500).split())
            return t or None
        except Exception:  # noqa: BLE001
            return None

    out["detailAddress"] = txt('[data-item-id^="address"]')
    out["detailCategory"] = txt('button[jsaction*="category"], button.DkEaL')

    try:
        out["priceText"] = page.evaluate(PRICE_TEXT_JS)
    except Exception:  # noqa: BLE001
        out["priceText"] = None

    phone = txt('[data-item-id^="phone"]')
    out["phone"] = re.sub(r"^Telepon:\s*", "", phone, flags=re.I).strip() if phone else None
    out["website"] = txt('[data-item-id="authority"]')

    # tombol jam buka (UI baru): div[role=button][jsaction*=openhours]
    hours_btn = main.locator('div[role="button"][jsaction*="openhours"]').first
    try:
        has_hours = hours_btn.count() > 0
    except Exception:  # noqa: BLE001
        has_hours = False
    if has_hours:
        try:
            out["hoursToday"] = " ".join(hours_btn.inner_text(timeout=2500).split()) or None
        except Exception:  # noqa: BLE001
            out["hoursToday"] = None
        if not LIST_ONLY:
            try:
                hours_btn.click(timeout=2500)
            except Exception:  # noqa: BLE001
                pass
            sleep(800)
            try:
                tbl = main.locator("table").first
                out["hoursTable"] = tbl.evaluate(HOURS_TABLE_JS) if tbl.count() else None
            except Exception:  # noqa: BLE001
                out["hoursTable"] = None
            sleep(400)

    return out


def run_query(page, query: str, store: dict[str, dict]) -> None:
    url = f"https://www.google.com/maps/search/{quote(query)}?hl=id&gl=id"
    print(f'\n[maps] query: "{query}"')
    page.goto(url, wait_until="domcontentloaded", timeout=45_000)
    dismiss_consent(page)
    scroll_to_feed_end(page)

    raw_listings = extract_listings(page)
    print(f"[maps] diekstrak {len(raw_listings)} entri dari daftar")

    parsed = [p for p in map(lambda r: parse_listing(r, query), raw_listings) if p]

    added = 0
    for cafe in parsed:
        existing = store.get(cafe["placeKey"])
        if existing:
            existing["queriesFoundIn"] = sorted(
                set(existing.get("queriesFoundIn", [])) | {query}
            )
            continue
        store[cafe["placeKey"]] = cafe
        added += 1
    print(f"[maps] baru: {added}, total unik: {len(store)}")

    save(store)

    if LIST_ONLY:
        return

    # ---- deep pass: klik tiap hasil untuk detail ----
    done = 0
    limit = min(len(raw_listings), MAX_PER_QUERY)
    for i in range(limit):
        raw = raw_listings[i]
        key = place_key_from_href(raw["mapsUrl"])
        target = store.get(key)
        # lewati hanya jika sudah punya detail lengkap termasuk jam buka
        if not target or (target.get("detailAddress") is not None and target.get("hoursTable")):
            continue
        try:
            page.locator("a.hfpxzc").nth(i).click(timeout=8000)
            page.locator('[role="main"] h1').first.wait_for(state="visible", timeout=10_000)
            sleep(600)

            target.update(extract_detail(page))
            target["address"] = target.get("detailAddress") or target.get("address")
            if target.get("detailCategory"):
                target["category"] = target["detailCategory"]
            bucket = price_bucket(target.pop("priceText", None))
            if bucket:
                target["priceRange"] = bucket
            done += 1

            page.keyboard.press("Escape")
            sleep(500)

            if done % 10 == 0:
                print(f"[maps] deep pass: {done} detail diambil (total {len(store)})")
                save(store)
        except PWTimeout as err:
            print(f'[maps] gagal ambil detail "{raw.get("name")}": timeout')
            page.keyboard.press("Escape")
            sleep(500)
        except Exception as err:  # noqa: BLE001
            msg = str(err).split("\n")[0]
            print(f'[maps] gagal ambil detail "{raw.get("name")}": {msg}')
            page.keyboard.press("Escape")
            sleep(500)
    print(f"[maps] deep pass selesai: {done} detail")


def main() -> None:
    mode = "list-only" if LIST_ONLY else "list + detail"
    print(f"[maps] mode: {mode} | headed: {HEADED}")
    store = load_existing()
    if store:
        print(f"[maps] lanjut dari cache: {len(store)} tempat")

    with sync_playwright() as p:
        browser = p.chromium.launch(channel="msedge", headless=not HEADED)
        try:
            context = browser.new_context(
                viewport={"width": 1440, "height": 900},
                locale="id-ID",
                timezone_id="Asia/Jakarta",
                user_agent=UA,
            )
            page = context.new_page()
            for q in QUERIES:
                try:
                    run_query(page, q, store)
                except Exception as err:  # noqa: BLE001
                    print(f'[maps] query "{q}" error: {str(err).splitlines()[0]}')
            save(store)
            print(f"\n[maps] SELESAI: {len(store)} tempat unik -> {OUT}")
        finally:
            browser.close()


if __name__ == "__main__":
    main()
