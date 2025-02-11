import path from 'path';
import fs from 'fs';
import nodemailer from 'nodemailer';

// Hilfsfunktion zur Textersetzung
const replaceTemplatePlaceholders = (template: string, replacements: { [key: string]: string }) => {
  return template.replace(/\{\{(.*?)\}\}/g, (_, key) => {
    return replacements[key.trim()] || `{{${key}}}`;
  });
};

export async function sendCustomEmail({
  to,
  subject,
  replacements,
  templatePath
}: {
  to: string;
  subject: string;
  replacements: { [key: string]: string };
  templatePath: string;
}) {
  try {
    
    // Korrigiere den Pfad relativ zum Wurzelverzeichnis
    const htmlTemplatePath = path.join(process.cwd(), "/emailtemplates/" ,  templatePath);

    // Versuche, die HTML-Datei zu laden
    const htmlTemplate = fs.readFileSync(htmlTemplatePath, 'utf-8');

    // Platzhalter ersetzen
    const emailContentHtml = replaceTemplatePlaceholders(htmlTemplate, replacements);

    // SMTP-Transporter einrichten und E-Mail senden (wie zuvor)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Landschaftshelden.io" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: emailContentHtml,
    });

    console.log('E-Mail gesendet: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail:', error);
    return { success: false, error };
  }
}
