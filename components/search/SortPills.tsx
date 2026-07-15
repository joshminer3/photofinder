"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price", label: "Price ↑" },
  { value: "rating", label: "Rating" },
];

export function SortPills() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeSort = searchParams.get("sort") ?? "newest";

  function setSort(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest") params.delete("sort");
    else params.set("sort", value);
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="hidden items-center gap-1.5 sm:flex">
      <span style={{ fontSize: "11px", color: "#7A7572" }}>Sort:</span>
      {SORT_OPTIONS.map((opt) => {
        const active = activeSort === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => setSort(opt.value)}
            className="inline-flex h-7 shrink-0 items-center rounded-full border px-2.5 whitespace-nowrap transition-colors hover:bg-[#F5F2EE] hover:border-[#B8B3AE]"
            style={{
              fontSize: "11px",
              ...(active
                ? { background: "#111010", color: "#FDFCFB", borderColor: "#111010" }
                : { background: "#FFFFFF", color: "#4C4845", borderColor: "#E6E2DD" }),
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
