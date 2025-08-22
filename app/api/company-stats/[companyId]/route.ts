import { NextRequest } from "next/server";
import { getCompanyRecentEvents, getCompanyStats } from "@/actions/companyStatsActions";

type RouteContext = { params?: { companyId?: string } };

export async function GET(request: NextRequest, ctx: RouteContext) {
  const companyId: string | undefined = ctx.params?.companyId;
  const { searchParams } = new URL(request.url);
  const max = Number(searchParams.get("max") ?? 50);

  if (!companyId) {
    return new Response(JSON.stringify({ error: "companyId missing" }), { status: 400 });
  }

  try {
    const [aggregate, events] = await Promise.all([
      getCompanyStats(companyId, true),
      getCompanyRecentEvents(companyId, isNaN(max) ? 50 : max, true),
    ]);
    return new Response(JSON.stringify({ aggregate, events }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Failed to load company stats:", e);
    return new Response(JSON.stringify({ error: "Failed to load stats" }), { status: 500 });
  }
}
