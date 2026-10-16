import { NextRequest, NextResponse } from 'next/server';
import { getAdminDatabase } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

// Returns a 1x1 transparent gif
const GIF_BUFFER = Buffer.from(
  'R0lGODlhAQABAPAAAAAAAAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
  'base64'
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get('contractId');
    const companyEmail = searchParams.get('companyEmail');

    if (contractId) {
      const database = getAdminDatabase();
      const contract = database.collection('contracts').doc(contractId);
      await contract.collection('events').add({
        type: 'email_open',
        companyEmail: companyEmail || null,
        companyId: null,
        meta: null,
        createdAt: FieldValue.serverTimestamp(),
      });

      const statsRef = contract.collection('metrics').doc('stats');
      const statsSnap = await statsRef.get();
      if (!statsSnap.exists) {
        await statsRef.set({ views: 0, purchaseAttempts: 0, emailClicks: 0, emailOpens: 0, notifiedCount: 0 }, { merge: true });
      }
      await statsRef.update({ emailOpens: FieldValue.increment(1) });
    }

    return new NextResponse(GIF_BUFFER, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch {
    return new NextResponse(GIF_BUFFER, { status: 200, headers: { 'Content-Type': 'image/gif' } });
  }
}
