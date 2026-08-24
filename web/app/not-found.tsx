import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center space-y-5">
      <p className="stamp inline-block rounded-[4px] px-3 py-1.5 text-[11px] font-semibold text-stamp rotate-[-2deg]">
        404 · tidak terdaftar
      </p>
      <h1 className="font-display text-3xl font-extrabold">Kafe tidak ditemukan</h1>
      <p className="text-chalk-dim">
        Tempat yang Anda cari tidak ada dalam daftar. Mungkin sudah tutup, atau
        belum masuk direktori.
      </p>
      <Link
        href="/#daftar"
        className="inline-block stamp rounded-[4px] px-4 py-2 text-xs font-semibold text-paper bg-ink-soft hover:bg-stamp transition-colors"
      >
        Lihat semua tempat
      </Link>
    </div>
  );
}
