"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CircleNotch,
  DiceFive,
  MagnifyingGlass,
} from "@phosphor-icons/react/dist/ssr";
import type { Cafe } from "@/lib/cafes";
import CafeCard from "./CafeCard";

type TypeFilter = "semua" | "kopi" | "non-kopi";
type SortKey = "populer" | "rating" | "nama" | "terbaru";

const PAGE_SIZE = 30;

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "kopi", label: "Kopi" },
  { key: "non-kopi", label: "Non-Kopi" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "populer", label: "Terpopuler" },
  { key: "rating", label: "Rating tertinggi" },
  { key: "terbaru", label: "Terbaru" },
  { key: "nama", label: "Nama A-Z" },
];

export default function CafeExplorer({ cafes }: { cafes: Cafe[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState<TypeFilter>("semua");
  const [sort, setSort] = useState<SortKey>("populer");
  const [page, setPage] = useState(1);
  const [rolling, setRolling] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = cafes.filter((c) => {
      if (type !== "semua" && !c.types.includes(type)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        (c.category ?? "").toLowerCase().includes(q) ||
        (c.address ?? "").toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "nama") return a.name.localeCompare(b.name, "id");
      if (sort === "rating")
        return (b.rating ?? -1) - (a.rating ?? -1) || (b.reviews ?? 0) - (a.reviews ?? 0);
      if (sort === "terbaru") {
        const byDate = (b.addedAt ?? "").localeCompare(a.addedAt ?? "");
        return byDate || (b.reviews ?? 0) - (a.reviews ?? 0);
      }
      return (b.reviews ?? -1) - (a.reviews ?? -1);
    });

    return list;
  }, [cafes, query, type, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // reset ke halaman 1 saat filter/urutan berubah (pola resmi React:
  // menyesuaikan state saat render, bukan lewat effect)
  const filterKey = `${query}|${type}|${sort}`;
  const [lastFilterKey, setLastFilterKey] = useState(filterKey);
  if (filterKey !== lastFilterKey) {
    setLastFilterKey(filterKey);
    setPage(1);
  }

  const start = (safePage - 1) * PAGE_SIZE;
  const end = Math.min(start + PAGE_SIZE, filtered.length);
  const pageItems = filtered.slice(start, end);

  function goToPage(p: number) {
    if (p < 1 || p > totalPages || p === safePage) return;
    setPage(p);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("daftar")?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
    });
  }

  function lucky() {
    if (rolling || cafes.length === 0) return;
    setRolling(true);
    const pick = cafes[Math.floor(Math.random() * cafes.length)];
    window.setTimeout(() => router.push(`/kafe/${pick.slug}`), 800);
  }

  return (
    <section id="daftar" className="mx-auto max-w-6xl px-4 sm:px-6 scroll-mt-20">
      <div className="flex flex-col gap-4 py-8 border-y border-chalk/10">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <label className="relative grow">
            <span className="sr-only">Cari nama kafe atau alamat</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama kafe, kategori, atau alamat…"
              className="w-full h-11 rounded-lg bg-chalk/5 border border-chalk/15 px-4 pr-10 text-sm placeholder:text-chalk-dim/70 focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber"
            />
            <span
              aria-hidden
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-chalk-dim"
            >
              <MagnifyingGlass />
            </span>
          </label>

          <div className="flex gap-3 shrink-0">
            <label>
              <span className="sr-only">Urutkan</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="h-11 rounded-lg bg-chalk/5 border border-chalk/15 px-3 font-data text-xs uppercase tracking-[0.12em] text-chalk-dim focus:outline-none focus:border-amber cursor-pointer"
              >
                {SORTS.map((s) => (
                  <option key={s.key} value={s.key} className="bg-ink text-chalk">
                    {s.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={lucky}
              disabled={rolling}
              aria-busy={rolling}
              className="stamp inline-flex items-center gap-2 rounded-lg px-4 font-data text-xs uppercase tracking-[0.14em] font-semibold bg-amber text-ink hover:bg-paper disabled:opacity-80 motion-safe:active:scale-[0.98] transition-colors cursor-pointer"
            >
              {rolling ? (
                <>
                  <CircleNotch aria-hidden className="motion-safe:animate-spin" />
                  Memilih…
                </>
              ) : (
                <>
                  <DiceFive aria-hidden />
                  Kafe acak
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div role="group" aria-label="Filter jenis tempat" className="flex gap-2">
            {TYPE_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setType(f.key)}
                aria-pressed={type === f.key}
                className={`stamp rounded-[4px] px-3 py-1.5 text-[11px] font-semibold transition-colors motion-safe:active:scale-[0.98] ${
                  type === f.key
                    ? "bg-stamp text-paper rotate-[-2deg]"
                    : "text-chalk-dim hover:text-chalk"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <p
            className="font-data text-xs uppercase tracking-[0.14em] text-chalk-dim"
            role="status"
          >
            {filtered.length === 0
              ? "0 tempat"
              : `Menampilkan ${start + 1}-${end} dari ${filtered.length} tempat`}
          </p>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-24 text-center space-y-4">
          <p className="font-display text-2xl font-bold">Tidak ada yang cocok</p>
          <p className="text-chalk-dim text-sm max-w-md mx-auto">
            Coba kata kunci lain, atau hapus filter untuk melihat semua tempat.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setType("semua");
            }}
            className="stamp rounded-[4px] px-4 py-2 text-xs font-semibold text-paper bg-ink-soft hover:bg-stamp transition-colors"
          >
            Hapus pencarian & filter
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 py-10">
            {pageItems.map((cafe) => (
              <CafeCard key={cafe.slug} cafe={cafe} />
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              aria-label="Navigasi halaman daftar kafe"
              className="flex items-center justify-center gap-2 pb-16"
            >
              <button
                type="button"
                onClick={() => goToPage(safePage - 1)}
                disabled={safePage === 1}
                aria-label="Halaman sebelumnya"
                className="inline-flex items-center justify-center size-10 rounded-lg border border-chalk/15 text-chalk-dim hover:text-amber hover:border-amber disabled:opacity-30 disabled:hover:text-chalk-dim disabled:hover:border-chalk/15 transition-colors"
              >
                <ArrowLeft aria-hidden />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => goToPage(p)}
                  aria-current={p === safePage ? "page" : undefined}
                  className={`size-10 rounded-lg font-data text-sm transition-colors ${
                    p === safePage
                      ? "bg-stamp text-paper font-semibold"
                      : "border border-chalk/15 text-chalk-dim hover:text-amber hover:border-amber"
                  }`}
                >
                  {p}
                </button>
              ))}

              <button
                type="button"
                onClick={() => goToPage(safePage + 1)}
                disabled={safePage === totalPages}
                aria-label="Halaman berikutnya"
                className="inline-flex items-center justify-center size-10 rounded-lg border border-chalk/15 text-chalk-dim hover:text-amber hover:border-amber disabled:opacity-30 disabled:hover:text-chalk-dim disabled:hover:border-chalk/15 transition-colors"
              >
                <ArrowRight aria-hidden />
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}
