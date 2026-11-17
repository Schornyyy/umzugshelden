import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import { projectPath } from "@/lib/projects";
import type { ProjectCardData } from "@/types/project/Project";
import { ArrowUpRight, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

/** Projektkarte für die Übersicht /projekte und „Weitere Projekte“. */
export default function ProjectCard({
  project,
  priority = false,
}: {
  project: ProjectCardData;
  priority?: boolean;
}) {
  const facts = project.facts.slice(0, 3);
  return (
    <Link
      href={projectPath(project.slug)}
      className='group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'>
      <div className='relative aspect-[4/3] overflow-hidden bg-slate-100'>
        {project.thumbnailUrl && (
          <Image
            src={project.thumbnailUrl}
            alt={project.thumbnailAlt}
            fill
            priority={priority}
            sizes='(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw'
            className='object-cover transition duration-500 group-hover:scale-105'
          />
        )}
        <div className='absolute inset-0 bg-gradient-to-t from-navy/80 via-navy/10 to-transparent' />
        <span className='absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-bold uppercase tracking-wide text-navy shadow-sm'>
          {getDefaultCityServiceName(project.serviceKey)}
        </span>
        {project.cityName && (
          <span className='absolute bottom-4 left-4 inline-flex items-center gap-1.5 text-sm font-semibold text-white'>
            <MapPin className='h-4 w-4 text-primary' /> {project.cityName}
          </span>
        )}
        <span className='absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white opacity-0 transition duration-300 group-hover:opacity-100'>
          <ArrowUpRight className='h-5 w-5' />
        </span>
      </div>
      <div className='flex flex-1 flex-col gap-3 p-6'>
        <h2 className='font-sans text-xl font-bold leading-snug text-navy transition group-hover:text-primary'>
          {project.previewTitle}
        </h2>
        {project.previewText && (
          <p className='line-clamp-3 font-body text-sm leading-6 text-slate-600'>{project.previewText}</p>
        )}
        {facts.length > 0 && (
          <dl className='mt-auto flex flex-wrap gap-2 pt-2'>
            {facts.map((fact) => (
              <div
                key={`${fact.label}-${fact.value}`}
                className='rounded-lg bg-slate-50 px-3 py-1.5 text-xs'>
                <dt className='inline font-semibold text-slate-500'>{fact.label}: </dt>
                <dd className='inline font-medium text-slate-800'>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </Link>
  );
}
