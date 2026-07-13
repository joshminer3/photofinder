import { PhotographerCard, type SearchPhotographer } from "./PhotographerCard";

export function SearchResults({
  photographers,
}: {
  photographers: SearchPhotographer[];
}) {
  if (photographers.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        No photographers found for those filters.
        <br />
        Try broadening your search — remove a filter or expand your location.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {photographers.map((photographer) => (
        <PhotographerCard key={photographer.slug} photographer={photographer} />
      ))}
    </div>
  );
}
