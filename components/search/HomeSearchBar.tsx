"use client";

import { useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { US_STATES } from "@/lib/us-states";
import type { Specialty } from "@/lib/types/database";

export function HomeSearchBar({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [specialty, setSpecialty] = useState("any");
  const [state, setState] = useState("any");

  const specialtyItems = {
    any: "Any specialty",
    ...Object.fromEntries(specialties.map((s) => [s.slug, s.name])),
  };

  const stateItems = {
    any: "Any state",
    ...Object.fromEntries(US_STATES.map((s) => [s, s])),
  };

  function handleSearch() {
    const params = new URLSearchParams();
    if (specialty !== "any") params.set("specialty", specialty);
    if (state !== "any") params.set("state", state);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  }

  const labelStyle: CSSProperties = {
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: "var(--brand-text-muted)",
    marginBottom: "6px",
  };

  const fieldStyle: CSSProperties = {
    backgroundColor: "var(--brand-bg-card)",
    borderColor: "var(--brand-border)",
    color: "var(--brand-text-primary)",
    height: "40px",
    fontSize: "14px",
    borderRadius: "6px",
  };

  return (
    <div
      className="mx-auto flex w-full max-w-[540px] flex-col gap-3 rounded-xl border"
      style={{
        backgroundColor: "var(--brand-bg-card)",
        borderColor: "var(--brand-border)",
        padding: "20px",
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 flex-col text-left">
          <label style={labelStyle}>Specialty</label>
          <Select
            items={specialtyItems}
            value={specialty}
            onValueChange={(value: string | null) => setSpecialty(value ?? "any")}
          >
            <SelectTrigger className="w-full" style={fieldStyle}>
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

        <div className="flex flex-1 flex-col text-left">
          <label style={labelStyle}>State</label>
          <Select
            items={stateItems}
            value={state}
            onValueChange={(value: string | null) => setState(value ?? "any")}
          >
            <SelectTrigger className="w-full" style={fieldStyle}>
              <SelectValue placeholder="Any state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any state</SelectItem>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={handleSearch}
        className="w-full border-none hover:opacity-90"
        style={{
          backgroundColor: "var(--brand-text-primary)",
          color: "var(--brand-bg-page)",
          height: "42px",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: 600,
          letterSpacing: "-0.2px",
          marginTop: "12px",
        }}
      >
        Find Photographers
      </Button>
    </div>
  );
}
