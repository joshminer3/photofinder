import { Button } from "@/components/ui/button";

export function EmptyState({ hasAnyFilter }: { hasAnyFilter: boolean }) {
  return (
    <div
      className="mx-auto flex max-w-md flex-col items-center gap-3 text-center"
      style={{ padding: "60px 24px" }}
    >
      <p style={{ fontSize: "14px", fontWeight: 500, color: "#111010", marginBottom: "6px" }}>
        No photographers found.
      </p>
      <p style={{ fontSize: "12px", color: "#7A7572" }}>
        {hasAnyFilter
          ? "Try removing a filter or expanding your location."
          : "Check back soon as more photographers join Foto."}
      </p>
      {hasAnyFilter && (
        <Button
          render={<a href="/search" />}
          nativeButton={false}
          variant="outline"
          className="rounded-full"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );
}
