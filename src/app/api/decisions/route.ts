import { NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { DecisionService } from "@/lib/services/DecisionService";

export async function POST(req: NextRequest) {
  try {
    const session = await requireSession();
    const { name, category } = await req.json();
    if (!name || !category) return NextResponse.json({ error: "Name and category are required." }, { status: 400 });
    const decision = DecisionService.create(session.organisationId, session.userId, session.fullName, name, category);
    return NextResponse.json({ decision });
  } catch {
    return NextResponse.json({ error: "You need to be signed in to create a decision." }, { status: 401 });
  }
}
