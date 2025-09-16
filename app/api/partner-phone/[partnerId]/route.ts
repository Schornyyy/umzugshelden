import { NextResponse } from 'next/server';
import { addPartnerEvent, incrementPartnerStat } from '@/actions/partnerActions';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ partnerId: string }> }
) {
  try {
    const { partnerId } = await params;
    if (!partnerId) return NextResponse.json({ error: 'missing partnerId' }, { status: 400 });
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('to') || undefined;
    await incrementPartnerStat(partnerId, 'phoneClicks');
    await addPartnerEvent(partnerId, { type: 'phone_click', createdAt: Date.now(), target: phone });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
