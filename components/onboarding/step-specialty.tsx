"use client";

import { useOnboarding } from "./onboarding-context";
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

export function StepSpecialty() {
  const { data, update, specialties } = useOnboarding();

  const secondaryOptions = specialties.filter(
    (s) => s.name !== data.primarySpecialty,
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Your specialty</h2>
        <p className="text-sm text-muted-foreground">
          What kind of photography do you focus on?
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Primary specialty</Label>
        <Select
          value={data.primarySpecialty}
          onValueChange={(value: string | null) => {
            const next = value ?? "";
            update({
              primarySpecialty: next,
              secondarySpecialty1:
                data.secondarySpecialty1 === next
                  ? ""
                  : data.secondarySpecialty1,
              secondarySpecialty2:
                data.secondarySpecialty2 === next
                  ? ""
                  : data.secondarySpecialty2,
            });
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a specialty" />
          </SelectTrigger>
          <SelectContent>
            {specialties.map((s) => (
              <SelectItem key={s.id} value={s.name}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <Label>Secondary specialty (optional)</Label>
          <Select
            value={data.secondarySpecialty1 || "none"}
            onValueChange={(value: string | null) =>
              update({ secondarySpecialty1: !value || value === "none" ? "" : value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {secondaryOptions
                .filter((s) => s.name !== data.secondarySpecialty2)
                .map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <Label>Secondary specialty (optional)</Label>
          <Select
            value={data.secondarySpecialty2 || "none"}
            onValueChange={(value: string | null) =>
              update({ secondarySpecialty2: !value || value === "none" ? "" : value })
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {secondaryOptions
                .filter((s) => s.name !== data.secondarySpecialty1)
                .map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Starting price range (optional)</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            placeholder="Min $"
            value={data.priceMin}
            onChange={(e) => update({ priceMin: e.target.value })}
          />
          <span className="text-muted-foreground">to</span>
          <Input
            type="number"
            min={0}
            placeholder="Max $"
            value={data.priceMax}
            onChange={(e) => update({ priceMax: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border p-4">
        <div>
          <p className="text-sm font-medium">Available this month</p>
          <p className="text-sm text-muted-foreground">
            Shown as an availability chip on your public profile.
          </p>
        </div>
        <Switch
          checked={data.availableThisMonth}
          onCheckedChange={(checked) => update({ availableThisMonth: checked })}
        />
      </div>
    </div>
  );
}

export function stepSpecialtyIsValid(data: { primarySpecialty: string }) {
  return data.primarySpecialty.trim().length > 0;
}
