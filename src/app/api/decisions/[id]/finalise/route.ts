import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const { selectedVendorId, rationale } = await req.json();
    if (!selectedVendorId || !rationale?.trim()) {
      return NextResponse.json({ error: "A selected vendor and rationale are both required." }, { status: 400 });
    }
    const decision = await DecisionService.finalise(id, session.organisationId, session.userId, selectedVendorId, rationale);
    return NextResponse.json({ decision });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
