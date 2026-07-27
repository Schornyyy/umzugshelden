import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Hilfsfunktion zur Textersetzung
const replaceTemplatePlaceholders = (template: string, replacements: Record<string, unknown>) => {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    const k = key.trim();
    const val = replacements?.[k];
    if (val === null || val === undefined) return `{{${k}}}`;
    // Localize booleans to German yes/no and coerce other non-strings
    if (typeof val === "boolean") {
      return val ? "Ja" : "Nein";
    }
    if (typeof val === "object") {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
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

    // Tracking-Pixel für Öffnungen anhängen + Links für Klick-Tracking umschreiben
    if (tracking?.contractId) {
      const baseUrl = (
        process.env.NEXT_PUBLIC_BASE_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
      ).replace(/\/$/, '');

      if (baseUrl) {
        const urlParams = `contractId=${encodeURIComponent(tracking.contractId)}${tracking.companyEmail ? `&companyEmail=${encodeURIComponent(tracking.companyEmail)}` : ''}`;
        const pixelUrl = `${baseUrl}/api/email/track/open?${urlParams}`;
        // Vor </body> einfügen, sonst ans Ende
        if (emailContentHtml.includes('</body>')) {
          emailContentHtml = emailContentHtml.replace('</body>', `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" /></body>`);
        } else {
          emailContentHtml += `<img src="${pixelUrl}" alt="" width="1" height="1" style="display:none;" />`;
        }

        // Klick-Tracking: hrefs auf Tracking-Redirect umlenken (nur http/https)
        emailContentHtml = emailContentHtml.replace(/href=\"(.*?)\"/gi, (match, p1) => {
          const href = p1 as string;
          // nicht tracken: mailto:, tel:, #, bereits track-Link
          if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.includes('/api/email/track/click')) {
            return match;
          }
          if (!/^https?:\/\//i.test(href)) {
            return match; // relative Links unverändert lassen (optional könnte man absolutieren)
          }
          const tracked = `${baseUrl}/api/email/track/click?${urlParams}&target=${encodeURIComponent(href)}`;
          return `href="${tracked}"`;
        });
      }
    }

    // SMTP-Transporter einrichten und E-Mail senden
  const transporter = getTransporter();

    const info = await transporter.sendMail({
      from: `"Umzugshelden" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: emailContentHtml,
    });
    return { success: true, info };
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    interface SMTPErrorLike {
      message?: string;
      code?: string;
      response?: string;
      responseCode?: number;
      command?: string;
      rejected?: string[];
    }
    const err = error as SMTPErrorLike;
    return { 
      success: false, 
      error: err?.message || 'unknown error',
      smtp: {
        code: err?.code,
        response: err?.response,
        responseCode: err?.responseCode,
        command: err?.command,
        rejected: err?.rejected,
      }
    };
  }
}
