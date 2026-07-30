"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Building2, Lock, Mail, MessageSquare, User } from "lucide-react";

import { ApiError, requestAccessRequest } from "@/lib/api-client";

/**
 * Asking for access.
 *
 * Styled to match `CredentialsForm` rather than the admin panel — this is a
 * public page in the same family as /login, and the two sit beside each other
 * in the same flow.
 *
 * The confirmation screen is shown on any success, and success here means 202,
 * which the backend returns whether or not a row was written. That is
 * deliberate on its side: reporting "already pending" for a known address turns
 * the endpoint into a way to ask whether a given person has applied. So this
 * form has nothing to branch on and does not try — it repeats the address back
 * so somebody who mistyped can see it, and says what happens next.
 */
export function RequestAccessForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      await requestAccessRequest({
        name,
        email,
        password,
        ...(organization.trim() ? { organization } : {}),
        ...(message.trim() ? { message } : {}),
      });
      setSubmitted(true);
    } catch (cause) {
      setError(
        cause instanceof ApiError
          ? cause.message
          : "Could not send your request. Please try again.",
      );
      setPending(false);
    }
  }

  if (submitted) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-slate-50/50 px-4 py-12">
        <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900">
            <Mail className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
          <h1 className="mt-6 text-2xl font-extrabold tracking-tight text-slate-900">
            Request received
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            We&apos;ll review your request for{" "}
            <span className="font-semibold text-slate-900">{email}</span>.
            Once an admin approves your request, you can log in immediately with your email and password.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-flex items-center justify-center rounded-2xl bg-slate-900 px-6 py-3 text-sm font-extrabold text-white transition hover:bg-slate-800"
          >
            Go to Login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50/50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 sm:p-10">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Request access
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          XITE is opened up one institution at a time. Tell us who you are and set your account password.
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <Field label="Full name" icon={<User className="h-4 w-4" />}>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
              minLength={2}
              maxLength={120}
              placeholder="Priya Raman"
              className={INPUT}
            />
          </Field>

          <Field label="Email" icon={<Mail className="h-4 w-4" />}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              placeholder="you@college.edu.in"
              className={INPUT}
            />
          </Field>

          <Field label="Account Password" icon={<Lock className="h-4 w-4" />}>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              required
              minLength={6}
              placeholder="••••••••"
              className={INPUT}
            />
            <span className="mt-1.5 block text-xs text-slate-500">
              You will use this password to log in once an admin approves your request.
            </span>
          </Field>

          <Field
            label="Institution"
            optional
            icon={<Building2 className="h-4 w-4" />}
          >
            <input
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
              autoComplete="organization"
              maxLength={160}
              placeholder="Greenfield Institute of Technology"
              className={INPUT}
            />
          </Field>

          <Field
            label="Anything we should know"
            optional
            icon={<MessageSquare className="h-4 w-4" />}
          >
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="What you'd like to build, and roughly when."
              className={`${INPUT} resize-y`}
            />
          </Field>

          {error ? (
            <p
              role="alert"
              className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3.5 text-sm font-extrabold text-white shadow-md transition hover:bg-slate-800 active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? "Sending…" : "Send request"}
            {pending ? null : <ArrowRight className="h-4 w-4" aria-hidden="true" />}
          </button>
        </form>

        <p className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-600">
          Already have access?{" "}
          <Link href="/login" className="font-bold text-slate-900 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

const INPUT =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100";

function Field({
  label,
  icon,
  optional,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.12em] text-slate-500">
        <span className="text-slate-400" aria-hidden="true">
          {icon}
        </span>
        {label}
        {optional ? (
          <span className="font-bold normal-case tracking-normal text-slate-400">
            optional
          </span>
        ) : null}
      </span>
      {children}
    </label>
  );
}
