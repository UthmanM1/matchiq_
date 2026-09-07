import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { CollaborationService } from "@/lib/services/CollaborationService";
import { newId } from "@/lib/store/db";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await requireSession();
    const { name, role } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "A name is required to invite a team member." }, { status: 400 });
    const members = CollaborationService.invite(id, newId("user"), name, role || "member");
    return NextResponse.json({ members });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
