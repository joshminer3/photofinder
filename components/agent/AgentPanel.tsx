"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { LogoMark } from "@/components/logo-mark";
import { AgentInput } from "./AgentInput";
import { AgentResults } from "./AgentResults";
import type { AgentMatchResponse } from "@/lib/agent/types";

type Status = "idle" | "loading" | "results" | "error";

export function AgentPanel({ onClose }: { onClose: () => void }) {
  const [status, setStatus] = useState<Status>("idle");
  const [result, setResult] = useState<AgentMatchResponse | null>(null);

  async function handleSubmit(message: string, photos: File[]) {
    setStatus("loading");
    try {
      const formData = new FormData();
      formData.append("message", message);
      photos.forEach((photo) => formData.append("photos", photo));

      const res = await fetch("/api/agent/match", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Request failed");

      const data: AgentMatchResponse = await res.json();
      setResult(data);
      setStatus("results");
      return true;
    } catch {
      setStatus("error");
      return false;
    }
  }

  function handleSearchAgain() {
    setResult(null);
    setStatus("idle");
  }

  return (
    <div
      className="fixed flex w-[420px] flex-col overflow-hidden rounded-2xl max-h-[90vh] right-6 bottom-[88px] max-[480px]:right-0 max-[480px]:bottom-0 max-[480px]:w-screen max-[480px]:max-h-[92vh] max-[480px]:rounded-b-none max-[480px]:rounded-t-2xl"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #EEEAE4",
        boxShadow: "0 8px 40px rgba(0,0,0,0.14)",
        zIndex: 50,
      }}
    >
      <div
        className="flex shrink-0 items-center justify-between"
        style={{
          height: "52px",
          padding: "0 16px",
          background: "#FDFCFB",
          borderBottom: "0.5px solid #EEEAE4",
        }}
      >
        <div className="flex items-center" style={{ gap: "8px" }}>
          <LogoMark className="size-[18px] text-[#111010]" />
          <span style={{ fontSize: "14px", fontWeight: 500, color: "#111010" }}>
            Find your photographer
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex items-center justify-center"
          style={{ color: "#7A7572" }}
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col" style={{ overflowY: "auto" }}>
        {status === "idle" && <WelcomeState />}
        {status === "loading" && <LoadingSkeleton />}
        {status === "results" && result && (
          <AgentResults intro={result.intro} matches={result.matches} onSearchAgain={handleSearchAgain} />
        )}
        {status === "error" && <ErrorState onRetry={() => setStatus("idle")} />}
      </div>

      <AgentInput onSubmit={handleSubmit} disabled={status === "loading"} />
    </div>
  );
}

function WelcomeState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center" style={{ padding: "32px" }}>
      <LogoMark className="size-10 text-[#E6E2DD]" />
      <p style={{ fontSize: "16px", fontWeight: 500, color: "#111010", marginTop: "12px" }}>
        Let me help you find your fit.
      </p>
      <p
        style={{
          fontSize: "13px",
          color: "#7A7572",
          textAlign: "center",
          lineHeight: 1.6,
          maxWidth: "300px",
          marginTop: "8px",
        }}
      >
        Describe the photographer you&apos;re looking for — style, event type, budget, location. You
        can also upload up to 5 inspiration photos.
      </p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col" style={{ padding: "16px 12px", gap: "10px" }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="flex animate-pulse overflow-hidden"
          style={{ height: "84px", background: "#FFFFFF", border: "0.5px solid #E6E2DD", borderRadius: "8px" }}
        >
          <div style={{ width: "80px", height: "100%", background: "#EEEAE4" }} />
          <div className="flex flex-1 flex-col justify-center" style={{ padding: "10px 12px", gap: "6px" }}>
            <div style={{ width: "60%", height: "10px", borderRadius: "4px", background: "#EEEAE4" }} />
            <div style={{ width: "80%", height: "10px", borderRadius: "4px", background: "#EEEAE4" }} />
            <div style={{ width: "40%", height: "10px", borderRadius: "4px", background: "#EEEAE4" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center text-center" style={{ padding: "32px" }}>
      <p style={{ fontSize: "13px", color: "#7A7572" }}>Something went wrong. Please try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-[6px] border"
        style={{
          marginTop: "12px",
          height: "30px",
          padding: "0 14px",
          fontSize: "12px",
          color: "#4C4845",
          borderColor: "#E6E2DD",
          background: "#FFFFFF",
        }}
      >
        Try again
      </button>
    </div>
  );
}
