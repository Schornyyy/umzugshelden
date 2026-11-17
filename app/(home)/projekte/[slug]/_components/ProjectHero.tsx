import { getDefaultCityServiceName } from "@/lib/cityServiceDefaults";
import type { Project } from "@/types/project/Project";
import { ArrowDown, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function ProjectHero({ project }: { project: Project }) {
  return (
    <section className='relative flex min-h-[560px] items-end overflow-hidden bg-navy text-white md:min-h-[640px]'>
      {project.thumbnailUrl && (
        <Image
          src={project.thumbnailUrl}
          alt={project.thumbnailAlt}
          fill
          priority
          sizes='100vw'
          className='object-cover'
        />
      )}
      <div className='absolute inset-0 bg-gradient-to-t from-navy via-navy/75 to-navy/20' />
      <div className='relative container mx-auto px-4 pb-12 pt-28 md:pb-16'>
        <nav aria-label='Breadcrumb' className='mb-6 font-body text-sm text-gray-300'>
          <ol className='flex flex-wrap items-center gap-2'>
            <li><Link href='/' className='hover:text-white'>Startseite</Link></li>
            <li aria-hidden='true'>/</li>
            <li><Link href='/projekte' className='hover:text-white'>Projekte</Link></li>
            <li aria-hidden='true'>/</li>
            <li aria-current='page' className='line-clamp-1 text-white'>{project.previewTitle}</li>
          </ol>
        </nav>
        <div className='flex flex-wrap items-center gap-3'>
          <span className='rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wide'>
            {getDefaultCityServiceName(project.serviceKey)}
          </span>
          {project.cityName && (
            <span className='inline-flex items-center gap-1.5 text-sm font-semibold text-gray-200'>
              <MapPin className='h-4 w-4 text-primary' /> {project.cityName}
            </span>
          )}
        </div>
        <h1 className='mt-5 max-w-4xl font-sans text-4xl font-bold leading-tight md:text-6xl'>
          {project.title}
        </h1>
        {project.previewText && (
          <p className='mt-5 max-w-2xl font-body text-lg leading-8 text-gray-200'>{project.previewText}</p>
        )}
        {project.facts.length > 0 && (
          <dl className='mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4'>
            {project.facts.map((fact) => (
              <div
                key={`${fact.label}-${fact.value}`}
                className='rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm'>
                <dt className='text-xs font-semibold uppercase tracking-wide text-gray-300'>{fact.label}</dt>
                <dd className='mt-1 font-sans text-base font-bold text-white'>{fact.value}</dd>
              </div>
            ))}
          </dl>
        )}
        <a
          href='#projekt-details'
          className='mt-10 inline-flex items-center gap-2 font-sans text-sm font-semibold text-gray-200 hover:text-white'>
          Projekt ansehen <ArrowDown className='h-4 w-4 animate-bounce' />
        </a>
      </div>
    </section>
  );
}
