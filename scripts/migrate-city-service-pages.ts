import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  const ownerId = process.env.NEXT_PUBLIC_OWNERID?.trim();
  if (!ownerId) {
    throw new Error("NEXT_PUBLIC_OWNERID ist nicht konfiguriert.");
  }

  const { migrateCityServicePages } = await import(
    "../actions/cityServicePageActions"
  );
  const result = await migrateCityServicePages(ownerId);

  console.log(
    `Migration abgeschlossen: ${result.templatesCreated + result.landingTemplatesCreated} Vorlagen, ${result.landingPagesCreated} Stadtseiten und ${result.pagesCreated} Stadt-Service-Seiten angelegt.`,
  );
  console.log(
    `Übersprungen: ${result.templatesSkipped + result.landingTemplatesSkipped} Vorlagen, ${result.landingPagesSkipped} Stadtseiten und ${result.pagesSkipped} Stadt-Service-Seiten.`,
  );
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});