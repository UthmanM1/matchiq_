import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const { vendorId, action, rank } = await req.json();
    if (action === "remove") {
      const shortlist = DecisionService.removeFromShortlist(id, vendorId);
      return NextResponse.json({ shortlist });
    }
    if (action === "rank") {
      const shortlist = DecisionService.rank(id, vendorId, Number(rank));
      return NextResponse.json({ shortlist });
    }
    const shortlist = await DecisionService.addToShortlist(id, session.organisationId, session.userId, vendorId);
    return NextResponse.json({ shortlist });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
