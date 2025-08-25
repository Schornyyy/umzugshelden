import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get('contractId');
    const companyEmail = searchParams.get('companyEmail');
    const target = searchParams.get('target');

    if (contractId) {
      const eventsCol = collection(database, 'contracts', contractId, 'events');
      await addDoc(eventsCol, {
        type: 'email_click',
        companyEmail: companyEmail || null,
        companyId: null,
        meta: { target },
        createdAt: serverTimestamp(),
      });

      const statsRef = doc(database, 'contracts', contractId, 'metrics', 'stats');
      const statsSnap = await getDoc(statsRef);
      if (!statsSnap.exists()) {
        await setDoc(statsRef, { views: 0, purchaseAttempts: 0, emailClicks: 0, notifiedCount: 0 }, { merge: true });
      }
      await updateDoc(statsRef, { emailClicks: increment(1) });
    }

    const redirectTo = target ? decodeURIComponent(target) : (process.env.NEXT_PUBLIC_BASE_URL || '/');
    return NextResponse.redirect(redirectTo);
  } catch {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_BASE_URL || '/');
  }
}