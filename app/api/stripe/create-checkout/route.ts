import { NextRequest, NextResponse } from 'next/server';
import { ContractPreview } from '@/actions/contractActions';
import Stripe from 'stripe';
import { database } from '@/config/firebase';
import { addDoc, collection, serverTimestamp, Timestamp } from 'firebase/firestore';

// Stripe initialisieren
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

// Interface für Purchase-Daten
interface PurchasedContract {
  contractId: string;
  companyId: string;
  companyName: string;
  contractTitle: string;
  contractType: string;
  contractZip: number;
  amount: number;
  currency: string;
  stripePaymentIntentId: string;
  stripeSessionId: string;
  paymentStatus: 'pending' | 'succeeded' | 'failed' | 'canceled';
  purchasedAt: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export async function POST(request: NextRequest) {
  try {
    const { 
      contractPreview, 
      companyId, 
      companyName,
      amount,
      currency
    }: {
      contractPreview: ContractPreview;
      companyId: string;
      companyName: string;
      amount: number; // in Cent
      currency: string;
    } = await request.json();

    // Validierung
    if (!contractPreview || !companyId || !companyName || !amount) {
      return NextResponse.json(
        { error: 'Fehlende erforderliche Parameter' },
        { status: 400 }
      );
    }

    if (!contractPreview.id) {
      return NextResponse.json(
        { error: 'Contract ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Erstelle Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'sepa_debit', "paypal", "klarna"],
      line_items: [
        {
          price_data: {
            currency: currency.toLowerCase(),
            product_data: {
              name: `Gartenauftrag - ${contractPreview.type}`,
              description: `PLZ: ${contractPreview.zip} • Gartengröße: ${contractPreview.gardenSize}m² • ${contractPreview.contractSize}`,
              metadata: {
                contractId: contractPreview.id,
                companyId: companyId,
                contractType: contractPreview.type,
              },
            },
            unit_amount: amount, // Bereits in Cent
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_URL}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}&redirect_to=/company/${companyId}/contracts?success=true&purchased=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/company/${companyId}/contracts?canceled=true`,
      metadata: {
        contractId: contractPreview.id,
        companyId: companyId,
        companyName: companyName,
        contractType: contractPreview.type,
        contractZip: contractPreview.zip.toString(),
      },
      customer_email: undefined, // Optional: Kunde kann E-Mail eingeben
      billing_address_collection: 'required',
    });

    // Speichere Purchase in Firebase mit "pending" Status
    const purchaseData: PurchasedContract = {
      contractId: contractPreview.id,
      companyId,
      companyName,
      contractTitle: `${contractPreview.type} - ${contractPreview.zip}`,
      contractType: contractPreview.type,
      contractZip: contractPreview.zip,
      amount: amount / 100, // Zurück zu Euro für DB
      currency,
      stripePaymentIntentId: session.payment_intent as string || 'pending', // Fallback für null
      stripeSessionId: session.id,
      paymentStatus: 'pending',
      purchasedAt: serverTimestamp() as Timestamp,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };

    await addDoc(collection(database, 'purchased_contracts'), purchaseData);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      success: true
    });

  } catch (error) {
    console.error('Fehler beim Erstellen der Checkout Session:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        success: false
      },
      { status: 500 }
    );
  }
}
