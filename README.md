# Ngopi Tegal

Daftar kafe kedai kopi dan tempat nongkrong non-kopi di Kota & Kabupaten Tegal.

Direktori berisi 105 tempat lengkap dengan jam buka, kisaran harga, rating, foto, dan lokasi Google Maps. Data dikumpulkan otomatis melalui web scraper, lalu ditampilkan sebagai website statis yang cepat dan ringan.

## Fitur

- Pencarian real-time berdasarkan nama, kategori, atau alamat
- Filter Kopi / Non-Kopi, urutkan berdasar popularitas, rating, atau nama
- Halaman detail statis per tempat (SSG): jam buka mingguan, telepon, WhatsApp, Google Maps
- JSON-LD (`CafeOrCoffeeShop`) untuk SEO
- Mobile-first dengan tema papan kedai

## Struktur Repo

```
ngopi-tegal/
├── scraper-python/            # App 1: web scraper (Python)
│   ├── scrape_maps.py         # Google Maps via Playwright + Microsoft Edge
│   ├── scrape_osm.py          # OpenStreetMap via Overpass API
│   └── merge.py               # gabung + bersihkan hasil
├── web/                       # App 2: website (Next.js 16 + Tailwind v4)
│   ├── app/                   # App Router: homepage, /kafe/[slug]
│   ├── components/            # CafeExplorer (search & filter), CafeCard
│   ├── lib/cafes.ts           # pembaca data + helper
│   └── data/tegal-cafes.json  # data final yang dibaca website saat build
└── data/                      # hasil raw scraper (cache & resume)
```

Alur data: `scraper-python` menulis raw ke `data/`, `merge.py` menggabungkan dan membersihkannya menjadi `data/tegal-cafes.json` + salinan `web/data/tegal-cafes.json`, lalu Next.js membacanya saat build (SSG).

## Menjalankan Scraper

```cmd
cd scraper-python
pip install -r requirements.txt
python scrape_maps.py
python scrape_osm.py
python merge.py
```

Catatan:

- Scraper memakai Microsoft Edge yang sudah terpasang di sistem, tanpa download browser tambahan.
- `scrape_maps.py` butuh sekitar 5-10 menit (scroll daftar + klik tiap tempat untuk detail).
- Hasil tersimpan otomatis per langkah (crash-safe) dan bisa dijalankan ulang tanpa mengulang dari awal.
- `HEADED=1 python scrape_maps.py` untuk menampilkan jendela browser bila hasil kosong.

## Menjalankan Website

```cmd
cd web
npm install
npm run dev
```

Buka http://localhost:3000. Build produksi: `npm run build`.

## Deploy

Deployment otomatis via GitHub Actions (`.github/workflows/vercel-deploy.yml`):

- Push ke `master` : deploy produksi
- Pull Request : deploy preview

Secrets yang dibutuhkan di repo GitHub:

| Secret | Sumber |
|---|---|
| `VERCEL_TOKEN` | Token dari vercel.com/account/settings/tokens |
| `VERCEL_ORG_ID` | `web/.vercel/project.json` |
| `VERCEL_PROJECT_ID` | `web/.vercel/project.json` |

Root Directory project Vercel harus di-set ke `web` agar build menemukan `web/data/`.

## Sumber Data & Disclaimer

Data dikumpulkan otomatis dari Google Maps dan OpenStreetMap. Informasi seperti jam buka, harga, dan nomor telepon dapat berubah sewaktu-waktu; mohon cek ulang sebelum berkunjung. Project ini tidak berafiliasi dengan kafe, kedai kopi, atau jaringan usaha mana pun.
