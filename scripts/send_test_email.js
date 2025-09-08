// Simple script to send a test email using current SMTP_* env vars
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load .env.local into process.env for direct Node execution
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
  } catch (_) {
    // ignore
  }
})();

(async () => {
  try {
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

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const info = await transporter.sendMail({
      from: `"Landschaftshelden.io" <${user}>`,
      to: 'support@landschaftshelden.io',
      subject: 'Test E-Mail – Landschaftshelden.io',
      html: `<p>Hallo, dies ist eine Test-E-Mail vom JobSmith System.</p><p>Datum: ${new Date().toISOString()}</p>`,
    });

    console.log('Sent ok. MessageId:', info && (info.messageId || info.response || 'unknown'));
    process.exit(0);
  } catch (e) {
    console.error('Send failed:', e && e.message ? e.message : e);
    process.exit(1);
  }
})();
