"use client";

import { getProject, regenerateProject, updateProject } from "@/actions/projectActions";
import CityServiceBlockEditor from "@/components/admin/city/CityServiceBlockEditor";
import { getAdminIdToken } from "@/lib/adminIdToken";
import { projectPath } from "@/lib/projects";
import type { Project } from "@/types/project/Project";
import { slugify } from "@/utils/slugify";
import { ArrowLeft, ExternalLink, Eye, EyeOff, LoaderCircle, Save, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ProjectDetailsForm from "./ProjectDetailsForm";

type Tab = "builder" | "details" | "ai";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "builder", label: "Pagebuilder" },
  { key: "details", label: "Vorschau & SEO" },
  { key: "ai", label: "KI-Beschreibung" },
];

export default function ProjectEditor({
  ownerId,
  userId,
  projectId,
}: {
  ownerId: string;
  userId: string;
  projectId: string;
}) {
  const [project, setProject] = useState<Project | null>(null);
  const [tab, setTab] = useState<Tab>("builder");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "publish" | "ai" | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const result = await getProject({ token: await getAdminIdToken(), ownerId, projectId });
      if (cancelled) return;
      if (result.success) setProject(result.data);
      else setError(result.error);
    })().catch((caught) => setError(String(caught)));
    return () => {
      cancelled = true;
    };
  }, [ownerId, projectId]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (!project) {
    return error ? (
      <p role='alert' className='rounded-lg bg-red-50 p-4 text-sm text-red-700'>{error}</p>
    ) : (
      <p className='flex items-center gap-2 text-slate-600'><LoaderCircle className='animate-spin' size={18} /> Projekt wird geladen …</p>
    );
  }

  const change = (patch: Partial<Project>) => {
    setProject((current) => (current ? { ...current, ...patch } : current));
    setDirty(true);
    setMessage("");
  };

  async function save(extra: Partial<Project> = {}, kind: "save" | "publish" = "save") {
    if (!project) return;
    setBusy(kind);
    setError("");
    const result = await updateProject({
      token: await getAdminIdToken(),
      ownerId,
      projectId,
      patch: {
        slug: slugify(project.slug) || project.slug,
        title: project.title,
        previewTitle: project.previewTitle,
        previewText: project.previewText,
        metaTitle: project.metaTitle,
        metaDescription: project.metaDescription,
        thumbnailUrl: project.thumbnailUrl,
        thumbnailAlt: project.thumbnailAlt,
        images: project.images,
        serviceKey: project.serviceKey,
        cityName: project.cityName,
        facts: project.facts.filter((fact) => fact.label.trim() && fact.value.trim()),
        briefing: project.briefing,
        blocks: project.blocks,
        ...extra,
      },
    });
    if (result.success) {
      setProject(result.data);
      setDirty(false);
      setMessage(kind === "publish" ? (result.data.published ? "Veröffentlicht." : "Offline genommen.") : "Gespeichert.");
    } else {
      setError(result.error);
    }
    setBusy(null);
  }

  async function regenerate() {
    if (!project) return;
    if (!window.confirm("Texte, Abschnitte und Meta-Daten werden aus der Beschreibung komplett neu erstellt. Manuelle Änderungen im Pagebuilder gehen dabei verloren. Fortfahren?")) {
      return;
    }
    setBusy("ai");
    setError("");
    const result = await regenerateProject({ token: await getAdminIdToken(), ownerId, projectId, briefing: project.briefing });
    if (result.success) {
      setProject(result.data);
      setDirty(false);
      setTab("builder");
      setMessage("Projekt wurde neu generiert.");
    } else {
      setError(result.error);
    }
    setBusy(null);
  }

  return (
    <main className='w-full space-y-5 pb-12'>
      <header className='flex flex-wrap items-center justify-between gap-4'>
        <div className='min-w-0'>
          <Link href={`/admin/${encodeURIComponent(userId)}/projekte`} className='inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800'>
            <ArrowLeft size={14} /> Alle Projekte
          </Link>
          <h1 className='mt-1 truncate text-2xl font-bold text-slate-950'>{project.previewTitle || project.title}</h1>
          <p className='text-xs text-slate-500'>
            {project.published ? "Veröffentlicht" : "Entwurf"} · {projectPath(project.slug)}
            {dirty && " · ungespeicherte Änderungen"}
          </p>
        </div>
        <div className='flex flex-wrap gap-2'>
          {project.published && (
            <Link href={projectPath(project.slug)} target='_blank' className='inline-flex h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-medium text-slate-700'>
              Ansehen <ExternalLink size={14} />
            </Link>
          )}
          <button
            type='button'
            disabled={busy !== null}
            onClick={() => void save({ published: !project.published }, "publish")}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold disabled:opacity-50 ${
              project.published ? "border border-slate-300 text-slate-700" : "bg-emerald-600 text-white"
            }`}>
            {project.published ? <EyeOff size={14} /> : <Eye size={14} />}
            {project.published ? "Offline nehmen" : "Speichern & veröffentlichen"}
          </button>
          <button
            type='button'
            disabled={busy !== null || !dirty}
            onClick={() => void save()}
            className='inline-flex h-9 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-50'>
            {busy === "save" ? <LoaderCircle className='animate-spin' size={14} /> : <Save size={14} />}
            Speichern
          </button>
        </div>
      </header>

      {error && <p role='alert' className='rounded-lg bg-red-50 p-3 text-sm text-red-700'>{error}</p>}
      {message && <p role='status' className='rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700'>{message}</p>}

      <nav className='flex gap-1 border-b border-slate-200'>
        {TABS.map((entry) => (
          <button
            key={entry.key}
            type='button'
            onClick={() => setTab(entry.key)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold ${
              tab === entry.key ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}>
            {entry.label}
          </button>
        ))}
      </nav>

      {tab === "builder" && (
        <CityServiceBlockEditor
          blocks={project.blocks}
          onChange={(blocks) => change({ blocks })}
          cityName={project.cityName || "Olpe"}
          citySlug={slugify(project.cityName || "Olpe")}
          serviceKey={project.serviceKey}
          primaryKeyword={project.title}
        />
      )}

      {tab === "details" && <ProjectDetailsForm project={project} onChange={change} />}

      {tab === "ai" && (
        <section className='max-w-3xl space-y-4 rounded-xl border border-slate-200 bg-white p-6'>
          <div>
            <h2 className='font-semibold text-slate-950'>Projektbeschreibung</h2>
            <p className='mt-1 text-sm text-slate-600'>
              Aus dieser Beschreibung erstellt die KI Titel, Vorschau, Eckdaten, alle
              Abschnitte und die Meta-Daten. Thumbnail und Projektbilder bleiben erhalten.
            </p>
          </div>
          <textarea
            rows={12}
            value={project.briefing}
            onChange={(event) => change({ briefing: event.target.value })}
            className='w-full rounded-md border border-slate-300 px-3 py-2 text-sm'
          />
          <button
            type='button'
            disabled={busy !== null || project.briefing.trim().length < 30}
            onClick={() => void regenerate()}
            className='inline-flex items-center gap-2 rounded-md bg-violet-700 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50'>
            {busy === "ai" ? <LoaderCircle className='h-4 w-4 animate-spin' /> : <Sparkles className='h-4 w-4' />}
            {busy === "ai" ? "KI schreibt das Projekt …" : "Alles neu generieren"}
          </button>
        </section>
      )}
    </main>
  );
}
