import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { RequirementService } from "@/lib/services/RequirementService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const { questionId, answer } = await req.json();
    RequirementService.recordAnswer(id, session.organisationId, session.userId, questionId, answer);
    return NextResponse.json({ ok: true, requirement: RequirementService.getByDecision(id) });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
