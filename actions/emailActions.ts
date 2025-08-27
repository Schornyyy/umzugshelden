import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Hilfsfunktion zur Textersetzung
const replaceTemplatePlaceholders = (template: string, replacements: { [key: string]: string }) => {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    return replacements[key.trim()] || `{{${key}}}`;
  });
};

// Reuse a single transporter instance to reduce connection overhead in batch operations
let sharedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!sharedTransporter) {
    sharedTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return sharedTransporter;
}

export async function sendCustomEmail({
  to,
  subject,
  replacements,
  templatePath,
  tracking
}: {
  to: string;
  subject: string;
  replacements: { [key: string]: string };
  templatePath: string;
  tracking?: { contractId?: string; companyEmail?: string };
}) {
  try {
    // Korrigiere den Pfad relativ zum Wurzelverzeichnis
    const htmlTemplatePath = path.join(process.cwd(), "/emailtemplates/" ,  templatePath);

    // Prüfe, ob die Template-Datei existiert
    if (!fs.existsSync(htmlTemplatePath)) {
      throw new Error(`Template-Datei nicht gefunden: ${htmlTemplatePath}`);
    }

    // Versuche, die HTML-Datei zu laden
    const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');

    // Platzhalter ersetzen
    let emailContentHtml = replaceTemplatePlaceholders(htmlTemplate, replacements);

    // Tracking-Pixel für Öffnungen anhängen
    if (tracking?.contractId) {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
      const pixelUrl = `${baseUrl}/api/email/track/open?contractId=${encodeURIComponent(tracking.contractId)}${tracking.companyEmail ? `&companyEmail=${encodeURIComponent(tracking.companyEmail)}` : ''}`;
      // Vor </body> einfügen, sonst ans Ende
      if (emailContentHtml.includes('</body>')) {
        emailContentHtml = emailContentHtml.replace('</body>', `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" /></body>`);
      } else {
        emailContentHtml += `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`;
      }
    }

    // SMTP-Transporter einrichten und E-Mail senden
  const transporter = getTransporter();

    await transporter.sendMail({
      from: `"Landschaftshelden.io" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: emailContentHtml,
    });

    return { success: true };
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return { success: false, error };
  }
}
