import { GoogleIcon } from "./google-icon";

export function GoogleButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
      style={{
        height: "40px",
        background: "#FFFFFF",
        border: "0.5px solid #E6E2DD",
        borderRadius: "6px",
        fontSize: "13px",
        color: "#4C4845",
        gap: "8px",
      }}
    >
      <GoogleIcon size={16} />
      Continue with Google
    </button>
  );
}
