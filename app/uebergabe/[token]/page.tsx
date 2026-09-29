import type { Metadata } from "next";
import HandoverCustomerForm from "./HandoverCustomerForm";

export const metadata: Metadata = {
  title: "Übergabeprotokoll | Umzugshelden",
  robots: { index: false, follow: false },
};

type PageProps = { params: Promise<{ token: string }> };

export default async function HandoverPage({ params }: PageProps) {
  const { token } = await params;
  return <HandoverCustomerForm token={token} />;
}