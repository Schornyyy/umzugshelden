import CrmDashboard from "../../CrmDashboard";

export default async function CustomerPage({
  params,
}: {
  params: Promise<{ customerId: string }>;
}) {
  const { customerId } = await params;
  return <CrmDashboard view='customer' customerId={customerId} />;
}