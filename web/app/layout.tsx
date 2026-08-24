import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque, Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
});

const grotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "Ngopi Tegal: Daftar Kedai Kopi & Tempat Nongkrong di Tegal",
    template: "%s · Ngopi Tegal",
  },
  description:
    "Direktori lengkap kafe kedai kopi dan tempat nongkrong non-kopi di Kota & Kabupaten Tegal. Cari berdasarkan nama, filter kopi atau non-kopi, lihat jam buka, kisaran harga, dan lokasi Google Maps.",
  openGraph: {
    title: "Ngopi Tegal: Daftar Kedai Kopi & Tempat Nongkrong di Tegal",
    description:
      "Cari kafe kopi dan non-kopi di Tegal: jam buka, harga, rating, dan lokasi Google Maps.",
    locale: "id_ID",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${bricolage.variable} ${jakarta.variable} ${grotesk.variable}`}
    >
      <body className="antialiased min-h-screen flex flex-col">
        <header className="border-b border-chalk/10 sticky top-0 z-40 bg-ink/90 backdrop-blur">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            <Link href="/" className="flex items-baseline gap-2 group">
              <span className="font-display font-extrabold text-xl tracking-tight text-chalk group-hover:text-amber transition-colors">
                Ngopi<span className="text-amber">·</span>Tegal
              </span>
              <span className="hidden sm:inline font-data text-[11px] uppercase tracking-[0.18em] text-chalk-dim">
                direktori kedai
              </span>
            </Link>
            <Link
              href="/#daftar"
              className="font-data text-xs uppercase tracking-[0.14em] text-chalk-dim hover:text-amber transition-colors"
            >
              Daftar kafe
            </Link>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-chalk/10 mt-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between text-sm text-chalk-dim">
            {/* Page Theme Lock: dark (identitas papan kedai), satu tema untuk seluruh situs */}
            <p>
              Data dikumpulkan otomatis dari Google Maps &amp; OpenStreetMap.
              Informasi dapat berubah, cek ulang sebelum berkunjung.
            </p>
            <p className="font-data text-xs uppercase tracking-[0.18em] shrink-0">
              Kota &amp; Kabupaten Tegal
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
