import { createHmac, timingSafeEqual } from "node:crypto";

export function generateApprovalToken(photographerId: string): string {
  return createHmac("sha256", process.env.ADMIN_SECRET!)
    .update(photographerId)
    .digest("hex");
}

export function verifyApprovalToken(
  photographerId: string,
  token: string,
): boolean {
  try {
    const expected = Buffer.from(generateApprovalToken(photographerId), "hex");
    const provided = Buffer.from(token, "hex");
    return (
      expected.length === provided.length &&
      timingSafeEqual(expected, provided)
    );
  } catch {
    return false;
  }
}
