import { authorizeAdminOwner } from "@/lib/adminApiAuth";
import { launchPdfBrowser, type PdfBrowser } from "@/lib/launchPdfBrowser";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_HTML_LENGTH = 2_000_000;

type OfferPdfRequest = {
  ownerId?: string;
  html?: string;
  filename?: string;
};

function sanitizeFilename(value: string | undefined) {
  const base = (value ?? "")
    .replace(/\.pdf$/i, "")
    .replace(/[^\p{L}\p{N} ._-]+/gu, "")
    .trim()
    .slice(0, 120);
  return `${base || "Kostenvoranschlag"}.pdf`;
}

export async function POST(request: Request) {
  let browser: PdfBrowser | undefined;

  try {
    const body = (await request.json().catch(() => ({}))) as OfferPdfRequest;
    const ownerId = body.ownerId?.trim() ?? "";
    if (!(await authorizeAdminOwner(request, ownerId))) {
      return NextResponse.json({ error: "Nicht autorisiert." }, { status: 401 });
    }
    const html = body.html ?? "";
    if (!html.trim() || html.length > MAX_HTML_LENGTH) {
      return NextResponse.json(
        { error: "Das Dokument ist leer oder zu groß." },
        { status: 400 }
      );
    }

    browser = await launchPdfBrowser();
    const page = await browser.newPage();
    await page.setJavaScriptEnabled(false);
    // Only remote images/styles may be loaded; local files and other schemes are blocked.
    await page.setRequestInterception(true);
    page.on("request", (pageRequest) => {
      const url = pageRequest.url();
      if (/^(https?:|data:)/i.test(url) || url === "about:blank") {
        void pageRequest.continue();
      } else {
        void pageRequest.abort();
      }
    });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30_000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
    });
    const filename = sanitizeFilename(body.filename);

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${filename.replace(/[^\x20-\x7E]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
        "Content-Type": "application/pdf",
      },
    });
  } catch (error) {
    console.error("Fehler beim Erstellen des Kostenvoranschlags:", error);
    return NextResponse.json(
      { error: "Das PDF konnte nicht erstellt werden." },
      { status: 500 }
    );
  } finally {
    await browser?.close();
  }
}
