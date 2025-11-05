import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Simple test email sender for Brevo. Requires BREVO_API_KEY in environment.
// POST body (JSON): { to: string, name?: string, subject?: string, html?: string }
export async function POST(req: Request) {
  try {
    const apiKey = process.env.BREVO_API;
    if (!apiKey) {
      return NextResponse.json({ success: false, error: 'BREVO_API_KEY missing' }, { status: 500 });
    }
    const body = await req.json().catch(() => ({}));
    const to = body.to as string | undefined;
    if (!to) {
      return NextResponse.json({ success: false, error: 'Missing to' }, { status: 400 });
    }
    const name = (body.name as string) || 'Test Empfänger';
    const subject = (body.subject as string) || 'Hello world';
    const template = (body.template as string) || undefined;
    const vars: Record<string,string> = (body.vars as Record<string,string>) || {};

    let html = (body.html as string) || '<html><body><p>Hello,</p><p>Dies ist eine Test Email von Brevo.</p></body></html>';
    if (template) {
      try {
        const templatesDir = path.join(process.cwd(), 'emailtemplates');
        const fileName = template.endsWith('.html') ? template : `${template}.html`;
        const fullPath = path.join(templatesDir, fileName);
        const raw = await fs.readFile(fullPath, 'utf8');
        html = raw.replace(/\{\{(.*?)\}\}/g, (_m, p1) => {
          const key = String(p1).trim();
          return Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{{${key}}}`;
        });
      } catch (e) {
        console.warn('Template load failed, falling back to provided html/content', e);
      }
    }

    const payload = {
      sender: {
  name: 'GS-Creatives System',
  email: 'noreply@gs-creatives.de'
      },
      to: [{ email: to, name }],
      subject,
      htmlContent: html
    };

    const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': apiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      return NextResponse.json({ success: false, error: 'Brevo error', status: resp.status, data }, { status: 500 });
    }
  return NextResponse.json({ success: true, data, usedTemplate: template || null });
  } catch (e) {
    console.error('Brevo test email error', e);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
