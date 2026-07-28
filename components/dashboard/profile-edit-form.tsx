"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { X, Film } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { MAX_PHOTOS, MAX_VIDEOS } from "@/lib/portfolio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Specialty } from "@/lib/types/database";
import { US_STATES } from "@/lib/us-states";

const BIO_MAX = 300;

type ExistingPortfolioItem = {
  id: string;
  type: "photo" | "video";
  storagePath: string;
  displayOrder: number;
  url: string;
};

type NewPortfolioItem = {
  localId: string;
  file: File;
  previewUrl: string;
  type: "photo" | "video";
};

type FormData = {
  fullName: string;
  avatarUrl: string | null;
  bio: string;
  serviceArea: string;
  state: string;
  primarySpecialty: string;
  secondarySpecialty1: string;
  secondarySpecialty2: string;
  priceMin: string;
  priceMax: string;
  availableThisMonth: boolean;
  instagramUrl: string;
  websiteUrl: string;
  otherLinkUrl: string;
  otherLinkLabel: string;
  publicEmail: string;
  publicPhone: string;
  portfolioItems: ExistingPortfolioItem[];
};

async function uploadFile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  file: File,
  prefix: string,
) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${prefix}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("portfolios").upload(path, file);
  if (error) throw error;
  return path;
}

export function ProfileEditForm({
  userId,
  photographerId,
  specialties,
  initialData,
}: {
  userId: string;
  photographerId: string;
  specialties: Specialty[];
  initialData: FormData;
}) {
  const [data, setData] = useState(initialData);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initialData.avatarUrl);
  const [newItems, setNewItems] = useState<NewPortfolioItem[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  function update(patch: Partial<FormData>) {
    setData((prev) => ({ ...prev, ...patch }));
  }

  const remainingExisting = data.portfolioItems.filter((i) => !deletedIds.has(i.id));
  const photoCount =
    remainingExisting.filter((i) => i.type === "photo").length +
    newItems.filter((i) => i.type === "photo").length;
  const videoCount =
    remainingExisting.filter((i) => i.type === "video").length +
    newItems.filter((i) => i.type === "video").length;

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function addFiles(files: FileList | null, type: "photo" | "video") {
    if (!files) return;
    const currentCount = type === "photo" ? photoCount : videoCount;
    const limit = type === "photo" ? MAX_PHOTOS : MAX_VIDEOS;
    const room = Math.max(0, limit - currentCount);

    const items: NewPortfolioItem[] = Array.from(files)
      .slice(0, room)
      .map((file) => ({
        localId: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
        type,
      }));

    setNewItems((prev) => [...prev, ...items]);
  }

  function toggleDelete(id: string) {
    setDeletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function removeNewItem(localId: string) {
    setNewItems((prev) => prev.filter((i) => i.localId !== localId));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();

    try {
      let avatarUrl = data.avatarUrl;
      if (avatarFile) {
        const path = await uploadFile(supabase, userId, avatarFile, "avatar");
        avatarUrl = supabase.storage.from("portfolios").getPublicUrl(path).data.publicUrl;
      }

      const { error: profileError } = await supabase
        .from("profiles")
        .update({ full_name: data.fullName, avatar_url: avatarUrl })
        .eq("id", userId);
      if (profileError) throw profileError;

      const { error: photographerError } = await supabase
        .from("photographer_profiles")
        .update({
          bio: data.bio || null,
          service_area: data.serviceArea || null,
          state: data.state || null,
          primary_specialty: data.primarySpecialty,
          secondary_specialty_1: data.secondarySpecialty1 || null,
          secondary_specialty_2: data.secondarySpecialty2 || null,
          price_range_min: data.priceMin ? Number(data.priceMin) : null,
          price_range_max: data.priceMax ? Number(data.priceMax) : null,
          available_this_month: data.availableThisMonth,
          instagram_url: data.instagramUrl || null,
          website_url: data.websiteUrl || null,
          other_link_url: data.otherLinkUrl || null,
          other_link_label: data.otherLinkLabel || null,
          public_email: data.publicEmail || null,
          public_phone: data.publicPhone || null,
          // A previously-rejected photographer resubmits by editing and
          // saving — clear the rejection so they re-enter the pending queue.
          // Suspensions are left untouched; those require admin action.
          rejected_at: null,
          rejection_reason: null,
        })
        .eq("id", photographerId);
      if (photographerError) throw photographerError;

      if (deletedIds.size > 0) {
        const toDelete = data.portfolioItems.filter((i) => deletedIds.has(i.id));
        const { error: storageError } = await supabase.storage
          .from("portfolios")
          .remove(toDelete.map((i) => i.storagePath));
        if (storageError) throw storageError;

        const { error: deleteRowsError } = await supabase
          .from("portfolio_items")
          .delete()
          .in("id", toDelete.map((i) => i.id));
        if (deleteRowsError) throw deleteRowsError;
      }

      if (newItems.length > 0) {
        const maxOrder = Math.max(
          -1,
          ...data.portfolioItems.map((i) => i.displayOrder),
        );
        const uploaded = await Promise.all(
          newItems.map(async (item, index) => {
            const path = await uploadFile(supabase, userId, item.file, item.type);
            return {
              photographer_id: photographerId,
              storage_path: path,
              type: item.type,
              display_order: maxOrder + 1 + index,
            };
          }),
        );
        const { error: insertError } = await supabase
          .from("portfolio_items")
          .insert(uploaded);
        if (insertError) throw insertError;
      }

      setData((prev) => ({
        ...prev,
        avatarUrl,
        portfolioItems: prev.portfolioItems.filter((i) => !deletedIds.has(i.id)),
      }));
      setDeletedIds(new Set());
      setNewItems([]);
      setAvatarFile(null);
      toast("Profile updated.");
    } catch {
      toast("Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const secondaryOptions = specialties.filter((s) => s.name !== data.primarySpecialty);

  return (
    <div className="flex flex-col gap-8">
      {/* Section 1: Basics */}
      <section className="flex flex-col gap-4">
        <h2 className="dashboard-section-heading">Basics</h2>
        <div className="flex items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={avatarPreview ?? undefined} />
            <AvatarFallback>{data.fullName.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
          </Avatar>
          <div>
            <Label htmlFor="avatar" className="cursor-pointer text-sm font-medium underline">
              Change profile photo
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
        </div>
      </section>

      <Separator />

      {/* Section 2: Specialty & Pricing */}
      <section className="flex flex-col gap-4">
        <h2 className="dashboard-section-heading">Specialty &amp; pricing</h2>
        <div className="flex flex-col gap-2">
          <Label>Primary specialty</Label>
          <Select
            value={data.primarySpecialty}
            onValueChange={(value: string | null) => {
              const next = value ?? "";
              update({
                primarySpecialty: next,
                secondarySpecialty1:
                  data.secondarySpecialty1 === next ? "" : data.secondarySpecialty1,
                secondarySpecialty2:
                  data.secondarySpecialty2 === next ? "" : data.secondarySpecialty2,
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
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
            <Label>Secondary specialty</Label>
            <Select
              value={data.secondarySpecialty1 || "none"}
              onValueChange={(value: string | null) =>
                update({ secondarySpecialty1: !value || value === "none" ? "" : value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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
            <Label>Secondary specialty</Label>
            <Select
              value={data.secondarySpecialty2 || "none"}
              onValueChange={(value: string | null) =>
                update({ secondarySpecialty2: !value || value === "none" ? "" : value })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
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
          <Label>Price range</Label>
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
          <p className="text-sm font-medium">Available this month</p>
          <Switch
            checked={data.availableThisMonth}
            onCheckedChange={(checked) => update({ availableThisMonth: checked })}
          />
        </div>
      </section>

      <Separator />

      {/* Section 3: Portfolio */}
      <section className="flex flex-col gap-4">
        <h2 className="dashboard-section-heading">Portfolio</h2>
        <p className="text-sm text-muted-foreground">
          {photoCount}/{MAX_PHOTOS} photos, {videoCount}/{MAX_VIDEOS} videos
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Photos</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={photoCount >= MAX_PHOTOS}
              onClick={() => photoInputRef.current?.click()}
            >
              Add photos
            </Button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files, "photo");
                e.target.value = "";
              }}
            />
          </div>
          <PortfolioMediaGrid
            existing={remainingExisting.filter((i) => i.type === "photo")}
            newItems={newItems.filter((i) => i.type === "photo")}
            onDeleteExisting={toggleDelete}
            onRemoveNew={removeNewItem}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <Label>Videos</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={videoCount >= MAX_VIDEOS}
              onClick={() => videoInputRef.current?.click()}
            >
              Add videos
            </Button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addFiles(e.target.files, "video");
                e.target.value = "";
              }}
            />
          </div>
          <PortfolioMediaGrid
            existing={remainingExisting.filter((i) => i.type === "video")}
            newItems={newItems.filter((i) => i.type === "video")}
            onDeleteExisting={toggleDelete}
            onRemoveNew={removeNewItem}
          />
        </div>
      </section>

      <Separator />

      {/* Section 4: Links & Contact */}
      <section className="flex flex-col gap-4">
        <h2 className="dashboard-section-heading">Links &amp; contact</h2>
        <div className="flex flex-col gap-2">
          <Label htmlFor="instagram">Instagram URL</Label>
          <Input
            id="instagram"
            value={data.instagramUrl}
            onChange={(e) => update({ instagramUrl: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="website">Website URL</Label>
          <Input
            id="website"
            value={data.websiteUrl}
            onChange={(e) => update({ websiteUrl: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <Label htmlFor="otherLinkLabel">Other link label</Label>
            <Input
              id="otherLinkLabel"
              value={data.otherLinkLabel}
              onChange={(e) => update({ otherLinkLabel: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="otherLinkUrl">Other link URL</Label>
            <Input
              id="otherLinkUrl"
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
      </section>

      <Button
        onClick={handleSave}
        disabled={saving}
        size="lg"
        className="w-full h-[42px]"
        style={{
          background: "#111010",
          color: "#FDFCFB",
          borderRadius: "6px",
          fontSize: "14px",
          fontWeight: 500,
        }}
      >
        {saving ? "Saving..." : "Save changes"}
      </Button>
    </div>
  );
}

function PortfolioMediaGrid({
  existing,
  newItems,
  onDeleteExisting,
  onRemoveNew,
}: {
  existing: ExistingPortfolioItem[];
  newItems: NewPortfolioItem[];
  onDeleteExisting: (id: string) => void;
  onRemoveNew: (localId: string) => void;
}) {
  if (existing.length === 0 && newItems.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
        Nothing uploaded yet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
      {existing.map((item) => (
        <div
          key={item.id}
          className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
        >
          {item.type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.url} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <Film className="size-8 text-muted-foreground" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onDeleteExisting(item.id)}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100"
            aria-label="Delete"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
      {newItems.map((item) => (
        <div
          key={item.localId}
          className="group relative aspect-square overflow-hidden rounded-lg border-2 border-primary/50 bg-muted"
        >
          {item.type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.previewUrl} alt="" className="size-full object-cover" />
          ) : (
            <div className="flex size-full items-center justify-center bg-muted">
              <Film className="size-8 text-muted-foreground" />
            </div>
          )}
          <button
            type="button"
            onClick={() => onRemoveNew(item.localId)}
            className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white opacity-0 group-hover:opacity-100"
            aria-label="Remove"
          >
            <X className="size-3" />
          </button>
        </div>
      ))}
    </div>
  );
}
