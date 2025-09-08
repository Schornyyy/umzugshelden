import type { Metadata } from "next";
import Link from "next/link";
import { getContractById } from "@/actions/contractActions";

type Params = { contractId: string };

export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { contractId } = await params;
  return {
    title: `Auftrag ansehen | ${contractId}`,
    description:
      "Lead-Details ansehen und kostenlos registrieren. Danach direkt alle Aufträge in Ihrer Nähe einsehen.",
  };
}

export default async function AutoCompanyLeadPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const { contractId } = await params;
  const contract = await getContractById(contractId);
  const sp = await searchParams;
  const email =
    typeof sp?.companyEmail === "string" ? sp.companyEmail : undefined;
  const registerHref = `/register/company?firstContract=${encodeURIComponent(
    contractId
  )}${email ? `&prefillEmail=${encodeURIComponent(email)}` : ""}`;
  const loginHref = `/login?next=${encodeURIComponent(`/company/contracts`)}${
    email ? `&prefillEmail=${encodeURIComponent(email)}` : ""
  }`;

  const cType = contract?.type || "Gartengestaltung";
  const cZip = (contract?.zip as unknown as string) || "10115";
  const cSize = contract?.gardenSize ? `${contract.gardenSize} m²` : undefined;
  const cScope = (contract?.contractSize as string) || "Neuanlage";
  const cPlan = contract ? (contract.planningAvaillable ? "Ja" : "Nein") : "Ja";
  const cRepeat = contract ? (contract.repeatService ? "Ja" : "Nein") : "Nein";
  const cBegin = (contract?.projektBeginn as string) || "Schnellstmöglich";
  const rows: Array<{
    label: string;
    value: string | number | boolean | undefined;
  }> = [
    { label: "Service", value: cType },
    { label: "PLZ", value: cZip },
    { label: "Gartengröße", value: cSize },
    { label: "Projektumfang", value: cScope },
    { label: "Planung vorhanden", value: cPlan },
    { label: "Wiederkehrender Service", value: cRepeat },
    { label: "Projektbeginn", value: cBegin },
  ];

  return (
    <div className='bg-white'>
      <section className='bg-gradient-to-b from-green-50 to-white border-b'>
        <div className='max-w-4xl mx-auto px-4 py-10 md:py-14'>
          <h1 className='text-2xl md:text-3xl font-bold mb-2'>
            Neuer Auftrag – Details
          </h1>
          <p className='text-gray-700 mb-6'>
            Dieser Lead passt zu Ihren Dienstleistungen. Registrieren Sie sich
            kostenlos und sehen Sie danach alle Aufträge in Ihrer Nähe.
          </p>

          <div className='grid md:grid-cols-2 gap-6 items-start'>
            <div className='space-y-4'>
              <div className='rounded-lg border bg-white shadow-sm p-5'>
                <h2 className='font-semibold text-green-700 mb-3'>
                  Auftragsdaten
                </h2>
                <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm'>
                  {rows
                    .filter((r) => r.value !== undefined && r.value !== "")
                    .map((r) => (
                      <div key={r.label} className='border-b pb-2'>
                        <dt className='text-gray-500'>{r.label}</dt>
                        <dd className='text-gray-900'>{String(r.value)}</dd>
                      </div>
                    ))}
                </dl>
              </div>
              {(contract?.description || !contract) && (
                <div className='rounded-lg border bg-white shadow-sm p-5'>
                  <h3 className='font-semibold text-green-700 mb-2'>
                    Beschreibung
                  </h3>
                  <p className='text-sm text-gray-800 whitespace-pre-wrap'>
                    {contract?.description ||
                      "Beispielauftrag zur Prüfung des E-Mail-Trackings und der Lead-Benachrichtigung. Bitte ignorieren."}
                  </p>
                </div>
              )}
            </div>

            <div className='space-y-4'>
              <div className='rounded-lg border bg-white shadow-sm p-5'>
                <h2 className='font-semibold mb-2'>Jetzt starten</h2>
                <p className='text-sm text-gray-700 mb-4'>
                  Kostenlose Registrierung. Ihr Profil ist zunächst nicht
                  öffentlich. Danach sehen Sie sofort alle Aufträge in Ihrem
                  Umkreis.
                </p>
                <div className='flex flex-col gap-3'>
                  <Link
                    href={registerHref}
                    className='inline-block text-center bg-green-600 text-white font-semibold px-6 py-3 rounded-md shadow hover:bg-green-700 transition'>
                    Kostenlos registrieren
                  </Link>
                  <Link
                    href={loginHref}
                    className='inline-block text-center text-green-700 font-semibold px-6 py-3 rounded-md border border-green-600 hover:bg-green-50 transition'>
                    Ich habe bereits ein Konto
                  </Link>
                  <p className='text-[11px] text-gray-500 text-center'>
                    DSGVO-konform · Keine laufenden Kosten · Zugriff auf
                    passende Aufträge
                  </p>
                </div>
              </div>

              <div className='rounded-lg border bg-white shadow-sm p-5'>
                <h3 className='font-semibold mb-2'>Vorteile</h3>
                <ul className='text-sm text-gray-700 space-y-2'>
                  <li>✅ Auftragsdetails vorab einsehen</li>
                  <li>✅ Zugang zu weiteren Aufträgen in Ihrer Nähe</li>
                  <li>
                    ✅ Unverbindliche Registrierung, Profil zunächst nicht
                    öffentlich
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
