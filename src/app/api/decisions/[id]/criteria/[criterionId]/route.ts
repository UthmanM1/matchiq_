import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { CriteriaService } from "@/lib/services/CriteriaService";
import { DecisionService } from "@/lib/services/DecisionService";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string; criterionId: string }> }) {
  const { id, criterionId } = await ctx.params;
  try {
    const session = await requireSession();
    const { weight, importance } = await req.json();
    if (typeof weight === "number") CriteriaService.updateWeight(id, session.organisationId, session.userId, criterionId, weight);
    if (importance) CriteriaService.updateImportance(id, criterionId, importance);
    await DecisionService.rescoreAll(id);
    return NextResponse.json({ criteria: CriteriaService.list(id) });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string; criterionId: string }> }) {
  const { id, criterionId } = await ctx.params;
  try {
    await requireSession();
    const criteria = CriteriaService.remove(id, criterionId);
    await DecisionService.rescoreAll(id);
    return NextResponse.json({ criteria });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
