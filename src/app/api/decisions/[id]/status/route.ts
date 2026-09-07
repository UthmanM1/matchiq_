import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    await requireSession();
    const { status } = await req.json();
    const decision = DecisionService.setStatus(id, status);
    return NextResponse.json({ decision });
  } catch {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }
}
