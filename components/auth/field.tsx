export function Field({
  label,
  error,
  ...props
}: { label: string; error?: string | null } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div style={{ marginBottom: "14px" }}>
      <label
        style={{
          display: "block",
          fontSize: "11px",
          fontWeight: 500,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: "#7A7572",
          marginBottom: "5px",
        }}
      >
        {label}
      </label>
      <input
        {...props}
        className="w-full outline-none transition-colors focus:border-[#B8B3AE]"
        style={{
          height: "40px",
          background: "#FFFFFF",
          border: "0.5px solid #E6E2DD",
          borderRadius: "6px",
          padding: "0 12px",
          fontSize: "14px",
          color: "#111010",
        }}
      />
      {error && (
        <p style={{ fontSize: "11px", color: "#E24B4A", marginTop: "4px" }}>{error}</p>
      )}
    </div>
  );
}
