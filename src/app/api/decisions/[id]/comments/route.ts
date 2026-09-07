import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { CollaborationService } from "@/lib/services/CollaborationService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const { body, vendorId } = await req.json();
    if (!body?.trim()) return NextResponse.json({ error: "Comment can't be empty." }, { status: 400 });
    const comment = CollaborationService.addComment(id, session.organisationId, session.userId, session.fullName, body, vendorId);
    return NextResponse.json({ comment });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
