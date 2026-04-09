import React from "react";

import { SectionCard } from "@/components/section-card";
import type { AuthMode } from "@/types/auth";

type AuthPanelProps = {
  email: string;
  isSubmitting: boolean;
  mode: AuthMode;
  password: string;
  onEmailChange: (value: string) => void;
  onModeChange: (mode: AuthMode) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: () => Promise<void>;
};

export function AuthPanel({
  email,
  isSubmitting,
  mode,
  password,
  onEmailChange,
  onModeChange,
  onPasswordChange,
  onSubmit,
}: AuthPanelProps) {
  const title = mode === "login" ? "Sign In" : "Create Account";
  const description =
    mode === "login"
      ? "Sign in to access your own tasks and voice notes."
      : "Create an account to keep your extracted tasks private.";

  return (
    <SectionCard
      title={title}
      description={description}
      action={
        <div className="inline-flex rounded-full bg-slate-100 p-1">
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              mode === "login"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => {
              onModeChange("login");
            }}
            type="button"
          >
            Login
          </button>
          <button
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              mode === "register"
                ? "bg-slate-900 text-white"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => {
              onModeChange("register");
            }}
            type="button"
          >
            Register
          </button>
        </div>
      }
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit();
        }}
      >
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Email
          <input
            autoComplete="email"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            onChange={(event) => {
              onEmailChange(event.target.value);
            }}
            placeholder="you@example.com"
            type="email"
            value={email}
          />
        </label>

        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Password
          <input
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
            onChange={(event) => {
              onPasswordChange(event.target.value);
            }}
            placeholder="At least 8 characters"
            type="password"
            value={password}
          />
        </label>

        <button
          className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting
            ? mode === "login"
              ? "Signing In..."
              : "Creating Account..."
            : mode === "login"
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>
    </SectionCard>
  );
}
