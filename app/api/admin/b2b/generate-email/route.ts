import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { parseGeneratedEmailMarkdown } from "@/lib/b2bEmailDraft";
import { getAdminDatabase } from "@/lib/firebaseAdmin";
import { sendKnowledgeChatMessage } from "@/lib/knowledgeChatN8n";
import type { B2bLeadCategory } from "@/types/B2b";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GenerateEmailRequest = {
  ownerId?: string;
  leadId?: string;
};

const LEAD_COLLECTION = "b2b_leads_umzugshelden";
const categoryApproaches: Record<B2bLeadCategory, string> = {
  real_estate_agent:
    "Biete eine Empfehlungskooperation an. Der Makler erhält für erfolgreich vermittelte Umzugsaufträge eine attraktive Provision nach individueller Vereinbarung.",
  property_management:
    "Biete einen verlässlichen Ansprechpartner für Mieterwechsel, Umzüge, Entrümpelungen und besenreine Übergaben an.",
  housing_company:
    "Biete planbare Unterstützung bei Mieterwechseln, Umzügen, Räumungen und Wohnungsübergaben für den Bestand an.",
  senior_care:
    "Biete einfühlsam organisierte Seniorenumzüge, Haushaltsauflösungen und Unterstützung für Bewohner und Angehörige an.",
};
const categoryLabels: Record<B2bLeadCategory, string> = {
  real_estate_agent: "Immobilienmakler",
  property_management: "Immobilienverwaltung",
  housing_company: "Wohnungsbaugesellschaft",
  senior_care: "Senioren-/Pflegeheim",
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateEmailRequest;
    const ownerId = body.ownerId?.trim() ?? "";
    if (!(await authorizeAdminOwner(request, ownerId))) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }

    const leadId = body.leadId?.trim() ?? "";
    if (!leadId) {
      return NextResponse.json({ error: "Lead fehlt." }, { status: 400 });
    }

    const snapshot = await getAdminDatabase()
      .collection(LEAD_COLLECTION)
      .doc(leadId)
      .get();
    if (!snapshot.exists || snapshot.get("ownerId") !== ownerId) {
      return NextResponse.json(
        { error: "Der B2B-Lead wurde nicht gefunden." },
        { status: 404 },
      );
    }

    const category = String(snapshot.get("category") ?? "") as B2bLeadCategory;
    const approach = categoryApproaches[category];
    const categoryLabel = categoryLabels[category];
    const companyName = String(snapshot.get("companyName") ?? "").trim();
    const contactName = String(snapshot.get("contactName") ?? "").trim();
    const website = String(snapshot.get("website") ?? "").trim();
    if (!approach || !categoryLabel || !companyName || !contactName || !website) {
      return NextResponse.json(
        {
          error:
            "Branche, Firma, Ansprechpartner und Website müssen vollständig sein.",
        },
        { status: 400 },
      );
    }

    const output = await sendKnowledgeChatMessage({
      category: "sales",
      testMode: false,
      sessionId: `b2b-crm-${leadId}`,
      message: `Erstelle eine kurze, seriöse deutsche B2B-Cold-Outreach-E-Mail für Umzugshelden.

Komm ohne Floskeln direkt zum geschäftlichen Nutzen. Schreibe höchstens 110 Wörter, nutze kurze Absätze und erfinde keine Referenzen, Zahlen, Garantien oder Tatsachen über den Empfänger. Stelle am Ende genau eine einfache Frage für ein kurzes Gespräch. Formuliere professionell und nicht aufdringlich.

Firma: ${companyName}
Ansprechpartner: ${contactName}
Branche: ${categoryLabel}
Website: ${website}
Angebotsansatz: ${approach}

Die Anrede soll zum Ansprechpartner passen. Der Text soll sofort erklären, welchen konkreten Kooperationsnutzen Umzugshelden bietet. Erzeuge den E-Mail-Text als Markdown. Füge keine Signatur hinzu, da diese automatisch ergänzt wird.

Antworte ausschließlich in diesem Format:
Betreff: <Betreff ohne Markdown>
---EMAIL---
<E-Mail-Text als Markdown>`,
      history: [],
      additionalFields: {
        ansprechpartner: contactName,
        branche: categoryLabel,
        unternehmensname: companyName,
      },
    });
    const { subject, body: emailBody } = parseGeneratedEmailMarkdown(output);
    if (!subject || !emailBody || subject.length > 200 || emailBody.length > 2_500) {
      throw new Error("n8n hat keinen gültigen E-Mail-Entwurf geliefert.");
    }

    return NextResponse.json({ subject, body: emailBody });
  } catch (error) {
    console.error("B2B email generation failed", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Der E-Mail-Entwurf konnte nicht erstellt werden.",
      },
      { status: 500 },
    );
  }
}
