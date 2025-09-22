import { NextResponse } from 'next/server';
import { getPartner, recordPartnerInteraction } from '@/actions/partnerActions';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params;
    if (!partnerId) {
      return NextResponse.json({ error: 'missing partnerId' }, { status: 400 });
    }
    const partner = await getPartner(partnerId);
    if (!partner) {
      return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
    const target = partner.infos?.website;
    if (target) {
      // Single unified interaction recorder (handles aggregate + event)
      await recordPartnerInteraction(partnerId, 'website', { target });
      return NextResponse.redirect(target, { status: 307 });
    }
    return NextResponse.json({ ok: true, noRedirect: true });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}