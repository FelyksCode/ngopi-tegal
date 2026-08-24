import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  MapPin,
  WhatsappLogo,
  Globe,
} from "@phosphor-icons/react/dist/ssr";
import { StampBadge } from "@/components/CafeCard";
import {
  DAY_ORDER,
  getAllCafes,
  getCafeBySlug,
  waLink,
  type Cafe,
} from "@/lib/cafes";

export function generateStaticParams() {
  return getAllCafes().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const cafe = getCafeBySlug(slug);
  if (!cafe) return { title: "Kafe tidak ditemukan" };
  const desc = [
    cafe.name,
    cafe.category ? `${cafe.category} di Tegal` : "di Tegal",
    cafe.hoursToday,
    cafe.address,
  ]
    .filter(Boolean)
    .join(". ");
  return {
    title: cafe.name,
    description: desc,
    openGraph: {
      title: `${cafe.name} · Ngopi Tegal`,
      description: cafe.address ?? undefined,
      images: cafe.photoUrl ? [{ url: cafe.photoUrl }] : undefined,
    },
  };
}

function HoursTable({ cafe }: { cafe: Cafe }) {
  const hours = cafe.hours;
  if (!hours || "raw" in hours) return null;
  const todayIdx = (new Date().getDay() + 6) % 7; // Senin = 0
  return (
    <table className="w-full max-w-sm text-sm">
      <caption className="sr-only">Jam buka mingguan</caption>
      <tbody>
        {DAY_ORDER.map((day, i) => {
          const time = hours[day];
          const isToday = i === todayIdx;
          return (
            <tr
              key={day}
              className={isToday ? "text-amber font-medium" : "text-chalk-dim"}
            >
              <th scope="row" className="py-1.5 pr-4 font-data text-left font-normal uppercase tracking-[0.12em] text-xs">
                {day}
                {isToday && <span className="sr-only"> (hari ini)</span>}
              </th>
              <td className="py-1.5">{time ?? "—"}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function JsonLd({ cafe }: { cafe: Cafe }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: cafe.name,
    image: cafe.photoUrl ?? undefined,
    address: cafe.address ?? undefined,
    telephone: cafe.phone ?? undefined,
    geo:
      cafe.lat != null && cafe.lon != null
        ? { "@type": "GeoCoordinates", latitude: cafe.lat, longitude: cafe.lon }
        : undefined,
    servesCuisine: cafe.category ?? undefined,
    url: cafe.mapsUrl ?? undefined,
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const btnBase =
  "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 font-data text-xs uppercase tracking-[0.14em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber";

export default async function CafePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cafe = getCafeBySlug(slug);
  if (!cafe) notFound();

  const isKopi = cafe.types.includes("kopi");
  const wa = waLink(cafe.phone);

  return (
    <article className="mx-auto max-w-6xl px-4 sm:px-6 pt-10 pb-16">
      <JsonLd cafe={cafe} />

      <Link
        href="/#daftar"
        className="inline-flex items-center gap-1.5 font-data text-xs uppercase tracking-[0.14em] text-chalk-dim hover:text-amber transition-colors"
      >
        <ArrowLeft aria-hidden />
        Kembali ke daftar
      </Link>

      <div className="mt-6 grid lg:grid-cols-[1.2fr_1fr] gap-8 lg:gap-12 items-start">
        <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-ink-soft order-first lg:order-last lg:sticky lg:top-24">
          {cafe.photoUrl ? (
            <Image
              src={cafe.photoUrl}
              alt={`Foto ${cafe.name}`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 55vw"
              className="object-cover"
            />
          ) : (
            <div
              aria-hidden
              className="absolute inset-0 grid place-items-center font-display text-7xl font-extrabold text-chalk/25"
            >
              {cafe.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-wrap">
              <StampBadge label={isKopi ? "kopi" : "non-kopi"} />
              <p className="font-data text-xs uppercase tracking-[0.18em] text-chalk-dim">
                {cafe.category ?? "Tempat nongkrong"}
              </p>
            </div>
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl leading-tight text-balance">
              {cafe.name}
            </h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
              {cafe.rating != null && (
                <span className="inline-flex items-center gap-1.5 font-data">
                  <span className="text-amber text-base" aria-hidden>
                    ★
                  </span>
                  <span className="font-semibold">
                    {cafe.rating.toLocaleString("id-ID")}
                  </span>
                  {cafe.reviews != null && (
                    <span className="text-chalk-dim">
                      ({cafe.reviews.toLocaleString("id-ID")} ulasan)
                    </span>
                  )}
                </span>
              )}
              {cafe.priceRange && (
                <span className="font-data text-amber">{cafe.priceRange}</span>
              )}
              {cafe.hoursToday && (
                <span
                  className={`font-data ${
                    /^buka/i.test(cafe.hoursToday.trim())
                      ? "text-emerald-400"
                      : "text-stamp"
                  }`}
                >
                  {cafe.hoursToday}
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {cafe.mapsUrl && (
              <a
                href={cafe.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnBase} bg-amber text-ink font-semibold hover:bg-paper motion-safe:active:scale-[0.98]`}
              >
                <MapPin aria-hidden />
                Buka di Google Maps
                <ArrowUpRight aria-hidden />
              </a>
            )}
            {wa && (
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnBase} border border-chalk/20 text-chalk hover:border-amber hover:text-amber motion-safe:active:scale-[0.98]`}
              >
                <WhatsappLogo aria-hidden />
                Chat WhatsApp
              </a>
            )}
            {cafe.website && (
              <a
                href={
                  cafe.website.startsWith("http")
                    ? cafe.website
                    : `https://${cafe.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`${btnBase} border border-chalk/20 text-chalk hover:border-amber hover:text-amber motion-safe:active:scale-[0.98]`}
              >
                <Globe aria-hidden />
                Situs web
                <ArrowUpRight aria-hidden />
              </a>
            )}
          </div>

          {cafe.address && (
            <section aria-label="Alamat" className="space-y-2">
              <p className="text-chalk leading-relaxed">{cafe.address}</p>
              {cafe.phone && (
                <p className="mt-2 text-chalk-dim text-sm">
                  Telepon:{" "}
                  <a
                    href={`tel:${cafe.phone.replace(/[^\d+]/g, "")}`}
                    className="hover:text-amber transition-colors"
                  >
                    {cafe.phone}
                  </a>
                </p>
              )}
            </section>
          )}

          {cafe.hours && (
            <section aria-label="Jam buka mingguan">
              <h2 className="stamp inline-block rounded-[4px] px-2.5 py-1 text-[10px] font-semibold text-chalk-dim mb-3">
                Jam buka
              </h2>
              {"raw" in cafe.hours ? (
                <p className="text-chalk-dim text-sm">{cafe.hours.raw}</p>
              ) : (
                <HoursTable cafe={cafe} />
              )}
            </section>
          )}

          <p className="pt-2 font-data text-[10px] uppercase tracking-[0.18em] text-chalk-dim/70">
            Sumber: {cafe.sources.join(" + ")}. Dapat berubah, cek ulang sebelum berkunjung.
          </p>
        </div>
      </div>
    </article>
  );
}
