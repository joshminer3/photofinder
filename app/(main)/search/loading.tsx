export default function SearchLoading() {
  return (
    <div style={{ background: "#FDFCFB" }} className="min-h-[calc(100vh-4rem)]">
      <div style={{ padding: "10px 24px" }}>
        <div className="h-8 w-64 animate-pulse rounded-full" style={{ background: "#E6E2DD" }} />
      </div>
      <div style={{ padding: "16px 24px 48px" }} className="flex flex-col gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col overflow-hidden rounded-[10px] border sm:flex-row"
            style={{ borderColor: "#E6E2DD" }}
          >
            <div
              className="h-[180px] w-full shrink-0 animate-pulse sm:h-auto sm:w-[180px]"
              style={{ minHeight: "160px", background: "#E6E2DD" }}
            />
            <div className="flex flex-1 flex-col justify-center gap-2" style={{ padding: "14px 16px" }}>
              <div className="h-3 w-1/3 animate-pulse rounded" style={{ background: "#E6E2DD" }} />
              <div className="h-3 w-1/4 animate-pulse rounded" style={{ background: "#E6E2DD" }} />
              <div className="h-3 w-2/3 animate-pulse rounded" style={{ background: "#E6E2DD" }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
