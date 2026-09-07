import { cookies } from "next/headers";
import { db, newId, nowIso } from "@/lib/store/db";
import { AnalyticsService } from "@/lib/services/AnalyticsService";
import { slugify } from "@/lib/utils";
import type { Profile } from "@/types";

const SESSION_COOKIE = "matchiq_session";

export interface Session {
  userId: string;
  organisationId: string;
  fullName: string;
  email: string;
}

/**
 * Demo-mode auth: the session is a self-contained, signed-shape cookie
 * carrying the profile fields needed to render the app — NOT just a userId
 * that has to be looked up in the in-memory store.
 *
 * This matters specifically for serverless deployment (Vercel): each
 * function instance holds its own independent copy of the in-memory store,
 * so a userId minted by one instance may not exist in another. By storing
 * the full session payload in the cookie, staying "logged in" and seeing
 * your own name never depends on which instance handles a given request.
 * Data you create (decisions, comments, etc.) is still only visible from
 * the instance that handled the write — see README.md "Deploying to
 * Vercel" for what that means in practice and how to remove the limitation
 * entirely by connecting Supabase (see supabase/README.md).
 */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed.userId || !parsed.organisationId || !parsed.fullName || !parsed.email) return null;
    return { userId: parsed.userId, organisationId: parsed.organisationId, fullName: parsed.fullName, email: parsed.email };
  } catch {
    return null;
  }
}

export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHENTICATED");
  return session;
}

export async function setSessionCookie(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export function findProfileByEmail(email: string): Profile | undefined {
  return db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
}

export function profileToSession(profile: Profile): Session {
  return { userId: profile.id, organisationId: profile.organisationId, fullName: profile.fullName, email: profile.email };
}

/** Demo signup: creates a fresh organisation + owner profile. Real deployment: Supabase Auth + a DB trigger inserting into `profiles`. */
export function signUpDemoUser(fullName: string, email: string, organisationName: string) {
  const existing = findProfileByEmail(email);
  if (existing) return existing;

  const orgId = newId("org");
  db.organisations.push({ id: orgId, name: organisationName, slug: slugify(organisationName) || newId("org"), createdAt: nowIso() });

  const profile: Profile = {
    id: newId("user"),
    organisationId: orgId,
    email,
    fullName,
    avatarColor: ["#0F172A", "#1FB6A6", "#D97706", "#7C3AED"][Math.floor(Math.random() * 4)],
    createdAt: nowIso(),
  };
  db.profiles.push(profile);
  db.organisationMembers.push({ id: newId("om"), organisationId: orgId, userId: profile.id, role: "owner", createdAt: nowIso() });
  AnalyticsService.track(orgId, profile.id, "account_created", { email });
  return profile;
}

export { DEMO_LOGIN_EMAIL } from "./auth-constants";
