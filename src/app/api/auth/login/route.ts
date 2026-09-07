import { NextRequest, NextResponse } from "next/server";
import { findProfileByEmail, profileToSession, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  const profile = findProfileByEmail(email || "");
  if (!profile) {
    return NextResponse.json(
      { error: "No account found with that email in this server instance. Try the demo account, or sign up again — on serverless, a fresh instance may not have your earlier signup in memory yet." },
      { status: 404 }
    );
  }
  await setSessionCookie(profileToSession(profile));
  return NextResponse.json({ ok: true });
}
