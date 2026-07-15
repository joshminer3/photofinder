"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { AuthCard, AuthCardTitle, AuthCardSubtitle } from "@/components/auth/auth-card";
import { Field } from "@/components/auth/field";
import { GoogleButton } from "@/components/auth/google-button";
import { OrDivider } from "@/components/auth/or-divider";
import { SwitchLine } from "@/components/auth/switch-line";

type Mode = "login" | "forgot";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resetEmail, setResetEmail] = useState("");
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      // Deliberately generic — don't reveal whether the email or the
      // password was the wrong part.
      setError("Incorrect email or password.");
      setLoading(false);
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  async function handleGoogle() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirect)}`,
      },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  async function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResetLoading(true);
    setResetError(null);

    const supabase = createClient();
    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetErr) {
      setResetError(resetErr.message);
      setResetLoading(false);
      return;
    }

    setResetSent(true);
    setResetLoading(false);
  }

  function backToLogin() {
    setMode("login");
    setResetSent(false);
    setResetError(null);
  }

  if (mode === "forgot") {
    return (
      <AuthCard>
        <AuthCardTitle>Reset your password</AuthCardTitle>

        {resetSent ? (
          <p style={{ fontSize: "13px", color: "#4C4845", marginBottom: "18px" }}>
            Check your email for a reset link.
          </p>
        ) : (
          <>
            <AuthCardSubtitle>Enter your email and we&apos;ll send a reset link.</AuthCardSubtitle>
            <form onSubmit={handleResetSubmit}>
              <Field
                label="Email"
                type="email"
                placeholder="you@email.com"
                autoComplete="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
              />

              {resetError && (
                <p style={{ fontSize: "12px", color: "#E24B4A", textAlign: "center", marginBottom: "10px" }}>
                  {resetError}
                </p>
              )}

              <button
                type="submit"
                disabled={resetLoading || !resetEmail}
                className="w-full disabled:cursor-not-allowed"
                style={{
                  height: "42px",
                  background: resetLoading || !resetEmail ? "#E6E2DD" : "#111010",
                  color: resetLoading || !resetEmail ? "#B8B3AE" : "#FDFCFB",
                  borderRadius: "6px",
                  fontSize: "14px",
                  fontWeight: 500,
                }}
              >
                {resetLoading ? "Sending..." : "Send reset link"}
              </button>
            </form>
          </>
        )}

        <button
          type="button"
          onClick={backToLogin}
          className="flex items-center"
          style={{ gap: "4px", fontSize: "12px", color: "#7A7572", marginTop: "16px" }}
        >
          <ArrowLeft size={13} />
          Back to log in
        </button>
      </AuthCard>
    );
  }

  return (
    <AuthCard>
      <AuthCardTitle>Log in</AuthCardTitle>
      <AuthCardSubtitle>Welcome back to Foto.</AuthCardSubtitle>

      <form onSubmit={handleSubmit}>
        <Field
          label="Email"
          type="email"
          placeholder="you@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Field
          label="Password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          onClick={() => setMode("forgot")}
          className="block"
          style={{
            marginLeft: "auto",
            marginTop: "-8px",
            marginBottom: "14px",
            fontSize: "11px",
            color: "#7A7572",
            textDecoration: "underline",
          }}
        >
          Forgot password?
        </button>

        {error && (
          <p style={{ fontSize: "12px", color: "#E24B4A", textAlign: "center", marginBottom: "10px" }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full disabled:cursor-not-allowed"
          style={{
            height: "42px",
            background: loading ? "#E6E2DD" : "#111010",
            color: loading ? "#B8B3AE" : "#FDFCFB",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          {loading ? "Logging in..." : "Log in"}
        </button>
      </form>

      <OrDivider />
      <GoogleButton onClick={handleGoogle} disabled={loading} />
      <SwitchLine prompt="Don't have an account?" linkText="Sign up" href="/signup" />
    </AuthCard>
  );
}
