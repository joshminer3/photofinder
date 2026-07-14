import { NextResponse } from "next/server";
import { verifyApprovalToken } from "@/lib/admin/token";
import { approvePhotographer } from "@/lib/admin/approve-photographer";
import { escapeHtml } from "@/lib/email/escape-html";

function htmlResponse(status: number, message: string) {
  return new NextResponse(
    `<!doctype html><html><body style="font-family: sans-serif; padding: 2rem;"><p>${message}</p></body></html>`,
    { status, headers: { "Content-Type": "text/html" } },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const photographerId = searchParams.get("photographer_id");
  const token = searchParams.get("token");

  if (!photographerId || !token) {
    return htmlResponse(400, "Missing photographer_id or token.");
  }

  if (!verifyApprovalToken(photographerId, token)) {
    return htmlResponse(403, "Invalid or expired approval link.");
  }

  const result = await approvePhotographer(photographerId);

  if (result.status === "not_found") {
    return htmlResponse(404, "Photographer profile not found.");
  }
  if (result.status === "already_approved") {
    return htmlResponse(200, `Already approved. ${escapeHtml(result.name)} is live.`);
  }
  return htmlResponse(200, `Approved! ${escapeHtml(result.name)} has been notified.`);
}
