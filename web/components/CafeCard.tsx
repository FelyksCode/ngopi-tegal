import Image from "next/image";
import { ArrowRight, ArrowUpRight, Star } from "@phosphor-icons/react/dist/ssr";
import type { Cafe } from "@/lib/cafes";

/*
 * Radius scale (Shape Consistency Lock):
 *   stamps 4px (elemen "cap stempel", satu-satunya pengecualian)
 *   buttons & inputs 8px (rounded-lg)
 *   cards 12px (rounded-xl)
 */

export function StampBadge({ label }: { label: string }) {
  return (
    <span className="stamp inline-block rounded-[4px] bg-paper px-2 py-1 text-[10px] font-semibold text-stamp">
      {label}
    </span>
  );
}

export function Rating({ cafe }: { cafe: Cafe }) {
  if (cafe.rating == null) return null;
  return (
    <span className="inline-flex items-center gap-1.5 font-data text-sm">
      <Star weight="fill" className="text-amber" aria-hidden />
      <span className="font-medium">{cafe.rating.toLocaleString("id-ID")}</span>
      {cafe.reviews != null && (
        <span className="text-chalk-dim">({cafe.reviews.toLocaleString("id-ID")})</span>
      )}
    </span>
  );
}

export default function CafeCard({ cafe }: { cafe: Cafe }) {
  const isKopi = cafe.types.includes("kopi");
  const initial = cafe.name.charAt(0).toUpperCase();
  const isOpen = !!cafe.hoursToday && /^buka/i.test(cafe.hoursToday.trim());

  return (
    <article className="group relative flex flex-col rounded-xl overflow-hidden bg-paper text-ink shadow-[0_1px_0_rgba(238,243,236,0.08)] transition-transform duration-200 motion-safe:hover:-translate-y-1 motion-safe:active:scale-[0.99] focus-visible:outline-none">
      <div className="relative aspect-[16/10] bg-ink-soft">
        {cafe.photoUrl ? (
          <Image
            src={cafe.photoUrl}
            alt={`Foto ${cafe.name}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="absolute inset-0 grid place-items-center font-display text-5xl font-extrabold text-chalk/25"
          >
            {initial}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 p-4 sm:p-5 grow">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display font-bold leading-snug text-lg">
            <a
              href={`/kafe/${cafe.slug}`}
              className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stamp rounded-sm"
            >
              {cafe.name}
            </a>
          </h3>
          <Rating cafe={cafe} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <StampBadge label={isKopi ? "kopi" : "non-kopi"} />
          <p className="font-data text-xs uppercase tracking-[0.12em] text-ink/55">
            {cafe.category ?? "Tempat nongkrong"}
            {cafe.priceRange && (
              <>
                {" · "}
                <span className="text-amber">{cafe.priceRange}</span>
              </>
            )}
          </p>
        </div>

        <div className="mt-auto pt-2 space-y-2.5 text-sm">
          {cafe.hoursToday && (
            <p className="flex items-center gap-2 text-ink/75">
              <span
                className={`inline-block size-1.5 rounded-full ${
                  isOpen ? "bg-emerald-600" : "bg-stamp"
                }`}
                aria-hidden
              />
              <span className="line-clamp-1">{cafe.hoursToday}</span>
            </p>
          )}
          {cafe.address && (
            <p className="line-clamp-2 text-ink/60">{cafe.address}</p>
          )}
        </div>

        <div className="pt-3 flex items-center justify-between border-t border-ink/10">
          <a
            href={`/kafe/${cafe.slug}`}
            className="relative z-10 inline-flex items-center gap-1 font-data text-xs uppercase tracking-[0.14em] text-ink/70 hover:text-stamp transition-colors"
          >
            Detail
            <ArrowRight aria-hidden />
          </a>
          {cafe.mapsUrl && (
            <a
              href={cafe.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-10 inline-flex items-center gap-1 font-data text-xs uppercase tracking-[0.14em] text-ink/70 hover:text-stamp transition-colors"
            >
              Maps
              <ArrowUpRight aria-hidden />
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
