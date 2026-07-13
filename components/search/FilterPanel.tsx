"use client";

import { useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Specialty } from "@/lib/types/database";

export function FilterPanel({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [location, setLocation] = useState(searchParams.get("location") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const specialtyItems = {
    any: "Any specialty",
    ...Object.fromEntries(specialties.map((s) => [s.slug, s.name])),
  };

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  function handleLocationChange(value: string) {
    setLocation(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParam("location", value || null);
    }, 400);
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:flex-wrap sm:items-end">
      <div className="flex flex-col gap-2">
        <Label>Specialty</Label>
        <Select
          items={specialtyItems}
          value={searchParams.get("specialty") ?? "any"}
          onValueChange={(value: string | null) =>
            updateParam("specialty", !value || value === "any" ? null : value)
          }
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Any specialty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any specialty</SelectItem>
            {specialties.map((s) => (
              <SelectItem key={s.id} value={s.slug}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={location}
          onChange={(e) => handleLocationChange(e.target.value)}
          placeholder="e.g. Utah County"
          className="sm:w-48"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Price range</Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={0}
            defaultValue={searchParams.get("price_min") ?? ""}
            onBlur={(e) => updateParam("price_min", e.target.value || null)}
            placeholder="Min $"
            className="w-24"
          />
          <span className="text-muted-foreground">–</span>
          <Input
            type="number"
            min={0}
            defaultValue={searchParams.get("price_max") ?? ""}
            onBlur={(e) => updateParam("price_max", e.target.value || null)}
            placeholder="Max $"
            className="w-24"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pb-1.5">
        <Switch
          id="available"
          checked={searchParams.get("available") === "true"}
          onCheckedChange={(checked) =>
            updateParam("available", checked ? "true" : null)
          }
        />
        <Label htmlFor="available">Available this month</Label>
      </div>
    </div>
  );
}
