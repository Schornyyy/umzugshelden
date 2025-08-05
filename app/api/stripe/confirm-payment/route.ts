import { NextRequest, NextResponse } from 'next/server';
import { confirmPaymentAndGrantAccess } from '@/actions/buyedContractActions';

export async function POST(request: NextRequest) {
  try {
    const { sessionId }: {
      sessionId: string;
    } = await request.json();

    // Validierung
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID ist erforderlich' },
        { status: 400 }
      );
    }

    // Bestätige Zahlung und gewähre Zugriff
    const purchasedContract = await confirmPaymentAndGrantAccess(
      sessionId,
    );

    if (!purchasedContract) {
      return NextResponse.json(
        { error: 'Zahlung konnte nicht bestätigt werden' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      purchasedContract,
      message: 'Zahlung erfolgreich bestätigt und Zugriff gewährt'
    });

  } catch (error) {
    console.error('Fehler beim Bestätigen der Zahlung:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unbekannter Fehler',
        success: false
      },
      { status: 500 }
    );
  }
}
