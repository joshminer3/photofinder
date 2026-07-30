"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Send } from "lucide-react";
import {
  MAX_AGENT_PHOTOS,
  MAX_AGENT_PHOTO_SIZE_BYTES,
  isSupportedImageType,
} from "@/lib/agent/constants";
import { AgentPhotoPreview } from "./AgentPhotoPreview";

const TEXTAREA_MAX_HEIGHT = 100;

type PendingPhoto = { file: File; previewUrl: string };

export function AgentInput({
  onSubmit,
  disabled,
}: {
  onSubmit: (message: string, photos: File[]) => Promise<boolean>;
  disabled: boolean;
}) {
  const [message, setMessage] = useState("");
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, TEXTAREA_MAX_HEIGHT)}px`;
  }, [message]);

  function handleFilesSelected(fileList: FileList | null) {
    if (!fileList) return;
    const room = MAX_AGENT_PHOTOS - photos.length;
    const incoming = Array.from(fileList).slice(0, room);
    const accepted: PendingPhoto[] = [];

    for (const file of incoming) {
      if (!isSupportedImageType(file.type)) {
        toast("Unsupported image type.");
        continue;
      }
      if (file.size > MAX_AGENT_PHOTO_SIZE_BYTES) {
        toast("Each photo must be under 5MB.");
        continue;
      }
      accepted.push({ file, previewUrl: URL.createObjectURL(file) });
    }

    setPhotos((prev) => [...prev, ...accepted]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => {
      const target = prev[index];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function handleSubmit() {
    if (submitting || disabled) return;
    if (!message.trim() && photos.length === 0) return;

    setSubmitting(true);
    const success = await onSubmit(message.trim(), photos.map((p) => p.file));
    if (success) {
      photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setMessage("");
      setPhotos([]);
    }
    setSubmitting(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const atPhotoLimit = photos.length >= MAX_AGENT_PHOTOS;
  const canSubmit = (message.trim().length > 0 || photos.length > 0) && !disabled && !submitting;

  return (
    <div
      className="shrink-0"
      style={{ padding: "12px 16px 14px", borderTop: "0.5px solid #EEEAE4", background: "#FFFFFF" }}
    >
      <AgentPhotoPreview photos={photos} onRemove={removePhoto} />

      <textarea
        ref={textareaRef}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Describe what you're looking for..."
        rows={1}
        disabled={disabled}
        className="w-full outline-none transition-colors focus:border-[#B8B3AE]"
        style={{
          background: "#FDFCFB",
          border: "0.5px solid #E6E2DD",
          borderRadius: "10px",
          padding: "10px 14px",
          fontSize: "13px",
          color: "#111010",
          maxHeight: `${TEXTAREA_MAX_HEIGHT}px`,
          resize: "none",
        }}
      />

      <div className="flex items-center justify-between" style={{ marginTop: "8px" }}>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={atPhotoLimit || disabled}
          aria-label="Add inspiration photos"
          title={atPhotoLimit ? "Maximum 5 photos" : "Add inspiration photos"}
          className="flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
          style={{ width: "32px", height: "32px", color: "#7A7572" }}
        >
          <ImagePlus size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFilesSelected(e.target.files);
            e.target.value = "";
          }}
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          aria-label="Send"
          className="flex shrink-0 items-center justify-center rounded-[8px] border-none disabled:cursor-not-allowed"
          style={{ width: "38px", height: "38px", background: canSubmit ? "#111010" : "#E6E2DD" }}
        >
          <Send size={16} color="#FDFCFB" />
        </button>
      </div>
    </div>
  );
}
