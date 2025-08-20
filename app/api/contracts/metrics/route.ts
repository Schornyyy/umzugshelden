import { NextRequest, NextResponse } from 'next/server';
import { database } from '@/config/firebase';
import { doc, getDoc, collection, getDocs, orderBy, query, limit } from 'firebase/firestore';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const contractId = searchParams.get('contractId');
    if (!contractId) {
      return NextResponse.json({ success: false, error: 'contractId ist erforderlich' }, { status: 400 });
    }

    const statsRef = doc(database, 'contracts', contractId, 'metrics', 'stats');
    const statsSnap = await getDoc(statsRef);
    const stats = statsSnap.exists() ? statsSnap.data() : { views: 0, purchaseAttempts: 0, emailClicks: 0, notifiedCount: 0 };

    // Letzte 20 Events (optional)
    const eventsCol = collection(database, 'contracts', contractId, 'events');
    const eventsQuery = query(eventsCol, orderBy('createdAt', 'desc'), limit(20));
    const eventsSnap = await getDocs(eventsQuery);
    const events = eventsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return NextResponse.json({ success: true, stats, recentEvents: events });
  } catch (error) {
    console.error('Fehler beim Laden der Contract-Metriken:', error);
    return NextResponse.json({ success: false, error: 'Serverfehler' }, { status: 500 });
  }
}
