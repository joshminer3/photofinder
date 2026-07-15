export function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full"
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E6E2DD",
        borderRadius: "12px",
        padding: "28px",
      }}
    >
      {children}
    </div>
  );
}

export function AuthCardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h1
      style={{
        fontSize: "20px",
        fontWeight: 500,
        color: "#111010",
        letterSpacing: "-0.5px",
        marginBottom: "4px",
      }}
    >
      {children}
    </h1>
  );
}

export function AuthCardSubtitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: "13px", color: "#7A7572", marginBottom: "18px" }}>{children}</p>
  );
}
