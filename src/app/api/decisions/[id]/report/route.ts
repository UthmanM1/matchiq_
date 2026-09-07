import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { ReportService } from "@/lib/services/ReportService";

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  try {
    const session = await requireSession();
    const report = await ReportService.generate(id, session.organisationId, session.userId, session.fullName);
    return NextResponse.json({ report });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Unable to generate report." }, { status: 400 });
  }
}
