import { NextResponse } from 'next/server';
import { getPartner, incrementPartnerClick, addPartnerEvent, incrementPartnerStat } from '@/actions/partnerActions';

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
    if (partner.link) {
      await incrementPartnerClick(partnerId); // legacy counter
      await incrementPartnerStat(partnerId, 'websiteClicks');
      await addPartnerEvent(partnerId, { type: 'website_click', createdAt: Date.now(), target: partner.link });
      return NextResponse.redirect(partner.link, { status: 307 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}