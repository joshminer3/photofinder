"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useOnboarding } from "./onboarding-context";
import { createClient } from "@/lib/supabase/client";
import { generateSlugCandidate } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

async function uploadFile(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  file: File,
  prefix: string,
) {
  const ext = file.name.split(".").pop();
  const path = `${userId}/${prefix}-${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("portfolios")
    .upload(path, file);
  if (error) throw error;
  return path;
}

async function findAvailableSlug(
  supabase: ReturnType<typeof createClient>,
  fullName: string,
) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = generateSlugCandidate(fullName);
    const { data } = await supabase
      .from("photographer_profiles")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return generateSlugCandidate(fullName) + Date.now();
}

export function StepReview() {
  const { data, userId } = useOnboarding();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);

  const photos = data.portfolioItems.filter((i) => i.type === "photo");
  const videos = data.portfolioItems.filter((i) => i.type === "video");

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createClient();

      let avatarUrl = data.avatarPreviewUrl;
      if (data.avatarFile) {
        const path = await uploadFile(supabase, userId, data.avatarFile, "avatar");
        avatarUrl = supabase.storage.from("portfolios").getPublicUrl(path)
          .data.publicUrl;
      }

      const newSlug = await findAvailableSlug(supabase, data.fullName);

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: data.fullName,
          avatar_url: avatarUrl,
          is_photographer: true,
        })
        .eq("id", userId);
      if (profileError) throw profileError;

      const { data: photographerProfile, error: insertError } = await supabase
        .from("photographer_profiles")
        .insert({
          user_id: userId,
          slug: newSlug,
          bio: data.bio || null,
          primary_specialty: data.primarySpecialty,
          secondary_specialty_1: data.secondarySpecialty1 || null,
          secondary_specialty_2: data.secondarySpecialty2 || null,
          service_area: data.serviceArea || null,
          price_range_min: data.priceMin ? Number(data.priceMin) : null,
          price_range_max: data.priceMax ? Number(data.priceMax) : null,
          instagram_url: data.instagramUrl || null,
          website_url: data.websiteUrl || null,
          other_link_url: data.otherLinkUrl || null,
          other_link_label: data.otherLinkLabel || null,
          public_email: data.publicEmail || null,
          public_phone: data.publicPhone || null,
          available_this_month: data.availableThisMonth,
        })
        .select("id")
        .single();
      if (insertError) throw insertError;

      const uploadedItems = await Promise.all(
        data.portfolioItems.map(async (item, index) => {
          const path = await uploadFile(supabase, userId, item.file, item.type);
          return {
            photographer_id: photographerProfile.id,
            storage_path: path,
            type: item.type,
            display_order: index,
          };
        }),
      );

      if (uploadedItems.length > 0) {
        const { error: itemsError } = await supabase
          .from("portfolio_items")
          .insert(uploadedItems);
        if (itemsError) throw itemsError;
      }

      // Best-effort — a failed admin notification shouldn't block the
      // photographer from seeing their submission succeeded.
      fetch("/api/notify-submission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photographerId: photographerProfile.id }),
      }).catch((err) => console.error("Failed to notify admin:", err));

      setSlug(newSlug);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (slug) {
    return (
      <div className="flex flex-col items-center gap-4 py-8 text-center">
        <CheckCircle2 className="size-12 text-primary" />
        <h2 className="text-xl font-semibold">You&apos;re all set!</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          Your profile is under review. We&apos;ll notify you by email when it
          goes live (usually within 24 hours).
        </p>
        <div className="flex gap-3">
          <Button render={<Link href="/" />} nativeButton={false} variant="outline">
            Back to home
          </Button>
          <Button
            render={<Link href={`/photographer/${slug}`} />}
            nativeButton={false}
          >
            Preview your profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-semibold">Review &amp; submit</h2>
        <p className="text-sm text-muted-foreground">
          Double check everything before submitting for approval.
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-lg border p-4 text-sm">
        <Row label="Name" value={data.fullName} />
        <Row label="Service area" value={data.serviceArea} />
        <Row label="Bio" value={data.bio || "—"} />
        <Separator />
        <Row label="Primary specialty" value={data.primarySpecialty} />
        <Row
          label="Secondary specialties"
          value={
            [data.secondarySpecialty1, data.secondarySpecialty2]
              .filter(Boolean)
              .join(", ") || "—"
          }
        />
        <Row
          label="Price range"
          value={
            data.priceMin || data.priceMax
              ? `$${data.priceMin || "?"} – $${data.priceMax || "?"}`
              : "—"
          }
        />
        <Row
          label="Availability"
          value={data.availableThisMonth ? "Available this month" : "Not available"}
        />
        <Separator />
        <Row label="Portfolio" value={`${photos.length} photos, ${videos.length} videos`} />
        <Separator />
        <Row label="Instagram" value={data.instagramUrl || "—"} />
        <Row label="Website" value={data.websiteUrl || "—"} />
        <Row
          label="Other link"
          value={
            data.otherLinkUrl
              ? `${data.otherLinkLabel || "Link"} — ${data.otherLinkUrl}`
              : "—"
          }
        />
        <Row label="Public email" value={data.publicEmail || "—"} />
        <Row label="Public phone" value={data.publicPhone || "—"} />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button onClick={handleSubmit} disabled={submitting} size="lg">
        {submitting ? "Submitting..." : "Submit for approval"}
      </Button>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[70%] text-right font-medium">{value}</span>
    </div>
  );
}
