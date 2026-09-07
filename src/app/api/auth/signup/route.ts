import { NextRequest, NextResponse } from "next/server";
import { signUpDemoUser, setSessionCookie, profileToSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { fullName, email, organisationName } = await req.json();
  if (!fullName || !email || !organisationName) {
    return NextResponse.json({ error: "Full name, email and organisation name are required." }, { status: 400 });
  }
  const profile = signUpDemoUser(fullName, email, organisationName);
  await setSessionCookie(profileToSession(profile));
  return NextResponse.json({ ok: true });
}
