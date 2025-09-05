import { redirect } from "next/navigation";
import { slugify } from "@/utils/slugify";
import { getGalbauServices } from "@/statics/Lists";

export const revalidate = 60;

export default async function LegacyCityAngebotRedirect({
  params,
}: {
  params: { city: string };
}) {
  // Redirect legacy /stadt/[city]/angebot -> /stadt/[city]/[service]/angebot (first service as default)
  const defaultService = slugify(getGalbauServices()[0]);
  redirect(
    `/stadt/${encodeURIComponent(params.city)}/${defaultService}/angebot`
  );
}
