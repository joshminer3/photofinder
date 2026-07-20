"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Switch } from "@/components/ui/switch";

export function AvailabilityToggle({
  userId,
  initialValue,
}: {
  userId: string;
  initialValue: boolean;
}) {
  const [checked, setChecked] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  async function handleChange(value: boolean) {
    setChecked(value);
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("photographer_profiles")
      .update({ available_this_month: value })
      .eq("user_id", userId);

    setSaving(false);

    if (error) {
      setChecked(!value);
      toast("Couldn't update availability. Try again.");
      return;
    }

    toast("Saved");
  }

  return (
    <div
      className="flex items-center justify-between"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E6E2DD",
        borderRadius: "8px",
        padding: "12px 16px",
        marginBottom: "12px",
      }}
    >
      <div>
        <p style={{ fontSize: "13px", fontWeight: 500, color: "#111010" }}>Available this month</p>
        <p style={{ fontSize: "11px", color: "#7A7572", marginTop: "2px" }}>
          Shown on your profile and in search results
        </p>
      </div>
      <Switch checked={checked} onCheckedChange={handleChange} disabled={saving} />
    </div>
  );
}
