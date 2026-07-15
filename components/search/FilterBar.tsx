"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/lib/use-is-mobile";
import { cn } from "@/lib/utils";
import type { Specialty } from "@/lib/types/database";

const pillClass =
  "inline-flex h-8 shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3.5 text-xs font-medium transition-colors cursor-pointer hover:bg-[#F5F2EE] hover:border-[#B8B3AE]";

function pillStyle(active: boolean): React.CSSProperties {
  return active
    ? { background: "#111010", color: "#FDFCFB", borderColor: "#111010" }
    : { background: "#FFFFFF", color: "#4C4845", borderColor: "#E6E2DD" };
}

function priceLabel(min: string, max: string) {
  if (min && max) return `$${min}–$${max}`;
  if (max) return `Under $${max}`;
  if (min) return `From $${min}`;
  return "Price ▾";
}

export function FilterBar({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile = useIsMobile();

  const specialtySlug = searchParams.get("specialty") ?? "";
  const location = searchParams.get("location") ?? "";
  const priceMin = searchParams.get("price_min") ?? "";
  const priceMax = searchParams.get("price_max") ?? "";
  const available = searchParams.get("available") === "true";
  const hasAnyFilter = Boolean(specialtySlug || location || priceMin || priceMax || available);

  const selectedSpecialtyName = specialties.find((s) => s.slug === specialtySlug)?.name;

  function updateParams(patch: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}${params.toString() ? `?${params}` : ""}`);
  }

  function clearAll() {
    router.push(pathname);
  }

  return (
    <div
      className="sticky top-16 z-30"
      style={{
        background: "#FFFFFF",
        borderBottom: "0.5px solid #EEEAE4",
      }}
    >
      <div
        className="mx-auto flex max-w-6xl items-center gap-2 overflow-x-auto"
        style={{ padding: "10px 24px" }}
      >
        <button type="button" className={pillClass} style={pillStyle(!hasAnyFilter)} onClick={clearAll}>
          All
        </button>

        <DropdownPill
          label={selectedSpecialtyName ? `${selectedSpecialtyName} ✓` : "Specialty ▾"}
          active={Boolean(specialtySlug)}
          title="Specialty"
          isMobile={isMobile}
        >
          {(close) => (
            <div className="flex flex-col gap-1">
              {specialties.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={cn(
                    "rounded-md px-2 py-1.5 text-left text-sm hover:bg-black/5",
                    specialtySlug === s.slug && "font-semibold",
                  )}
                  onClick={() => {
                    updateParams({ specialty: specialtySlug === s.slug ? null : s.slug });
                    close();
                  }}
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </DropdownPill>

        <LocationPill
          location={location}
          isMobile={isMobile}
          onApply={(value) => updateParams({ location: value || null })}
        />

        <PricePill
          priceMin={priceMin}
          priceMax={priceMax}
          isMobile={isMobile}
          onApply={(min, max) => updateParams({ price_min: min || null, price_max: max || null })}
        />

        <button
          type="button"
          className={pillClass}
          style={pillStyle(available)}
          onClick={() => updateParams({ available: available ? null : "true" })}
        >
          Available this month
        </button>
      </div>
    </div>
  );
}

function DropdownPill({
  label,
  active,
  title,
  isMobile,
  children,
}: {
  label: string;
  active: boolean;
  title: string;
  isMobile: boolean | null;
  children: (close: () => void) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <button type="button" className={pillClass} style={pillStyle(active)} onClick={() => setOpen(true)}>
          {label}
        </button>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="p-4">{children(close)}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={pillClass} style={pillStyle(active)}>
        {label}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto min-w-[180px]">
        {children(close)}
      </PopoverContent>
    </Popover>
  );
}

function LocationPill({
  location,
  isMobile,
  onApply,
}: {
  location: string;
  isMobile: boolean | null;
  onApply: (value: string) => void;
}) {
  const [draft, setDraft] = useState(location);

  return (
    <DropdownPill
      label={location || "Location ▾"}
      active={Boolean(location)}
      title="Location"
      isMobile={isMobile}
    >
      {(close) => (
        <div className="flex flex-col gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Utah County"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                onApply(draft);
                close();
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              onApply(draft);
              close();
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </DropdownPill>
  );
}

function PricePill({
  priceMin,
  priceMax,
  isMobile,
  onApply,
}: {
  priceMin: string;
  priceMax: string;
  isMobile: boolean | null;
  onApply: (min: string, max: string) => void;
}) {
  const [min, setMin] = useState(priceMin);
  const [max, setMax] = useState(priceMax);

  return (
    <DropdownPill
      label={priceLabel(priceMin, priceMax)}
      active={Boolean(priceMin || priceMax)}
      title="Price range"
      isMobile={isMobile}
    >
      {(close) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder="Min $"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              className="w-24"
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="number"
              min={0}
              placeholder="Max $"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              className="w-24"
            />
          </div>
          <Button
            size="sm"
            onClick={() => {
              onApply(min, max);
              close();
            }}
          >
            Apply
          </Button>
        </div>
      )}
    </DropdownPill>
  );
}
