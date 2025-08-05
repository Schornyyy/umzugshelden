/*
 * HINWEIS: Diese Webhook-Route ist OPTIONAL!
 * 
 * Das System funktioniert auch ohne Webhooks, da der Payment-Status
 * direkt über die Success-API (/api/stripe/success) geprüft wird.
 * 
 * Webhooks bieten jedoch folgende Vorteile:
 * - Zuverlässigere Event-Verarbeitung
 * - Handling von asynchronen Zahlungsmethoden
 * - Backup falls User die Success-Seite nicht erreicht
 * 
 * Wenn Sie Webhooks verwenden möchten, konfigurieren Sie:
 * 1. Webhook-Endpoint in Stripe Dashboard
 * 2. STRIPE_WEBHOOK_SECRET in .env.local
 * 3. Events: checkout.session.completed, payment_intent.succeeded, payment_intent.payment_failed
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { database } from '@/config/firebase';
import { doc, updateDoc, serverTimestamp, query, collection, where, getDocs } from 'firebase/firestore';
import { getContractById } from '@/actions/contractActions';

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('Keine Stripe Signature gefunden');
      return NextResponse.json(
        { error: 'Keine Stripe Signature gefunden' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      // Verifiziere Webhook Signature
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    console.log('Stripe Webhook erhalten:', event.type);

    // Verarbeite verschiedene Event-Typen
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Fehler beim Verarbeiten des Stripe Webhooks:', error);
    return NextResponse.json(
      { error: 'Webhook Verarbeitung fehlgeschlagen' },
      { status: 500 }
    );
  }
}

// Behandle erfolgreich abgeschlossene Checkout Session
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  try {
    console.log('Checkout Session abgeschlossen:', session.id);
    
    // Finde den entsprechenden Purchase
    const purchasesQuery = query(
      collection(database, 'purchased_contracts'),
      where('stripeSessionId', '==', session.id)
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    
    if (querySnapshot.empty) {
      console.error('Purchase nicht gefunden für Session:', session.id);
      return;
    }

    const purchaseDoc = querySnapshot.docs[0];
    const purchaseRef = doc(database, 'purchased_contracts', purchaseDoc.id);

    // Update Payment Status
    await updateDoc(purchaseRef, {
      paymentStatus: 'succeeded',
      accessGrantedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log('Purchase erfolgreich als bezahlt markiert:', purchaseDoc.id);
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Checkout Session:', error);
  }
}

// Behandle erfolgreiche Zahlung
async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment Intent erfolgreich:', paymentIntent.id);
    
    // Finde den entsprechenden Purchase
    const purchasesQuery = query(
      collection(database, 'purchased_contracts'),
      where('stripePaymentIntentId', '==', paymentIntent.id)
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    
    if (querySnapshot.empty) {
      console.error('Purchase nicht gefunden für Payment Intent:', paymentIntent.id);
      return;
    }

    const purchaseDoc = querySnapshot.docs[0];
    const purchaseData = purchaseDoc.data();
    const purchaseRef = doc(database, 'purchased_contracts', purchaseDoc.id);

    // Lade vollständige Contract-Daten
    try {
      const fullContractData = await getContractById(purchaseData.contractId);
      
      if (fullContractData) {
        // Update mit vollständigen Contract-Daten
        await updateDoc(purchaseRef, {
          paymentStatus: 'succeeded',
          accessGrantedAt: serverTimestamp(),
          contractData: {
            ...fullContractData,
            // Entferne sensitive Daten falls nötig
          },
          updatedAt: serverTimestamp()
        });
      } else {
        // Nur Status update falls Contract nicht gefunden
        await updateDoc(purchaseRef, {
          paymentStatus: 'succeeded',
          accessGrantedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
    } catch (contractError) {
      console.error('Fehler beim Laden der Contract-Daten:', contractError);
      // Trotzdem als bezahlt markieren
      await updateDoc(purchaseRef, {
        paymentStatus: 'succeeded',
        accessGrantedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }

    console.log('Purchase mit Contract-Daten aktualisiert:', purchaseDoc.id);
  } catch (error) {
    console.error('Fehler beim Verarbeiten des Payment Intent:', error);
  }
}

// Behandle fehlgeschlagene Zahlung
async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    console.log('Payment Intent fehlgeschlagen:', paymentIntent.id);
    
    // Finde den entsprechenden Purchase
    const purchasesQuery = query(
      collection(database, 'purchased_contracts'),
      where('stripePaymentIntentId', '==', paymentIntent.id)
    );
    
    const querySnapshot = await getDocs(purchasesQuery);
    
    if (querySnapshot.empty) {
      console.error('Purchase nicht gefunden für Payment Intent:', paymentIntent.id);
      return;
    }

    const purchaseDoc = querySnapshot.docs[0];
    const purchaseRef = doc(database, 'purchased_contracts', purchaseDoc.id);

    // Update Payment Status zu failed
    await updateDoc(purchaseRef, {
      paymentStatus: 'failed',
      updatedAt: serverTimestamp()
    });

    console.log('Purchase als fehlgeschlagen markiert:', purchaseDoc.id);
  } catch (error) {
    console.error('Fehler beim Verarbeiten des fehlgeschlagenen Payment Intent:', error);
  }
}
