export function StatCard({
  value,
  label,
  note,
}: {
  value: string;
  label: string;
  note?: string;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "0.5px solid #E6E2DD",
        borderRadius: "8px",
        padding: "14px",
      }}
    >
      <p style={{ fontSize: "24px", fontWeight: 500, color: "#111010", letterSpacing: "-0.8px" }}>
        {value}
      </p>
      <p style={{ fontSize: "11px", color: "#7A7572", marginTop: "2px" }}>
        {label}
        {note && <span style={{ color: "#B8B3AE", fontSize: "10px" }}> · {note}</span>}
      </p>
    </div>
  );
}
