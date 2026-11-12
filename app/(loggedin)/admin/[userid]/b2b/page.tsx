import { redirect } from "next/navigation";

export default async function B2bPage({
  params,
}: {
  params: Promise<{ userid: string }>;
}) {
  const { userid } = await params;
  redirect(`/admin/${userid}/b2b/dashboard`);
}
