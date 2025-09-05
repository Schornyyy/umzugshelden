import { redirect } from "next/navigation";
import { slugify } from "@/utils/slugify";
import { getGalbauServices } from "@/statics/Lists";

export const revalidate = 60;

export default function LegacyCityPreiseRedirect({
  params,
}: {
  params: { city: string };
}) {
  const defaultService = slugify(getGalbauServices()[0]);
  redirect(
    `/stadt/${encodeURIComponent(params.city)}/${defaultService}/preise`
  );
}
