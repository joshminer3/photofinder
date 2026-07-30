"use client";

import type { MatchedPhotographer } from "@/lib/agent/types";
import { AgentPhotographerCard } from "./AgentPhotographerCard";

export function AgentResults({
  intro,
  matches,
  onSearchAgain,
}: {
  intro: string;
  matches: MatchedPhotographer[];
  onSearchAgain: () => void;
}) {
  return (
    <div className="flex flex-col" style={{ paddingTop: "12px" }}>
      <p
        style={{
          fontSize: "13px",
          color: "#4C4845",
          lineHeight: 1.65,
          padding: "0 16px 16px",
          borderBottom: "0.5px solid #EEEAE4",
          marginBottom: "12px",
        }}
      >
        {intro}
      </p>

      {matches.map((match) => (
        <AgentPhotographerCard key={match.id} photographer={match} />
      ))}

      <button
        type="button"
        onClick={onSearchAgain}
        className="self-center rounded-[6px] border"
        style={{
          margin: "4px 0 16px",
          height: "30px",
          padding: "0 14px",
          fontSize: "12px",
          color: "#4C4845",
          borderColor: "#E6E2DD",
          background: "#FFFFFF",
        }}
      >
        Search again
      </button>
    </div>
  );
}
