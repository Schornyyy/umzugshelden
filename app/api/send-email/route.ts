// app/api/send-email/route.ts

import { NextResponse } from "next/server";
import { sendCustomEmail } from "@/actions/emailActions"; // Importiere deine sendCustomEmail-Funktion

// Hilfsfunktion für POST-Methode
export async function POST(req: Request) {
  try {
  const { to, subject, replacements, templatePath, tracking } = await req.json();

    if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      throw new Error('Ungültige oder fehlende E-Mail-Adresse.');
    }

    const result = await sendCustomEmail({
      to,
      subject,
      replacements,
      templatePath,
      tracking,
    });

    if (result.success) {
      return NextResponse.json({ message: "E-Mail wurde erfolgreich gesendet." });
    } else {
      const errorMessage = typeof result.error === "string" ? result.error : "Unbekannter Fehler beim Senden der E-Mail";
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error("Fehler beim Senden der E-Mail:", error);
    const errorResponse = error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json({ error: errorResponse }, { status: 500 });
  }
}


