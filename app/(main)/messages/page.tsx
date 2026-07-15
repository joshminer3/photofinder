import { LogoMark } from "@/components/logo-mark";

export default function MessagesIndexPage() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center" style={{ color: "#E6E2DD" }}>
      <LogoMark className="size-8" />
      <p style={{ fontSize: "14px", color: "#B8B3AE", marginTop: "12px" }}>
        Select a conversation
      </p>
    </div>
  );
}
