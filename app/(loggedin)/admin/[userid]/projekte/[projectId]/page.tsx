"use client";

import { useCompanyData } from "@/provider/CompanyDataProvider";
import { useParams } from "next/navigation";
import ProjectEditor from "./_components/ProjectEditor";

export default function ProjectEditorPage() {
  const { companyData } = useCompanyData();
  const { userid, projectId } = useParams<{ userid: string; projectId: string }>();
  if (!companyData?.id) return null;
  return <ProjectEditor ownerId={companyData.id} userId={userid} projectId={decodeURIComponent(projectId)} />;
}
