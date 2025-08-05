import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { database } from '@/config/firebase';
import { doc, updateDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { getContractById } from '@/actions/contractActions';

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    const redirectTo = searchParams.get('redirect_to') || '/';

    if (!sessionId) {
      return NextResponse.redirect(new URL(redirectTo + '&error=missing_session', request.url));
    }

    // Hole Session-Details von Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (!session) {
      return NextResponse.redirect(new URL(redirectTo + '&error=session_not_found', request.url));
    }

    // Finde den entsprechenden Purchase in Firebase
    const purchasesQuery = query(
      collection(database, 'purchased_contracts'),
      where('stripeSessionId', '==', sessionId)
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    
    if (querySnapshot.empty) {
      return NextResponse.redirect(new URL(redirectTo + '&error=purchase_not_found', request.url));
    }

    const purchaseDoc = querySnapshot.docs[0];
    const purchaseData = purchaseDoc.data();
    const purchaseRef = doc(database, 'purchased_contracts', purchaseDoc.id);

    // Prüfe Payment Status und update entsprechend
    if (session.payment_status === 'paid') {
      // Lade vollständige Contract-Daten
      try {
        const fullContractData = await getContractById(purchaseData.contractId);
        
        await updateDoc(purchaseRef, {
          paymentStatus: 'succeeded',
          stripePaymentIntentId: session.payment_intent as string, // Update mit korrekter Payment Intent ID
          accessGrantedAt: serverTimestamp(),
          contractData: fullContractData || undefined,
          updatedAt: serverTimestamp()
        });
      } catch (contractError) {
        console.error('Fehler beim Laden der Contract-Daten:', contractError);
        await updateDoc(purchaseRef, {
          paymentStatus: 'succeeded',
          stripePaymentIntentId: session.payment_intent as string, // Update mit korrekter Payment Intent ID
          accessGrantedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      // Erfolgreiche Zahlung - weiterleiten mit Success-Parameter
      return NextResponse.redirect(new URL(redirectTo, request.url));
      
    } else if (session.payment_status === 'unpaid') {
      await updateDoc(purchaseRef, {
        paymentStatus: 'failed',
        updatedAt: serverTimestamp()
      });
      
      // Fehlgeschlagene Zahlung
      return NextResponse.redirect(new URL(redirectTo.replace('success=true', 'success=false&error=payment_failed'), request.url));
      
    } else {
      await updateDoc(purchaseRef, {
        paymentStatus: 'pending',
        updatedAt: serverTimestamp()
      });
      
      // Pending Zahlung
      return NextResponse.redirect(new URL(redirectTo.replace('success=true', 'success=false&error=payment_pending'), request.url));
    }

  } catch (error) {
    console.error('Fehler beim Verarbeiten der Success-Callback:', error);
    
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirect_to') || '/';
    
    return NextResponse.redirect(new URL(redirectTo.replace('success=true', 'success=false&error=processing_error'), request.url));
  }
}
