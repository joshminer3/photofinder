"use client";

import { useOnboarding } from "./onboarding-context";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function StepLinks() {
  const { data, update } = useOnboarding();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Links &amp; contact</h2>
        <p className="text-sm text-muted-foreground">
          These are shown publicly on your profile.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="instagram">Instagram URL</Label>
        <Input
          id="instagram"
          placeholder="https://instagram.com/yourhandle"
          value={data.instagramUrl}
          onChange={(e) => update({ instagramUrl: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="website">Personal website URL</Label>
        <Input
          id="website"
          placeholder="https://yoursite.com"
          value={data.websiteUrl}
          onChange={(e) => update({ websiteUrl: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="otherLinkLabel">Other link label</Label>
          <Input
            id="otherLinkLabel"
            placeholder="e.g. Booking page"
            value={data.otherLinkLabel}
            onChange={(e) => update({ otherLinkLabel: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="otherLinkUrl">Other link URL</Label>
          <Input
            id="otherLinkUrl"
            placeholder="https://..."
            value={data.otherLinkUrl}
            onChange={(e) => update({ otherLinkUrl: e.target.value })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="publicEmail">Public email</Label>
        <Input
          id="publicEmail"
          type="email"
          value={data.publicEmail}
          onChange={(e) => update({ publicEmail: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="publicPhone">Public phone</Label>
        <Input
          id="publicPhone"
          type="tel"
          value={data.publicPhone}
          onChange={(e) => update({ publicPhone: e.target.value })}
        />
      </div>
    </div>
  );
}
