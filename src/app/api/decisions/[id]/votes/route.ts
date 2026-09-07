import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { CollaborationService } from "@/lib/services/CollaborationService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const { vendorId, value } = await req.json();
    const votes = CollaborationService.vote(id, session.organisationId, vendorId, session.userId, session.fullName, value);
    return NextResponse.json({ votes, summary: CollaborationService.voteSummary(id, vendorId) });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
