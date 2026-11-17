import ProjectCard from "@/components/projects/ProjectCard";
import { generationSiteUrl } from "@/lib/generationPagePolicy";
import { toProjectCard } from "@/lib/projects";
import { listPublishedProjects } from "@/lib/projectPublicData";
import { FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Unsere Projekte | Umzugshelden",
  description:
    "Einblicke in ausgewählte Projekte der Umzugshelden: Umzüge, Entrümpelungen, Möbelmontagen und Anstricharbeiten aus der Region.",
  alternates: { canonical: `${generationSiteUrl()}/projekte` },
};

export default async function ProjectsPage() {
  const projects = await listPublishedProjects();

  return (
    <main>
      <section className='relative overflow-hidden bg-navy text-white'>
        <div className='absolute -right-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl' />
        <div className='relative container mx-auto px-4 py-16 md:py-24'>
          <nav aria-label='Breadcrumb' className='mb-6 font-body text-sm text-gray-300'>
            <Link href='/' className='hover:text-white'>Startseite</Link>
            <span className='mx-2' aria-hidden='true'>/</span>
            <span className='text-white'>Projekte</span>
          </nav>
          <p className='font-sans text-sm font-bold uppercase tracking-[0.18em] text-primary'>
            Referenzen
          </p>
          <h1 className='mt-3 max-w-3xl font-sans text-4xl font-bold leading-tight md:text-5xl'>
            Unsere Projekte
          </h1>
          <p className='mt-5 max-w-2xl font-body text-lg leading-8 text-gray-300'>
            Echte Aufträge, sorgfältig umgesetzt: Hier zeigen wir, wie wir Umzüge,
            Entrümpelungen und weitere Leistungen für unsere Kunden geplant und
            durchgeführt haben.
          </p>
        </div>
      </section>

      <section className='bg-gray-50 py-14 md:py-20'>
        <div className='container mx-auto px-4'>
          {projects.length ? (
            <div className='grid gap-8 sm:grid-cols-2 xl:grid-cols-3'>
              {projects.map((project, index) => (
                <ProjectCard key={project.id} project={toProjectCard(project)} priority={index < 3} />
              ))}
            </div>
          ) : (
            <div className='mx-auto max-w-lg rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center'>
              <FolderOpen className='mx-auto h-10 w-10 text-slate-400' />
              <p className='mt-4 font-semibold text-navy'>Bald finden Sie hier unsere Projekte.</p>
              <Link href='/kontakt' className='mt-4 inline-flex font-semibold text-primary hover:underline'>
                Jetzt Ihr Projekt anfragen
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
