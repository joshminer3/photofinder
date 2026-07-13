export default function SearchLoading() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
      <div className="h-8 w-56 animate-pulse rounded bg-muted" />
      <div className="h-24 animate-pulse rounded-lg bg-muted" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-56 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    </div>
  );
}
