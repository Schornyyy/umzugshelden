// Sends a single lead notification test email with tracking and landing link
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load .env.local into process.env
(() => {
  try {
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      content.split(/\r?\n/).forEach((line) => {
        if (!line || line.trim().startsWith('#')) return;
        const idx = line.indexOf('=');
        if (idx === -1) return;
        const key = line.slice(0, idx).trim();
        let val = line.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      });
    }
  } catch (_) {}
})();

(async () => {
  try {
    const to = process.argv[2] || 'support@landschaftshelden.io';
    const contractId = process.argv[3] || `test-contract-${Date.now()}`;
    const companyEmail = to;

    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure = Number(process.env.SMTP_PORT) === 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    const missing = [];
    if (!host) missing.push('SMTP_HOST');
    if (!user) missing.push('SMTP_USER');
    if (!pass) missing.push('SMTP_PASS');
    if (missing.length) {
      console.error('Missing env vars:', missing.join(', '));
      process.exit(2);
    }

    const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')).replace(/\/$/, '');
    const urlParams = `contractId=${encodeURIComponent(String(contractId))}&companyEmail=${encodeURIComponent(companyEmail)}`;
    const landingTarget = `${baseUrl}/fuer-unternehmen/auftrag/${encodeURIComponent(String(contractId))}?companyEmail=${encodeURIComponent(companyEmail)}`;
    const trackedRegistrationLink = `${baseUrl}/api/email/track/click?${urlParams}&target=${encodeURIComponent(landingTarget)}`;

    const templatePath = path.join(process.cwd(), 'emailtemplates', 'AutoProfileInviteEmail.html');
    if (!fs.existsSync(templatePath)) {
      throw new Error('Template not found: ' + templatePath);
    }
    let html = fs.readFileSync(templatePath, 'utf8');

    const replacements = {
      trackedRegistrationLink,
      contractTypeLabel: 'Gartengestaltung',
      zip: '10115',
      gardenSize: '150',
      contractSizeLabel: 'Neuanlage',
      planningLabel: 'Ja',
      repeatLabel: 'Nein',
      projectBeginLabel: 'Schnellstmöglich',
      description: 'Beispielauftrag zur Prüfung des E-Mail-Trackings und der Lead-Benachrichtigung. Bitte ignorieren.',
    };
    html = html.replace(/\{\{(.*?)\}\}/g, (_, key) => (replacements[key.trim()] || `{{${key}}}`));

    // Add open tracking pixel
    if (baseUrl) {
      const pixelUrl = `${baseUrl}/api/email/track/open?${urlParams}`;
      if (html.includes('</body>')) {
        html = html.replace('</body>', `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" /></body>`);
      } else {
        html += `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`;
      }
    }

    const transporter = nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
    const info = await transporter.sendMail({
      from: `"Landschaftshelden.io" <${user}>`,
      to,
      subject: `Test: Lead-Benachrichtigung & Tracking (${contractId})`,
      html,
    });
    console.log('Sent ok. MessageId:', info && (info.messageId || info.response || 'unknown'));
  } catch (e) {
    console.error('Send failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
