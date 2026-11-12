import "server-only";

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { generateGeminiJson } from "@/lib/gemini";
import { launchPdfBrowser } from "@/lib/launchPdfBrowser";
import type { B2bLeadCategory } from "@/types/B2b";
import type { Page } from "puppeteer-core";

export type DiscoveredBusiness = {
  companyName: string;
  contactName: string;
  address: string;
  phone: string;
  website: string;
  googleMapsUrl: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  emailCandidates: string[];
  contactContext: string;
  email: string;
  aiEmailReason: string;
  aiOfferAngle: string;
  aiStatus: "selected" | "no_email" | "failed";
};

const categoryQueries: Record<B2bLeadCategory, string[]> = {
  real_estate_agent: ["Immobilienmakler"],
  property_management: ["Immobilienverwaltung", "Hausverwaltung"],
  housing_company: ["Wohnungsbaugesellschaft", "Wohnungsunternehmen"],
  senior_care: ["Seniorenheim", "Pflegeheim"],
};

const emailPattern = /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+/gi;

function isPrivateIp(value: string) {
  if (value === "::1" || value.startsWith("fc") || value.startsWith("fd")) return true;
  if (!isIP(value)) return false;
  const parts = value.split(".").map(Number);
  return (
    value.startsWith("127.") ||
    value.startsWith("169.254.") ||
    value.startsWith("10.") ||
    value.startsWith("192.168.") ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
  );
}

async function assertPublicUrl(value: string) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("Nicht unterstütztes Website-Protokoll.");
  }
  const hostname = url.hostname.toLowerCase();
  if (hostname === "localhost" || hostname.endsWith(".local")) {
    throw new Error("Lokale Website-Adressen werden nicht abgerufen.");
  }
  const addresses = await lookup(hostname, { all: true });
  if (!addresses.length || addresses.some((entry) => isPrivateIp(entry.address))) {
    throw new Error("Private Website-Adressen werden nicht abgerufen.");
  }
  return url;
}

function cleanEmail(value: string) {
  return value
    .trim()
    .replace(/^mailto:/i, "")
    .split(/[?&#]/)[0]
    .toLowerCase();
}

function extractEmails(html: string) {
  const normalized = html
    .replace(/\s*(?:\(|\[)?at(?:\)|\])?\s*/gi, "@")
    .replace(/\s*(?:\(|\[)?dot(?:\)|\])?\s*/gi, ".");
  return Array.from(
    new Set(
      (normalized.match(emailPattern) ?? [])
        .map(cleanEmail)
        .filter(
          (email) =>
            email.length <= 254 &&
            !email.endsWith(".png") &&
            !email.endsWith(".jpg") &&
            !email.endsWith(".webp") &&
            !email.includes("example."),
        ),
    ),
  );
}

async function fetchHtml(value: string) {
  let url = await assertPublicUrl(value);
  for (let redirectCount = 0; redirectCount <= 3; redirectCount += 1) {
    const response = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131.0 Safari/537.36 Umzugshelden-B2B-Kontaktrecherche/1.0",
        "accept-language": "de-DE,de;q=0.9,en;q=0.7",
        accept: "text/html,application/xhtml+xml",
      },
      redirect: "manual",
      signal: AbortSignal.timeout(10_000),
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (!location || redirectCount === 3) {
        throw new Error("Website-Weiterleitung konnte nicht verarbeitet werden.");
      }
      url = await assertPublicUrl(new URL(location, url).toString());
      continue;
    }
    if (!response.ok) {
      throw new Error(`Website antwortete mit HTTP ${response.status}.`);
    }
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) {
      throw new Error("Website lieferte kein HTML.");
    }
    const html = await response.text();
    return { html: html.slice(0, 1_500_000), finalUrl: url.toString() };
  }
  throw new Error("Website konnte nicht geladen werden.");
}

function extractContactLinks(html: string, baseUrl: string) {
  const base = new URL(baseUrl);
  const assetExtension =
    /\.(?:avif|css|gif|ico|jpe?g|js|json|map|pdf|png|svg|webp|woff2?|xml)$/i;
  const links = Array.from(
    html.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"'#]+)["'][^>]*>/gi),
  )
    .map((match) => match[1])
    .filter((href) => /kontakt|contact|impressum|imprint/i.test(href))
    .flatMap((href) => {
      try {
        const url = new URL(href, base);
        if (
          !["http:", "https:"].includes(url.protocol) ||
          url.hostname !== base.hostname ||
          assetExtension.test(url.pathname)
        ) {
          return [];
        }
        return [url.toString()];
      } catch {
        return [];
      }
    });
  return Array.from(new Set(links)).slice(0, 3);
}

async function crawlBusinessWebsite(website: string) {
  if (!website) return { emails: [], contactContext: "" };
  try {
    const initial = await fetchHtml(website);
    const emails = extractEmails(initial.html);
    const contactTexts = [extractReadableText(initial.html)];
    const contactLinks = extractContactLinks(initial.html, initial.finalUrl);
    for (const contactLink of contactLinks) {
      try {
        const contact = await fetchHtml(contactLink);
        emails.push(...extractEmails(contact.html));
        contactTexts.push(extractReadableText(contact.html));
      } catch (error) {
        console.warn("B2B contact page skipped", contactLink, error);
      }
    }
    return {
      emails: Array.from(new Set(emails)),
      contactContext: contactTexts.join("\n").slice(0, 12_000),
    };
  } catch (error) {
    console.warn("B2B website skipped", website, error);
    return { emails: [], contactContext: "" };
  }
}

function extractReadableText(html: string) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6_000);
}

function coordinatesFromUrl(value: string) {
  const atMatch = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const dataMatch = value.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const match = atMatch ?? dataMatch;
  return match
    ? { latitude: Number(match[1]), longitude: Number(match[2]) }
    : { latitude: null, longitude: null };
}

function distanceKm(
  first: { latitude: number; longitude: number },
  second: { latitude: number; longitude: number },
) {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(toRadians(first.latitude)) *
      Math.cos(toRadians(second.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodeCenter(center: string) {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=de&q=${encodeURIComponent(center)}`,
    {
      headers: {
        "user-agent":
          "Umzugshelden-B2B-Kontaktrecherche/1.0 (+https://www.umzugshelden.io/)",
      },
      signal: AbortSignal.timeout(10_000),
    },
  );
  if (!response.ok) throw new Error("Der Suchmittelpunkt konnte nicht ermittelt werden.");
  const entries = (await response.json()) as Array<{ lat?: string; lon?: string }>;
  const latitude = Number(entries[0]?.lat);
  const longitude = Number(entries[0]?.lon);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error(`Der Ort „${center}“ wurde nicht gefunden.`);
  }
  return { latitude, longitude };
}

async function dismissGoogleConsent(page: Page) {
  const buttons = await page.$$("button");
  for (const button of buttons) {
    const text = await button.evaluate((element) => element.textContent?.trim() ?? "");
    if (/alle akzeptieren|accept all|ablehnen|reject all/i.test(text)) {
      await button.click().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return;
    }
  }
}

async function collectPlaceLinks(page: Page, query: string, center: string) {
  await page.goto(
    `https://www.google.com/maps/search/${encodeURIComponent(`${query} im Umkreis von ${center}`)}?hl=de`,
    { waitUntil: "domcontentloaded", timeout: 45_000 },
  );
  await dismissGoogleConsent(page);
  await page.waitForSelector('a[href*="/maps/place/"]', { timeout: 15_000 }).catch(() => null);

  for (let index = 0; index < 8; index += 1) {
    await page.evaluate(() => {
      const feed = document.querySelector<HTMLElement>('[role="feed"]');
      if (feed) feed.scrollTop = feed.scrollHeight;
    });
    await new Promise((resolve) => setTimeout(resolve, 700));
  }

  return page.$$eval('a[href*="/maps/place/"]', (anchors) =>
    Array.from(
      new Set(
        anchors
          .map((anchor) => (anchor as HTMLAnchorElement).href)
          .filter(Boolean),
      ),
    ).slice(0, 35),
  );
}

async function readPlace(page: Page, googleMapsUrl: string) {
  await page.goto(googleMapsUrl, {
    waitUntil: "domcontentloaded",
    timeout: 35_000,
  });
  await page.waitForSelector("h1", { timeout: 10_000 }).catch(() => null);
  const details = await page.evaluate(() => {
    const text = (selector: string) =>
      document.querySelector<HTMLElement>(selector)?.innerText.trim() ?? "";
    const website =
      document.querySelector<HTMLAnchorElement>('a[data-item-id="authority"]')?.href ?? "";
    const phoneElement = document.querySelector<HTMLElement>(
      '[data-item-id^="phone:tel:"]',
    );
    return {
      companyName: text("h1"),
      address: text('[data-item-id="address"]'),
      phone: phoneElement?.innerText.trim() ?? "",
      website,
    };
  });
  const coordinates = coordinatesFromUrl(page.url());
  return { ...details, ...coordinates, googleMapsUrl };
}

async function enrichWithAi(
  businesses: DiscoveredBusiness[],
  category: B2bLeadCategory,
) {
  const candidates = businesses
    .map((business, index) => ({
      index,
      companyName: business.companyName,
      category,
      website: business.website,
      emailCandidates: business.emailCandidates,
      contactContext: business.contactContext,
    }))
    .filter((entry) => entry.emailCandidates.length);
  if (!candidates.length) return;

  try {
    const response = await generateGeminiJson({
      systemInstruction:
        "Du bewertest ausschließlich öffentlich gefundene geschäftliche Kontaktinformationen deutscher Unternehmen. Wähle die passendste Adresse für ein seriöses Kooperationsangebot eines Umzugsunternehmens. Erfinde niemals E-Mail-Adressen oder Personennamen. Bevorzuge allgemeine Vertriebs-, Kooperations- oder Geschäftsführungsadressen. Ermittle aus contactContext einen namentlich genannten geschäftlichen Ansprechpartner. Ist kein Name eindeutig öffentlich genannt, verwende exakt die zuständige Rolle „Geschäftsführung“.",
      prompt: `Bewerte diese Datensätze:\n${JSON.stringify(candidates)}\nAntworte als JSON: {"results":[{"index":number,"email":string,"contactName":string,"reason":string,"offerAngle":string}]}. email muss exakt aus emailCandidates stammen. contactName muss ein eindeutig im contactContext genannter Name oder exakt „Geschäftsführung“ sein. offerAngle ist ein kurzer konkreter Ansatz für eine mögliche Zusammenarbeit.`,
      temperature: 0.1,
      maxOutputTokens: 4000,
      thinkingBudget: 0,
    });
    const results =
      response &&
      typeof response === "object" &&
      Array.isArray((response as { results?: unknown }).results)
        ? (response as { results: unknown[] }).results
        : [];
    for (const result of results) {
      if (!result || typeof result !== "object") continue;
      const item = result as {
        index?: unknown;
        email?: unknown;
        reason?: unknown;
        offerAngle?: unknown;
        contactName?: unknown;
      };
      if (typeof item.index !== "number" || typeof item.email !== "string") continue;
      const business = businesses[item.index];
      const email = cleanEmail(item.email);
      if (!business?.emailCandidates.includes(email)) continue;
      business.email = email;
      business.contactName =
        typeof item.contactName === "string" && item.contactName.trim()
          ? item.contactName.trim().slice(0, 200)
          : "Geschäftsführung";
      business.aiEmailReason =
        typeof item.reason === "string" ? item.reason.trim().slice(0, 500) : "";
      business.aiOfferAngle =
        typeof item.offerAngle === "string"
          ? item.offerAngle.trim().slice(0, 500)
          : "";
      business.aiStatus = "selected";
    }
  } catch (error) {
    console.error("B2B AI email selection failed", error);
    for (const business of businesses) {
      if (business.emailCandidates.length) business.aiStatus = "failed";
    }
  }
}

export async function discoverBusinesses(input: {
  category: B2bLeadCategory;
  center: string;
  radiusKm: number;
}) {
  const centerCoordinates = await geocodeCenter(input.center);
  const browser = await launchPdfBrowser();
  try {
    const searchPage = await browser.newPage();
    await searchPage.setViewport({ width: 1440, height: 1000 });
    const linkGroups: string[][] = [];
    for (const query of categoryQueries[input.category]) {
      linkGroups.push(await collectPlaceLinks(searchPage, query, input.center));
    }
    const links = Array.from(new Set(linkGroups.flat())).slice(0, 60);
    const detailPage = await browser.newPage();
    await detailPage.setViewport({ width: 1440, height: 1000 });
    const businesses: DiscoveredBusiness[] = [];

    for (const link of links) {
      try {
        const place = await readPlace(detailPage, link);
        if (!place.companyName) continue;
        const distance =
          place.latitude !== null && place.longitude !== null
            ? distanceKm(centerCoordinates, {
                latitude: place.latitude,
                longitude: place.longitude,
              })
            : null;
        if (distance !== null && distance > input.radiusKm) continue;
        if (!place.website) continue;
        const websiteData = await crawlBusinessWebsite(place.website);
        businesses.push({
          ...place,
          contactName: "Geschäftsführung",
          distanceKm: distance,
          emailCandidates: websiteData.emails,
          contactContext: websiteData.contactContext,
          email: websiteData.emails[0] ?? "",
          aiEmailReason: "",
          aiOfferAngle: "",
          aiStatus: websiteData.emails.length ? "failed" : "no_email",
        });
      } catch (error) {
        console.warn("Google Maps place skipped", link, error);
      }
    }

    await enrichWithAi(businesses, input.category);
    return businesses;
  } finally {
    await browser.close();
  }
}
