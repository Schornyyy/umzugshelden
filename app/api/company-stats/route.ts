import { NextRequest } from "next/server";
import { getCompanyRecentEvents, getCompanyStats } from "@/actions/companyStatsActions";

// Fallback: parse companyId from path /api/company-stats/{companyId}
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  // pathname like /api/company-stats/abc123
  const segments = url.pathname.split('/').filter(Boolean);
  const idx = segments.indexOf('company-stats');
  const companyId = segments[idx + 1];
  const max = Number(url.searchParams.get('max') ?? 50);

  if (!companyId) {
    return new Response(JSON.stringify({ error: 'companyId missing' }), { status: 400 });
  }

  try {
    const [aggregate, events] = await Promise.all([
      getCompanyStats(companyId, true),
      getCompanyRecentEvents(companyId, isNaN(max) ? 50 : max, true),
    ]);
    return new Response(JSON.stringify({ aggregate, events }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Failed to load company stats:', e);
    return new Response(JSON.stringify({ error: 'Failed to load stats' }), { status: 500 });
  }
}
