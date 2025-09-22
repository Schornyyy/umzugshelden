import { NextRequest } from "next/server";
import { recordPartnerInteraction } from "@/actions/partnerActions";

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pid = searchParams.get("pid");
    const t = searchParams.get("t") as "view" | "website" | "email" | "phone" | null;
    if (!pid || !t) {
      return new Response(JSON.stringify({ ok: false, error: "missing params" }), { status: 400 });
    }
    await recordPartnerInteraction(pid, t);
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "content-type": "application/json" } });
  } catch {
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
}