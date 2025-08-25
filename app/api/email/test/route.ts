import { NextRequest, NextResponse } from 'next/server';
import { sendCustomEmail } from '@/actions/emailActions';

export async function POST(req: NextRequest) {
  try {
    const { to = 'support@landschaftshelden.io', contractId = 'test-contract' } = await req.json().catch(() => ({}));
    const base = process.env.NEXT_PUBLIC_BASE_URL || '';
    const replacements = {
      contractLink: `${base}/login`,
      trackedContractLink: `${base}/api/email/track/click?contractId=${encodeURIComponent(contractId)}&target=${encodeURIComponent(base + '/login')}&companyEmail=${encodeURIComponent(to)}`,
      contractTypeLabel: 'Test-Service',
      zip: '00000',
      gardenSize: '100',
      contractSizeLabel: 'Test',
      planningLabel: 'Nein',
      repeatLabel: 'Nein',
      projectBeginLabel: 'Schnellstmöglich',
      priceEuro: '0,00 €',
      description: 'Dies ist eine Test-E-Mail für Tracking.'
    };

    const result = await sendCustomEmail({
      to,
      subject: 'Test E-Mail Tracking',
      replacements,
      templatePath: 'CompanyContractEmail.html',
      tracking: { contractId, companyEmail: to }
    });

    return NextResponse.json({ success: result.success });
  } catch (e) {
    return NextResponse.json({ success: false, error: (e as Error).message }, { status: 500 });
  }
}