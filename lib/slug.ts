export function slugifyName(fullName: string): string {
  const base = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return base || "photographer";
}

export function generateSlugCandidate(fullName: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000);
  return `${slugifyName(fullName)}-${suffix}`;
}
