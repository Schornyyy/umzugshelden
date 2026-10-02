export type CityServiceTemplateContext = {
  city: string;
  service: string;
  primaryKeyword: string;
  region: string;
  localIntro: string;
  nearbyCities: string;
};

export function resolveCityServiceText(
  text: string,
  context: CityServiceTemplateContext,
) {
  const replacements: Record<string, string> = {
    "{city}": context.city,
    "{cityName}": context.city,
    "{service}": context.service,
    "{primaryKeyword}": context.primaryKeyword,
    "{region}": context.region,
    "{localIntro}": context.localIntro,
    "{nearbyCities}": context.nearbyCities,
  };

  return Object.entries(replacements).reduce(
    (result, [placeholder, value]) => result.replaceAll(placeholder, value),
    text,
  );
}