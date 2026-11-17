"use client";

import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { projectPath } from "@/lib/projects";
import type { Project } from "@/types/project/Project";
import { ExternalLink, Eye, EyeOff, FolderOpen, Pencil, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const buttonClass =
  "inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition disabled:opacity-50";

export default function ProjectAdminList({
  projects,
  userId,
  busyId,
  onTogglePublished,
  onDelete,
}: {
  projects: Project[];
  userId: string;
  busyId: string | null;
  onTogglePublished: (project: Project) => void;
  onDelete: (project: Project) => void;
}) {
  if (!projects.length) {
    return (
      <div className='rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center'>
        <FolderOpen className='mx-auto text-slate-400' size={30} />
        <p className='mt-3 font-medium text-slate-800'>Noch keine Projekte angelegt</p>
      </div>
    );
  }

  return (
    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
      {projects.map((project) => (
        <article key={project.id} className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
          <div className='relative aspect-[16/9] bg-slate-100'>
            {project.thumbnailUrl && (
              <Image src={project.thumbnailUrl} alt='' fill className='object-cover' sizes='(max-width: 768px) 100vw, 33vw' />
            )}
            <span
              className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                project.published ? "bg-emerald-600 text-white" : "bg-white/95 text-slate-700"
              }`}>
              {project.published ? "Veröffentlicht" : "Entwurf"}
            </span>
          </div>
          <div className='space-y-3 p-4'>
            <div>
              <h3 className='font-semibold text-slate-950'>{project.previewTitle || project.title}</h3>
              <p className='mt-1 text-xs text-slate-500'>
                {getDefaultCityServiceName(project.serviceKey)}
                {project.cityName ? ` · ${project.cityName}` : ""} · {projectPath(project.slug)}
              </p>
            </div>
            <div className='flex flex-wrap gap-2'>
              <Link
                href={`/admin/${encodeURIComponent(userId)}/projekte/${encodeURIComponent(project.id)}`}
                className={`${buttonClass} border-slate-300 text-slate-700 hover:bg-slate-50`}>
                <Pencil size={14} /> Bearbeiten
              </Link>
              <button
                type='button'
                disabled={busyId === project.id}
                onClick={() => onTogglePublished(project)}
                className={`${buttonClass} ${
                  project.published
                    ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                    : "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700"
                }`}>
                {project.published ? <EyeOff size={14} /> : <Eye size={14} />}
                {project.published ? "Offline" : "Veröffentlichen"}
              </button>
              {project.published && (
                <Link
                  href={projectPath(project.slug)}
                  target='_blank'
                  className={`${buttonClass} border-slate-300 text-slate-700 hover:bg-slate-50`}
                  aria-label='Projekt ansehen'>
                  <ExternalLink size={14} />
                </Link>
              )}
              <button
                type='button'
                disabled={busyId === project.id}
                onClick={() => onDelete(project)}
                className={`${buttonClass} border-red-200 text-red-700 hover:bg-red-50`}
                aria-label='Projekt löschen'>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
