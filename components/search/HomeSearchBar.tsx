"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Specialty } from "@/lib/types/database";

export function HomeSearchBar({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [specialty, setSpecialty] = useState("any");
  const [location, setLocation] = useState("");

  const specialtyItems = {
    any: "Any specialty",
    ...Object.fromEntries(specialties.map((s) => [s.slug, s.name])),
  };

  function handleSearch() {
    const params = new URLSearchParams();
    if (specialty !== "any") params.set("specialty", specialty);
    if (location) params.set("location", location);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  return (
    <div className="flex w-full max-w-xl flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-end">
      <div className="flex flex-1 flex-col gap-2 text-left">
        <label className="text-sm font-medium">Specialty</label>
        <Select
          items={specialtyItems}
          value={specialty}
          onValueChange={(value: string | null) => setSpecialty(value ?? "any")}
        >
          <SelectTrigger className="w-full">
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

      <div className="flex flex-1 flex-col gap-2 text-left">
        <label className="text-sm font-medium">Location</label>
        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="e.g. Utah County"
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />
      </div>

      <Button onClick={handleSearch} size="lg" className="sm:w-auto">
        Find Photographers
      </Button>
    </div>
  );
}
