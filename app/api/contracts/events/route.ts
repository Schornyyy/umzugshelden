import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/config/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment, setDoc, getDoc } from 'firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { contractId, type, companyId, companyEmail, meta } = await req.json();

    if (!contractId || !type) {
      return NextResponse.json({ success: false, error: 'contractId und type sind erforderlich' }, { status: 400 });
    }

    // Log event in subcollection
    const eventsCol = collection(database, 'contracts', contractId, 'events');
    await addDoc(eventsCol, {
      type,
      companyId: companyId || null,
      companyEmail: companyEmail || null,
      meta: meta || null,
      createdAt: serverTimestamp(),
    });

    // Update aggregate stats document
    const statsRef = doc(database, 'contracts', contractId, 'metrics', 'stats');
    const statsSnap = await getDoc(statsRef);
    if (!statsSnap.exists()) {
      await setDoc(statsRef, { views: 0, purchaseAttempts: 0, emailClicks: 0, notifiedCount: 0 }, { merge: true });
    }

  const increments: Partial<{ views: unknown; purchaseAttempts: unknown; emailClicks: unknown; notifiedCount: unknown }> = {};
    if (type === 'view') increments.views = increment(1);
    if (type === 'purchase_attempt') increments.purchaseAttempts = increment(1);
    if (type === 'email_click') increments.emailClicks = increment(1);
    if (type === 'notify_sent') increments.notifiedCount = increment(1);

    if (Object.keys(increments).length > 0) {
      await updateDoc(statsRef, increments);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Fehler beim Loggen des Contract-Events:', error);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
