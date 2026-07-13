"use client";

import { useOnboarding } from "./onboarding-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const BIO_MAX = 300;

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
        <Label htmlFor="bio">Short bio</Label>
        <Textarea
          id="bio"
          rows={4}
          maxLength={BIO_MAX}
          value={data.bio}
          onChange={(e) => update({ bio: e.target.value })}
          placeholder="Tell clients what makes your work unique..."
        />
        <span className="self-end text-xs text-muted-foreground">
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
    </div>
  );
}

export function stepBasicsIsValid(data: {
  fullName: string;
  serviceArea: string;
}) {
  return data.fullName.trim().length > 0 && data.serviceArea.trim().length > 0;
}
