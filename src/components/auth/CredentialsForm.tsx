"use client";

import Link from "next/link";
import { useState } from "react";
import { Mail, Sparkles, ArrowRight, ShieldCheck } from "lucide-react";

import { ApiError, loginWithEmailRequest } from "@/lib/api-client";

function GoogleButton() {
  return (
    <a
      href="/api/auth/google/start"
      className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-extrabold text-slate-800 transition shadow-xs hover:bg-slate-50 hover:shadow-md hover:border-slate-300 active:scale-[0.99]"
    >
      <svg viewBox="0 0 18 18" className="h-5 w-5 shrink-0" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
        />
        <path
          fill="#FBBC05"
          d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
        />
      </svg>
      <span>Continue with Google</span>
    </a>
  );
}

export function CredentialsForm({
  notice,
  initialEmail = "",
  showGoogleButton = false,
}: {
  notice?: string | null;
  initialEmail?: string;
  showGoogleButton?: boolean;
}) {
  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleDemoFill() {
    setEmail("admin@greenfield.edu.in");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const { next } = await loginWithEmailRequest(email);
      window.location.assign(next);
    } catch (cause) {
      setError(
        cause instanceof ApiError && cause.status !== 0
          ? cause.message
          : "Could not reach the server. Check your connection.",
      );
      setPending(false);
    }
  }

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-50 via-white to-slate-100/60 flex items-center justify-center p-4 sm:p-6 font-sans text-slate-900">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-4 py-2 shadow-md border border-slate-200/80 transition hover:scale-105"
          >
            <img src="/xite-logo.png" alt="XITE Logo" className="h-8 w-8 object-contain rounded-xl shadow-xs" />
            <span className="font-extrabold text-lg text-slate-900 tracking-tight">
              XITE Platform
            </span>
          </Link>

          <div className="mt-4">
            <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-blue-700 border border-blue-200">
              Step 1 of 3
            </span>
          </div>

          <h1 className="mt-3 text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to XITE
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Access is by approved request. If you have an account, sign in here.
          </p>
        </div>

        {/* White Card Container */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-7 sm:p-9 shadow-[0_20px_60px_rgba(0,0,0,0.08)] backdrop-blur-xl">
          {/* Google Sign-in Button */}
          {showGoogleButton && (
            <div className="mb-6">
              <GoogleButton />
              <div className="mt-6 flex items-center gap-4">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  or
                </span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            </div>
          )}

          {/* Quick Demo Autofill Pill */}
          {(
            <button
              type="button"
              onClick={handleDemoFill}
              className="w-full mb-6 flex items-center justify-between gap-2 rounded-2xl border border-blue-200 bg-blue-50/80 px-4 py-3 text-left transition hover:bg-blue-100/80 group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="h-4 w-4 text-blue-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-900 truncate">
                    Use the demo admin address
                  </p>
                  <p className="text-[11px] font-medium text-blue-700 truncate">
                    admin@greenfield.edu.in
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-blue-600 group-hover:translate-x-0.5 transition-transform shrink-0">
                Auto-fill →
              </span>
            </button>
          )}

          {notice ? (
            <div className="mb-6 flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-bold text-emerald-800">
              <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{notice}</span>
            </div>
          ) : null}

          {/*
            One field. The address is the whole credential — no password, and no
            code sent to the mailbox to prove it is yours.
          */}
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  placeholder="admin@college.edu.in"
                  required
                  autoFocus
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/10 placeholder:text-slate-400"
                />
              </div>
            </div>

            <p className="text-[11px] font-medium leading-relaxed text-slate-500">
              Only addresses an administrator has approved can sign in.
            </p>

            {error ? (
              <div
                role="alert"
                className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700"
              >
                {error}
              </div>
            ) : null}

            {/* Single Primary Submit Button */}
            <button
              type="submit"
              disabled={pending}
              className="w-full p-[3px] relative group cursor-pointer disabled:opacity-50"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl" />
              <div className="w-full py-3.5 bg-black rounded-[14px] relative group transition duration-200 text-white font-extrabold text-sm hover:bg-transparent flex items-center justify-center gap-2">
                <span>{pending ? "Please wait…" : "Sign in"}</span>
                {!pending && <ArrowRight className="h-4 w-4" />}
              </div>
            </button>
          </form>

          {/* Toggle Footer */}
          <div className="mt-6 border-t border-slate-100 pt-5 text-center text-xs font-semibold text-slate-500">
            New to XITE Platform?
            <Link
              href="/request-access"
              className="font-extrabold text-blue-600 hover:underline hover:text-blue-700 ml-1"
            >
              Request access
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
