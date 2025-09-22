import { AdminPartnerEditor } from "@/components/AdminPartnerEditor";

export const metadata = { title: "Partner bearbeiten" };

export default async function AdminPartnerPage({
  params,
}: {
  params: Promise<{ userid: string; partnerId: string }>;
}) {
  const { partnerId } = await params;
  return (
    <div className='max-w-5xl mx-auto p-6'>
      <h1 className='text-2xl font-bold mb-6'>Admin · Partner Editor</h1>
      <AdminPartnerEditor partnerId={partnerId} />
    </div>
  );
}
