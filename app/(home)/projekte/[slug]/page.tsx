import CityServiceBlocksRenderer from "@/components/city/CityServiceBlocksRenderer";
import ProjectCard from "@/components/projects/ProjectCard";
import { buildCityServiceRenderContext } from "@/lib/cityServiceRenderContext";
import { generationSiteUrl } from "@/lib/generationPagePolicy";
import { projectPath, toProjectCard } from "@/lib/projects";
import { getPublishedProject, listPublishedProjects } from "@/lib/projectPublicData";
import { slugify } from "@/utils/slugify";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProjectHero from "./_components/ProjectHero";

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

async function loadProject({ params }: Props) {
  const { slug } = await params;
  return getPublishedProject(decodeURIComponent(slug));
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const project = await loadProject(props);
  if (!project) return {};
  const title = project.metaTitle || project.title;
  const description = project.metaDescription || project.previewText;
  return {
    title,
    description,
    alternates: { canonical: `${generationSiteUrl()}${projectPath(project.slug)}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: project.thumbnailUrl ? [{ url: project.thumbnailUrl, alt: project.thumbnailAlt }] : undefined,
    },
  };
}

export default async function ProjectDetailPage(props: Props) {
  const project = await loadProject(props);
  if (!project) notFound();

  const cityName = project.cityName || "Olpe";
  const { localSeo, context } = buildCityServiceRenderContext({
    cityName,
    serviceKey: project.serviceKey,
  });
  const related = (await listPublishedProjects())
    .filter((entry) => entry.id !== project.id)
    .sort((left, right) => Number(right.serviceKey === project.serviceKey) - Number(left.serviceKey === project.serviceKey))
    .slice(0, 3);

  return (
    <main>
      <ProjectHero project={project} />

      <div id='projekt-details' className='scroll-mt-20'>
        <CityServiceBlocksRenderer
          blocks={project.blocks}
          cityName={cityName}
          citySlug={slugify(cityName)}
          serviceKey={project.serviceKey}
          context={context}
          localSeo={localSeo}
        />
      </div>

      {related.length > 0 && (
        <section className='bg-gray-50 py-16'>
          <div className='container mx-auto px-4'>
            <div className='mb-8 flex flex-wrap items-end justify-between gap-4'>
              <h2 className='font-sans text-3xl font-bold text-navy'>Weitere Projekte</h2>
              <Link href='/projekte' className='font-sans font-semibold text-primary hover:underline'>
                Alle Projekte ansehen →
              </Link>
            </div>
            <div className='grid gap-8 sm:grid-cols-2 xl:grid-cols-3'>
              {related.map((entry) => (
                <ProjectCard key={entry.id} project={toProjectCard(entry)} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
