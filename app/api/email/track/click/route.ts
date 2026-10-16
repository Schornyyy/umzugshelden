import { NextRequest, NextResponse } from 'next/server';
import { getAdminDatabase } from '@/lib/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get('contractId');
    const companyEmail = searchParams.get('companyEmail');
    const target = searchParams.get('target');

    if (contractId) {
      const database = getAdminDatabase();
      const contract = database.collection('contracts').doc(contractId);
      await contract.collection('events').add({
        type: 'email_click',
        companyEmail: companyEmail || null,
        companyId: null,
        meta: { target },
        createdAt: FieldValue.serverTimestamp(),
      });

      const statsRef = contract.collection('metrics').doc('stats');
      const statsSnap = await statsRef.get();
      if (!statsSnap.exists) {
        await statsRef.set({ views: 0, purchaseAttempts: 0, emailClicks: 0, notifiedCount: 0 }, { merge: true });
      }
      await statsRef.update({ emailClicks: FieldValue.increment(1) });
    }

    const redirectTo = target ? decodeURIComponent(target) : (process.env.NEXT_PUBLIC_BASE_URL || '/');
    return NextResponse.redirect(redirectTo);
  } catch {
    return NextResponse.redirect(process.env.NEXT_PUBLIC_BASE_URL || '/');
  }
}