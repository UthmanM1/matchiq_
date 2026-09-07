import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { CollaborationService } from "@/lib/services/CollaborationService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const { body, type, vendorId } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "Note can't be empty." }, { status: 400 });
    const note = CollaborationService.addNote(id, type || "question", body, session.userId, session.fullName, vendorId);
    return NextResponse.json({ note });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
