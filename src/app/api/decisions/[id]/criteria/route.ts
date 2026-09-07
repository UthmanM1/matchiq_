import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { CriteriaService } from "@/lib/services/CriteriaService";
import { DecisionService } from "@/lib/services/DecisionService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const { name, weight, importance } = await req.json();
    if (!name) return NextResponse.json({ error: "Criterion name is required." }, { status: 400 });
    const criteria = CriteriaService.add(id, session.organisationId, session.userId, name, Number(weight) || 10, importance || "important");
    await DecisionService.rescoreAll(id);
    return NextResponse.json({ criteria });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
