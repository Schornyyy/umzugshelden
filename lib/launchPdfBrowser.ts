import chromium from "@sparticuz/chromium";
import puppeteer, { type Browser } from "puppeteer-core";

export type PdfBrowser = Browser;

export async function launchPdfBrowser(): Promise<Browser> {
  const configuredExecutable = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();

  if (configuredExecutable) {
    return puppeteer.launch({
      executablePath: configuredExecutable,
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }

  if (process.platform === "linux") {
    return puppeteer.launch({
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: true,
    });
  }

  return puppeteer.launch({
    channel: "chrome",
    headless: true,
  });
}