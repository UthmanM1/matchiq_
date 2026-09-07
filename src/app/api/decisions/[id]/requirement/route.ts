import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { RequirementService } from "@/lib/services/RequirementService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const { rawInput } = await req.json();
    if (!rawInput || rawInput.trim().length < 12) {
      return NextResponse.json({ error: "Tell us a bit more about what you need before we can analyse it." }, { status: 400 });
    }
    const result = await RequirementService.submitRawInput(id, session.organisationId, session.userId, rawInput);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
