"use client";

import { useOnboarding } from "./onboarding-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { US_STATES } from "@/lib/us-states";

const BIO_MAX = 500;

export function StepBasics() {
  const { data, update } = useOnboarding();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    update({ avatarFile: file, avatarPreviewUrl: URL.createObjectURL(file) });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">The basics</h2>
        <p className="text-sm text-muted-foreground">
          Let&apos;s start with who you are and where you work.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={data.avatarPreviewUrl ?? undefined} />
          <AvatarFallback>
            {data.fullName.slice(0, 1).toUpperCase() || "?"}
          </AvatarFallback>
        </Avatar>
        <div>
          <Label
            htmlFor="avatar"
            className="cursor-pointer text-sm font-medium underline"
          >
            Upload profile photo
          </Label>
          <Input
            id="avatar"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          value={data.fullName}
          onChange={(e) => update({ fullName: e.target.value })}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={4}
          maxLength={BIO_MAX}
          value={data.bio}
          onChange={(e) => update({ bio: e.target.value })}
          placeholder="Share your experience, specialties, and the kind of work you love to shoot..."
        />
        <span className="self-end text-xs" style={{ color: "#B8B3AE" }}>
          {data.bio.length}/{BIO_MAX}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="serviceArea">Service area</Label>
        <Input
          id="serviceArea"
          value={data.serviceArea}
          onChange={(e) => update({ serviceArea: e.target.value })}
          placeholder="e.g. Utah County & Salt Lake County"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>State</Label>
        <Select
          value={data.state}
          onValueChange={(value: string | null) => update({ state: value ?? "" })}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a state" />
          </SelectTrigger>
          <SelectContent>
            {US_STATES.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Used so clients can filter search results by state.
        </p>
      </div>
    </div>
  );
}

export function stepBasicsIsValid(data: {
  fullName: string;
  serviceArea: string;
  state: string;
}) {
  return (
    data.fullName.trim().length > 0 &&
    data.serviceArea.trim().length > 0 &&
    data.state.trim().length > 0
  );
}
