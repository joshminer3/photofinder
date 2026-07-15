"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Search, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, AuthCardTitle, AuthCardSubtitle } from "@/components/auth/auth-card";
import { Field } from "@/components/auth/field";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { SwitchLine } from "@/components/auth/switch-line";

type Role = "client" | "photographer";
type Step = "role" | "form";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ROLE_INFO: Record<Role, { icon: typeof Search; name: string; description: string }> = {
  client: {
    icon: Search,
    name: "I'm looking for a photographer",
    description: "Browse and contact local photographers",
  },
  photographer: {
    icon: Camera,
    name: "I'm a photographer",
    description: "Create a profile and get found by clients",
  },
};

export function SignupForm() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("role");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = EMAIL_PATTERN.test(email);
  const passwordValid = password.length >= 8;
  const confirmValid = confirmPassword.length > 0 && confirmPassword === password;
  const formValid = fullName.trim().length > 0 && emailValid && passwordValid && confirmValid;

  const fullNameError = touched.fullName && !fullName.trim() ? "Full name is required" : null;
  const emailError = touched.email
    ? !email
      ? "Email is required"
      : !emailValid
        ? "Enter a valid email address"
        : null
    : null;
  const passwordError = touched.password
    ? !password
      ? "Password is required"
      : !passwordValid
        ? "Password must be at least 8 characters"
        : null
    : null;
  const confirmError =
    touched.confirmPassword && confirmPassword.length > 0 && confirmPassword !== password
      ? "Passwords don't match"
      : null;

  function markTouched(field: keyof typeof touched) {
    setTouched((t) => ({ ...t, [field]: true }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ fullName: true, email: true, password: true, confirmPassword: true });
    if (!formValid || !selectedRole) return;

    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setError(
        "Check your email to confirm your account, then log in. (Tip: disable \"Confirm email\" in Supabase Auth settings during development.)",
      );
      setLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({ is_photographer: selectedRole === "photographer" })
      .eq("id", data.user!.id);

    router.push(selectedRole === "photographer" ? "/onboarding" : "/");
    router.refresh();
  }

  async function handleGoogle() {
    if (!selectedRole) return;
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?role=${selectedRole}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  if (step === "role") {
    return (
      <AuthCard>
        <AuthCardTitle>Join Foto</AuthCardTitle>
        <AuthCardSubtitle>What brings you here?</AuthCardSubtitle>

        <RoleCard
          selected={selectedRole === "client"}
          onClick={() => setSelectedRole("client")}
          {...ROLE_INFO.client}
        />
        <RoleCard
          selected={selectedRole === "photographer"}
          onClick={() => setSelectedRole("photographer")}
          {...ROLE_INFO.photographer}
        />

        <button
          type="button"
          disabled={!selectedRole}
          onClick={() => setStep("form")}
          className="w-full disabled:cursor-not-allowed"
          style={{
            height: "42px",
            marginTop: "4px",
            background: selectedRole ? "#111010" : "#E6E2DD",
            color: selectedRole ? "#FDFCFB" : "#B8B3AE",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Continue →
        </button>

        <SwitchLine prompt="Already have an account?" linkText="Log in" href="/login" />
      </AuthCard>
    );
  }

  const roleInfo = ROLE_INFO[selectedRole!];
  const RoleIcon = roleInfo.icon;

  return (
    <AuthCard>
      <button
        type="button"
        onClick={() => setStep("role")}
        className="flex items-center"
        style={{ gap: "4px", fontSize: "12px", color: "#7A7572", marginBottom: "14px" }}
      >
        <ArrowLeft size={13} />
        Back
      </button>

      <div
        className="flex items-center"
        style={{ background: "#F0EFED", borderRadius: "6px", padding: "7px 10px", gap: "6px", marginBottom: "16px" }}
      >
        <RoleIcon size={13} color="#4C4845" />
        <span style={{ fontSize: "12px", color: "#4C4845" }}>{roleInfo.name}</span>
        <button
          type="button"
          onClick={() => setStep("role")}
          style={{ fontSize: "11px", color: "#7A7572", marginLeft: "auto", textDecoration: "underline" }}
        >
          Change
        </button>
      </div>

      <AuthCardTitle>Create your account</AuthCardTitle>
      <AuthCardSubtitle>Enter your details to get started.</AuthCardSubtitle>

      <form onSubmit={handleSubmit}>
        <Field
          label="Full name"
          type="text"
          placeholder="Jane Smith"
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          onBlur={() => markTouched("fullName")}
          error={fullNameError}
        />
        <Field
          label="Email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onBlur={() => markTouched("email")}
          error={emailError}
        />
        <Field
          label="Password"
          type="password"
          placeholder="Min. 8 characters"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => markTouched("password")}
          error={passwordError}
        />
        <Field
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          onBlur={() => markTouched("confirmPassword")}
          error={confirmError}
        />

        {error && (
          <p style={{ fontSize: "12px", color: "#E24B4A", textAlign: "center", marginBottom: "10px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !formValid}
          className="w-full disabled:cursor-not-allowed"
          style={{
            height: "42px",
            background: loading || !formValid ? "#E6E2DD" : "#111010",
            color: loading || !formValid ? "#B8B3AE" : "#FDFCFB",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <OrDivider />
      <GoogleButton onClick={handleGoogle} disabled={loading} />
      <SwitchLine prompt="Already have an account?" linkText="Log in" href="/login" />
    </AuthCard>
  );
}

function RoleCard({
  selected,
  onClick,
  icon: Icon,
  name,
  description,
}: {
  selected: boolean;
  onClick: () => void;
  icon: typeof Search;
  name: string;
  description: string;
}) {
  const [hovered, setHovered] = useState(false);
  const borderColor = selected ? "#111010" : hovered ? "#B8B3AE" : "#E6E2DD";

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="block w-full text-left transition-colors"
      style={{
        background: selected ? "#FDFCFB" : "#FFFFFF",
        border: `${selected ? "1.5px" : "0.5px"} solid ${borderColor}`,
        borderRadius: "8px",
        padding: "14px",
        marginBottom: "10px",
      }}
    >
      <Icon size={20} color={selected ? "#111010" : "#7A7572"} />
      <p style={{ fontSize: "13px", fontWeight: 500, color: "#111010", marginTop: "6px" }}>{name}</p>
      <p style={{ fontSize: "11px", color: "#7A7572", marginTop: "2px" }}>{description}</p>
    </button>
  );
}
