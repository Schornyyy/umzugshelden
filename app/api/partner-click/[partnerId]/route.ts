import { NextResponse } from 'next/server';
import { getPartner, incrementPartnerClick } from '@/actions/partnerActions';
import { database } from '@/config/firebase';
import { addDoc, collection } from 'firebase/firestore';

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
      await incrementPartnerClick(partnerId);
      // Event protokollieren
      const eventsCol = collection(database, 'partners', partnerId, 'events');
      await addDoc(eventsCol, { type: 'click', createdAt: Date.now() });
      return NextResponse.redirect(partner.link, { status: 307 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'server error' }, { status: 500 });
  }
}