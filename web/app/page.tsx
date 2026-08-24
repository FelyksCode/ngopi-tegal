import CafeExplorer from "@/components/CafeExplorer";
import { getAllCafes, getStats } from "@/lib/cafes";

export default function Home() {
  const stats = getStats();
  const cafes = getAllCafes();

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16">
        <div className="grid lg:grid-cols-[1fr_auto] gap-10 items-end">
          <div className="space-y-6">
            <p className="stamp inline-block rounded-[4px] px-3 py-1.5 text-[11px] font-semibold text-amber rotate-[-2deg]">
              Direktori kedai · edisi Tegal
            </p>
            <h1 className="font-display font-extrabold text-4xl sm:text-6xl leading-[1.05] tracking-tight text-balance">
              Mau ngopi, atau sekadar
              <br />
              <span className="text-amber">nongkrong enak</span> di Tegal?
            </h1>
            <p className="text-chalk-dim max-w-xl text-base sm:text-lg leading-relaxed">
              {stats.total} tempat di Kota &amp; Kabupaten Tegal. Jam buka,
              kisaran harga, rating, dan lokasi Google Maps dalam satu daftar.
            </p>
          </div>

          <dl className="flex lg:flex-col gap-6 lg:gap-4 shrink-0">
            <div className="stamp rounded-lg rotate-2 bg-paper px-5 py-3 text-stamp">
              <dt className="sr-only">Total tempat</dt>
              <dd className="font-display font-extrabold text-3xl leading-none">
                {stats.total}
              </dd>
              <dd className="mt-1 font-data text-[10px] uppercase tracking-[0.18em]">
                Tempat terdaftar
              </dd>
            </div>
            <div className="stamp rounded-lg rotate-[-1deg] bg-ink-soft px-5 py-3 text-amber">
              <dt className="sr-only">Kategori kopi</dt>
              <dd className="font-display font-extrabold text-3xl leading-none">
                {stats.kopi}
              </dd>
              <dd className="mt-1 font-data text-[10px] uppercase tracking-[0.18em]">
                Kafe &amp; kedai kopi
              </dd>
            </div>
            <div className="stamp rounded-lg rotate-1 bg-ink-soft px-5 py-3 text-chalk-dim">
              <dt className="sr-only">Kategori non-kopi</dt>
              <dd className="font-display font-extrabold text-3xl leading-none">
                {stats.nonKopi}
              </dd>
              <dd className="mt-1 font-data text-[10px] uppercase tracking-[0.18em]">
                Tempat non-kopi
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <CafeExplorer cafes={cafes} />
    </>
  );
}
