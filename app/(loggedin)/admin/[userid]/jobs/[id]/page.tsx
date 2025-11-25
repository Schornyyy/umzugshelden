import { getJobById } from "@/actions/jobActions";
import JobEditClient from "./JobEditClient";

export default async function Page({
  params,
}: {
  params: Promise<{ userid: string; id: string }>;
}) {
  const { userid, id } = await params;
  const job = await getJobById(id, userid);
  return <JobEditClient initialJob={job} userid={userid} />;
}
