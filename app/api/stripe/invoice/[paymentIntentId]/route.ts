import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import puppeteer from 'puppeteer';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-07-30.basil',
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  try {
    const { paymentIntentId } = await params;

    if (!paymentIntentId || paymentIntentId === 'null' || paymentIntentId === 'pending') {
      return NextResponse.json(
        { error: 'Payment Intent ID ist nicht verfügbar. Die Rechnung kann erst nach erfolgreicher Zahlung heruntergeladen werden.' },
        { status: 400 }
      );
    }

    // Sonderfall: Kostenloser Erstauftrag -> eigene "Null-Rechnung" ohne Stripe
    if (paymentIntentId === 'free-first') {
      const freeHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Nullrechnung - Kostenloser Erstauftrag</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#333;font-size:14px;line-height:1.5;}h1{color:#16a34a;font-size:20px;margin:0 0 10px;}table{width:100%;border-collapse:collapse;margin-top:25px;}th,td{padding:10px;border-bottom:1px solid #eee;text-align:left;}th{background:#f5f5f5;} .total{font-weight:700;} .badge{display:inline-block;background:#dcfce7;color:#166534;padding:4px 10px;border-radius:999px;font-size:12px;font-weight:600;margin-top:8px;} .footer{margin-top:40px;font-size:11px;color:#555;border-top:1px solid #ddd;padding-top:15px;}</style></head><body><h1>Nullrechnung – Kostenloser Erstauftrag</h1><div class="badge">FREE FIRST CONTRACT</div><p>Diese Rechnung bestätigt den kostenlosen Erwerb Ihres ersten Auftrags über Landschaftshelden.io.</p><table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Einzelpreis</th><th>Gesamt</th></tr></thead><tbody><tr><td>Erster Auftragszugang (Aktivierungsaktion)</td><td>1</td><td>€0.00</td><td>€0.00</td></tr></tbody></table><p class="total" style="text-align:right;">Gesamtbetrag: €0.00</p><div class="footer"><p>Landschaftshelden.io – Ihr Marktplatz für Garten- & Landschaftspflege</p><p>support@landschaftshelden.io • https://landschaftshelden.io</p><p><em>Automatisch erstellt – keine Unterschrift erforderlich.</em></p></div></body></html>`;
      try {
        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(freeHtml, { waitUntil: 'networkidle0' });
        const pdf = await page.pdf({ format: 'A4', printBackground: true, margin:{ top:'15mm', right:'15mm', bottom:'15mm', left:'15mm'} });
        await browser.close();
  const pdfBuffer = Buffer.from(pdf);
  return new NextResponse(pdfBuffer, { headers: { 'Content-Type':'application/pdf', 'Content-Disposition':'attachment; filename="nullrechnung_free_first.pdf"' }});
      } catch (e) {
        console.error('Fehler beim Erstellen der Nullrechnung:', e);
        return NextResponse.json({ error: 'Nullrechnung konnte nicht erstellt werden' }, { status: 500 });
      }
    }

  // Hole das Payment Intent von Stripe
  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent) {
      return NextResponse.json(
        { error: 'Payment Intent nicht gefunden' },
        { status: 404 }
      );
    }

    // Erstelle eine HTML-Rechnung für PDF-Konvertierung
    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Rechnung - Landschaftshelden</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 100%; 
            margin: 0; 
            padding: 40px;
            color: #333;
            font-size: 14px;
            line-height: 1.6;
          }
          .header { 
            border-bottom: 2px solid #4CAF50; 
            padding-bottom: 20px; 
            margin-bottom: 30px;
          }
          .logo { 
            color: #4CAF50; 
            font-size: 28px; 
            font-weight: bold; 
            margin-bottom: 10px;
          }
          .invoice-details {
            display: table;
            width: 100%;
            margin-bottom: 30px;
          }
          .invoice-details > div {
            display: table-cell;
            vertical-align: top;
          }
          .invoice-details > div:last-child {
            text-align: right;
          }
          .invoice-number {
            background: #f5f5f5;
            padding: 15px;
            border-left: 4px solid #4CAF50;
            margin-top: 10px;
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
          }
          th, td { 
            padding: 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd; 
          }
          th { 
            background-color: #f8f8f8; 
            font-weight: bold;
          }
          .total { 
            font-size: 18px; 
            font-weight: bold; 
            color: #4CAF50;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">Landschaftshelden</div>
          <p>Professionelle Gartenpflege-Vermittlung</p>
        </div>
        
        <div class="invoice-details">
          <div>
            <h2>Rechnung</h2>
            <p><strong>Rechnungsdatum:</strong> ${new Date().toLocaleDateString('de-DE')}</p>
            <p><strong>Zahlungsdatum:</strong> ${new Date(paymentIntent.created * 1000).toLocaleDateString('de-DE')}</p>
          </div>
          <div class="invoice-number">
            <p><strong>Rechnungsnummer:</strong><br>${paymentIntentId.substring(0, 20)}</p>
            <p><strong>Payment ID:</strong><br>${paymentIntentId}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Beschreibung</th>
              <th>Menge</th>
              <th>Einzelpreis</th>
              <th>Gesamt</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Auftragserwerb über JobSmith<br><small>${paymentIntent.description || 'Gartenpflege-Auftrag'}</small></td>
              <td>1</td>
              <td>€${(paymentIntent.amount / 100).toFixed(2)}</td>
              <td>€${(paymentIntent.amount / 100).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <div style="text-align: right; margin-top: 20px;">
          <p><strong>Zwischensumme: €${(paymentIntent.amount / 100).toFixed(2)}</strong></p>
          <p><strong>MwSt. (19%): €${((paymentIntent.amount / 100) * 0.19).toFixed(2)}</strong></p>
          <p class="total">Gesamtbetrag: €${(paymentIntent.amount / 100).toFixed(2)}</p>
        </div>

        <div class="footer">
          <p><strong>Zahlungsinformationen:</strong></p>
          <p>Status: ${paymentIntent.status === 'succeeded' ? 'Bezahlt' : paymentIntent.status}</p>
          <p>Zahlungsmethode: ${paymentIntent.payment_method_types?.join(', ') || 'Kreditkarte'}</p>
          <p>Währung: ${paymentIntent.currency.toUpperCase()}</p>
          
          <hr style="margin: 20px 0;">
          
          <p><strong>Landschaftshelden</strong><br>
          Professionelle Gartenpflege-Vermittlung<br>
          E-Mail: support@landschaftshelden.io<br>
          Web: www.landschaftshelden.io</p>

          <p><em>Diese Rechnung wurde automatisch erstellt und ist ohne Unterschrift gültig.</em></p>
        </div>
      </body>
      </html>
    `;

    // Konvertiere HTML zu PDF mit Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(invoiceHtml, { waitUntil: 'networkidle0' });
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true
    });
    
    await browser.close();

  return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="rechnung_${paymentIntentId.substring(0, 10)}.pdf"`,
      },
    });

  } catch (error) {
    console.error('Fehler beim Abrufen der Rechnung:', error);
    return NextResponse.json(
      { error: 'Fehler beim Abrufen der Rechnung' },
      { status: 500 }
    );
  }
}

