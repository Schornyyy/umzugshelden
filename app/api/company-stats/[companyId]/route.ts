import { getCompanyRecentEvents, getCompanyStats } from "@/actions/companyStatsActions";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { companyId: string } }
) {
  const { companyId } = params;
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
