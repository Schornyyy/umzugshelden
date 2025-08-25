import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

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
      const eventsCol = collection(database, 'contracts', contractId, 'events');
      await addDoc(eventsCol, {
        type: 'email_open',
        companyEmail: companyEmail || null,
        companyId: null,
        meta: null,
        createdAt: serverTimestamp(),
      });

      const statsRef = doc(database, 'contracts', contractId, 'metrics', 'stats');
      const statsSnap = await getDoc(statsRef);
      if (!statsSnap.exists()) {
        await setDoc(statsRef, { views: 0, purchaseAttempts: 0, emailClicks: 0, notifiedCount: 0 }, { merge: true });
      }
      // We might want a separate opens counter; reuse emailClicks or add later.
      await updateDoc(statsRef, { emailClicks: increment(0) });
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
