import fs from "node:fs";
import path from "node:path";

export type CafeHours = Record<string, string | null>;

export interface Cafe {
  slug: string;
  name: string;
  category: string | null;
  types: ("kopi" | "non-kopi")[];
  rating: number | null;
  reviews: number | null;
  priceRange: "$" | "$$" | "$$$" | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  mapsUrl: string | null;
  photoUrl: string | null;
  hoursToday: string | null;
  hours: CafeHours | { raw: string } | null;
  lat: number | null;
  lon: number | null;
  sources: string[];
  addedAt?: string | null;
}

// data di-bundle di dalam web/ agar ikut ter-upload saat build Vercel
// (Root Directory = web; scraper-python menyalin hasil merge ke web/data/)
const DATA_PATH =
  process.env.DATA_PATH ?? path.join(process.cwd(), "data", "tegal-cafes.json");

let cache: Cafe[] | null = null;

export function getAllCafes(): Cafe[] {
  if (cache) return cache;
  const raw = fs.readFileSync(/* turbopackIgnore: true */ DATA_PATH, "utf8");
  cache = JSON.parse(raw) as Cafe[];
  return cache;
}

export function getCafeBySlug(slug: string): Cafe | undefined {
  return getAllCafes().find((c) => c.slug === slug);
}

export function getStats() {
  const all = getAllCafes();
  const kopi = all.filter((c) => c.types.includes("kopi")).length;
  return {
    total: all.length,
    kopi,
    nonKopi: all.length - kopi,
  };
}

export function waLink(phone: string | null): string | null {
  if (!phone) return null;
  const digits = phone.replace(/[^\d]/g, "");
  if (digits.startsWith("0")) return `https://wa.me/62${digits.slice(1)}`;
  if (digits.startsWith("62")) return `https://wa.me/${digits}`;
  return null;
}

export const DAY_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
