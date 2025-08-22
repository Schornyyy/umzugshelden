import { getCompanyRecentEvents, getCompanyStats } from "@/actions/companyStatsActions";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Typed via RouteContext helper: path matches folder structure
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  const { companyId } = await params;
  const { searchParams } = new URL(request.url);
  const max = Number(searchParams.get("max") ?? 50);

  if (!companyId) {
    return NextResponse.json({ error: "companyId missing" }, { status: 400 });
  }

  try {
    const [aggregate, events] = await Promise.all([
      getCompanyStats(companyId, true),
      getCompanyRecentEvents(companyId, isNaN(max) ? 50 : max, true),
    ]);
    return NextResponse.json({ aggregate, events });
  } catch (e) {
    console.error("Failed to load company stats:", e);
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
