"use client";

/**
 * The browser's single door to the API.
 *
 * Every call goes through here so two things are true at once: each request is
 * a real, inspectable HTTP call in the Network tab, and it is logged to the
 * console with its method, path, status and duration — the editor used Server
 * Actions, which show up as neither.
 *
 * `NEXT_PUBLIC_API_BASE_URL` is the whole story for splitting the backend out.
 * Empty means same-origin (one Dokploy service). Set it to the backend's URL
 * and the frontend talks to another host with no other change.
 */
const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Options = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
};

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const method = options.method ?? "GET";
  const url = `${BASE}${path}`;
  const startedAt = performance.now();

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: options.body ? { "Content-Type": "application/json" } : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      // Cross-origin once the backend is its own service; harmless same-origin.
      credentials: "include",
    });
  } catch (cause) {
    // A dropped connection never reaches the server, so nothing else will log
    // it. Say so here or it vanishes.
    console.error(
      `%c[api] ${method} ${path} — network error`,
      "color:#e11d48;font-weight:600",
      cause,
    );
    throw new ApiError("Network unavailable", 0);
  }

  const ms = Math.round(performance.now() - startedAt);
  const ok = response.ok;

  console.info(
    `%c[api] ${method} ${path} → ${response.status} (${ms}ms)`,
    `color:${ok ? "#0d9488" : "#e11d48"};font-weight:600`,
  );

  const payload = (await response.json().catch(() => null)) as
    | (T & { error?: string })
    | null;

  if (!ok) {
    throw new ApiError(
      payload?.error ?? `Request failed (${response.status})`,
      response.status,
    );
  }

  return payload as T;
}

/* Auth endpoints.
 *
 * These were Server Actions, which POST to the page's own URL as an RSC
 * payload — so sign-in showed up in the Network tab as `POST /login` with a
 * `text/x-component` body, and could not be pointed at the backend at all.
 * As plain calls they go where every other call goes, and are readable in the
 * Network tab like any API request.
 */

/*
 * No signupRequest. POST /api/v1/auth/signup is gone: access is by approved
 * request, so the only way an account comes into existence is activation. The
 * public entry point is `requestAccessRequest` below.
 */

/** `next` is where the backend says this account should land. */
export const loginRequest = (email: string, password: string) =>
  api<{ subdomain: string; next: string }>("/api/v1/auth/login", {
    method: "POST",
    body: { email, password },
  });

/**
 * Signing in with an address and nothing else.
 *
 * No password, and no code sent to the mailbox — the address is the credential.
 * The endpoint answers 401 for an address it does not know, which is not an
 * enumeration weakness so much as an admission: a successful sign-in returns a
 * session, so nothing is being kept from anybody who can ask twice.
 */
export const loginWithEmailRequest = (email: string) =>
  api<{ subdomain: string; next: string }>("/api/v1/auth/login/email", {
    method: "POST",
    body: { email },
  });

/**
 * Asking for access — soon the only way in.
 *
 * Answers 202 with `{ received: true }` whether or not a row was written: a
 * second request from an address that already has one pending is dropped, and
 * the caller cannot tell. So there is nothing here worth branching on. The
 * confirmation screen says what it says because the form was submitted, not
 * because the backend reported anything about this address.
 */
export const requestAccessRequest = (input: {
  name: string;
  email: string;
  password?: string;
  organization?: string;
  message?: string;
}) =>
  api<{ received: true }>("/api/v1/access-requests", {
    method: "POST",
    body: input,
  });

/*
 * No logoutRequest. Signing out clears the cookie through the server action in
 * app/actions/auth.ts, which needs no client JavaScript and cannot half-fail
 * the way a fetch can. The backend route it used to call has been removed.
 */

/**
 * A missing id would build `/api/v1/sections/` — a path that matches no route
 * and comes back 404, which reads as "the backend is broken" rather than "this
 * call had nothing to ask about". Fail here, where the cause is visible.
 */
function requireId(id: string | undefined | null): string {
  if (!id) throw new ApiError("No section selected", 0);
  return id;
}

/* Section endpoints, named so call sites read as intent rather than as URLs. */

export const saveSectionContent = (
  id: string,
  content: unknown,
  trigger: string,
) =>
  api<{ savedAt: string }>(`/api/v1/sections/${requireId(id)}`, {
    method: "PATCH",
    body: { content, trigger },
  });

export const fetchSectionHistory = (id: string) =>
  api<{
    versions: {
      id: string;
      savedAt: string;
      saveTrigger: string;
      isCurrent: boolean;
    }[];
  }>(`/api/v1/sections/${requireId(id)}`);

/**
 * Uploads an image to the backend.
 *
 * multipart, so it does not go through `api()` — that sets a JSON content type
 * and would strip the multipart boundary the server needs to parse the body.
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);

  const startedAt = performance.now();
  const response = await fetch(`${BASE}/api/uploads`, {
    method: "POST",
    body,
    credentials: "include",
  });

  const ms = Math.round(performance.now() - startedAt);
  const payload = (await response.json().catch(() => null)) as {
    url?: string;
    error?: string;
  } | null;

  console.info(
    `%c[api] POST /api/uploads → ${response.status} (${ms}ms)`,
    `color:${response.ok ? "#0d9488" : "#e11d48"};font-weight:600`,
  );

  if (!response.ok || !payload?.url) {
    throw new ApiError(payload?.error ?? "Upload failed", response.status);
  }

  // The backend answers with a path relative to itself. Left as-is it would
  // resolve against the frontend's origin, which no longer serves uploads at
  // all — a broken image with a URL that looks perfectly reasonable.
  return { url: absoluteAssetUrl(payload.url) };
}

/** Resolves a backend-relative asset path against the backend's origin. */
export function absoluteAssetUrl(url: string): string {
  if (!BASE) return url;
  if (/^https?:\/\//.test(url)) return url;
  return `${BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

export const restoreSection = (id: string, versionId: string) =>
  api<{ savedAt: string }>(`/api/v1/sections/${requireId(id)}`, {
    method: "POST",
    body: { versionId },
  });
