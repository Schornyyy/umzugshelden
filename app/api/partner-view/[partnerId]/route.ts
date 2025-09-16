import { NextResponse } from 'next/server';
import { addPartnerEvent, incrementPartnerStat } from '@/actions/partnerActions';

export async function GET(_req: Request, { params }: { params: Promise<{ partnerId: string }> }) {
  try {
    const { partnerId } = await params;
    if (!partnerId) return NextResponse.json({ error: 'missing partnerId' }, { status: 400 });
    await incrementPartnerStat(partnerId, 'views');
    await addPartnerEvent(partnerId, { type: 'view', createdAt: Date.now() });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}
