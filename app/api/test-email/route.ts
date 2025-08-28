import { NextRequest, NextResponse } from 'next/server';
import { sendCustomEmail } from '@/actions/emailActions';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const to = searchParams.get('to') || 'support@landschaftshelden.io';
    const result = await sendCustomEmail({
      to,
      subject: 'Test E-Mail Landschaftshelden',
      templatePath: 'CompanyContractEmail.html',
      replacements: {
        trackedContractLink: 'https://landschaftshelden.io',
        contractTypeLabel: 'Test Service',
        zip: '00000',
        gardenSize: '250',
        contractSizeLabel: 'Klein',
        planningLabel: 'Nein',
        repeatLabel: 'Einmalig',
        projectBeginLabel: 'Schnellstmöglich',
        description: 'Dies ist eine Test-E-Mail um das Layout und den Versand zu prüfen.'
      },
      tracking: { contractId: 'test-contract', companyEmail: to }
    });
    if (!result.success) {
      return NextResponse.json({ success: false, error: 'Send failed' }, { status: 500 });
    }
    return NextResponse.json({ success: true, to });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}