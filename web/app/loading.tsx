export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Memuat"
      className="mx-auto max-w-6xl px-4 sm:px-6 py-24 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-chalk/5 border border-chalk/10 animate-pulse">
          <div className="aspect-[16/10] rounded-t-xl bg-chalk/10" />
          <div className="p-5 space-y-3">
            <div className="h-4 w-3/4 rounded bg-chalk/10" />
            <div className="h-3 w-1/2 rounded bg-chalk/10" />
            <div className="h-3 w-2/3 rounded bg-chalk/10" />
          </div>
        </div>
      ))}
    </div>
  );
}
