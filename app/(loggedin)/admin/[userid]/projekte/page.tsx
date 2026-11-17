"use client";

import { deleteProject, listProjects, updateProject } from "@/actions/projectActions";
import { getAdminIdToken } from "@/lib/adminIdToken";
import { useCompanyData } from "@/provider/CompanyDataProvider";
import type { Project } from "@/types/project/Project";
import { ExternalLink, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import ProjectAdminList from "./_components/ProjectAdminList";
import ProjectCreateForm from "./_components/ProjectCreateForm";

export default function ProjectsAdminPage() {
  const { companyData } = useCompanyData();
  const ownerId = companyData?.id;
  const { userid } = useParams<{ userid: string }>();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    const result = await listProjects({ token: await getAdminIdToken(), ownerId });
    if (result.success) setProjects(result.data);
    else setError(result.error);
    setLoading(false);
  }, [ownerId]);

  useEffect(() => {
    void load().catch((caught) => setError(String(caught)));
  }, [load]);

  async function run(project: Project, action: (token: string, id: string) => Promise<{ success: boolean; error?: string }>) {
    if (!ownerId) return;
    setBusyId(project.id);
    setError("");
    const result = await action(await getAdminIdToken(), ownerId);
    if (!result.success) setError(result.error ?? "Aktion fehlgeschlagen.");
    await load();
    setBusyId(null);
  }

  return (
    <main className='mx-auto w-full max-w-6xl space-y-8 pb-12'>
      <header className='flex flex-wrap items-end justify-between gap-4'>
        <div>
          <p className='text-xs font-semibold uppercase tracking-wider text-blue-700'>Referenzen</p>
          <h1 className='mt-2 text-3xl font-bold text-slate-950'>Projekte</h1>
          <p className='mt-3 max-w-3xl text-sm leading-6 text-slate-600'>
            Veröffentlichte Projekte erscheinen unter /projekte. Neue Projekte starten
            als Entwurf.
          </p>
        </div>
        <Link
          href='/projekte'
          target='_blank'
          className='inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50'>
          /projekte öffnen <ExternalLink size={14} />
        </Link>
      </header>

      {ownerId && (
        <ProjectCreateForm
          ownerId={ownerId}
          onCreated={(projectId) => router.push(`/admin/${encodeURIComponent(userid)}/projekte/${encodeURIComponent(projectId)}`)}
        />
      )}

      {error && <p role='alert' className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700'>{error}</p>}

      <section className='space-y-4'>
        <h2 className='text-xl font-semibold text-slate-950'>Alle Projekte</h2>
        {loading && !projects.length ? (
          <p className='flex items-center gap-2 text-slate-600'><LoaderCircle className='animate-spin' size={18} /> Projekte werden geladen …</p>
        ) : (
          <ProjectAdminList
            projects={projects}
            userId={userid}
            busyId={busyId}
            onTogglePublished={(project) =>
              void run(project, (token, id) =>
                updateProject({ token, ownerId: id, projectId: project.id, patch: { published: !project.published } }),
              )
            }
            onDelete={(project) => {
              if (window.confirm(`Projekt „${project.previewTitle || project.title}“ endgültig löschen?`)) {
                void run(project, (token, id) => deleteProject({ token, ownerId: id, projectId: project.id }));
              }
            }}
          />
        )}
      </section>
    </main>
  );
}
