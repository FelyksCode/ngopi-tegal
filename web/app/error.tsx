"use client";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl px-4 py-32 text-center space-y-5">
      <h1 className="font-display text-3xl font-extrabold">Data gagal dimuat</h1>
      <p className="text-chalk-dim">
        File data kafe tidak bisa dibaca. Jalankan scraper di folder{" "}
        <code className="font-data text-amber">scraper-python</code> terlebih
        dahulu, lalu coba lagi.
      </p>
      <button
        onClick={reset}
        className="stamp rounded-[4px] px-4 py-2 text-xs font-semibold text-paper bg-ink-soft hover:bg-stamp transition-colors"
      >
        Coba lagi
      </button>
    </div>
  );
}
