import Headings from "@/components/Headings";
import { Reference } from "@/types/ReferencType";
import { getReferenceById } from "@/actions/referenceActions";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const ref = await getReferenceById(id);
  if (!ref) return { title: "Referenz" };
  const title = ref.comanyName || "Referenz";
  const description = ref.description || undefined;
  const images = ref.thumbnailUrl
    ? [{ url: ref.thumbnailUrl, alt: ref.comanyName }]
    : undefined;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
    },
  };
}

export default async function ReferencePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ref: (Reference & { id: string }) | null = await getReferenceById(id);

  if (!ref) {
    return (
      <div className='container mx-auto py-12'>
        <div className='flex flex-col gap-5 p-6 rounded shadow-md bg-white'>
          <h2 className='text-2xl font-bold'>Referenz nicht gefunden</h2>
          <p className='mt-2 text-sm text-slate-600'>
            Die angeforderte Referenz existiert nicht oder wurde gelöscht.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-col gap-24 md:gap-40 py-16 md:py-12 mx-auto container px-4 sm:px-6 lg:px-8'>
      {/* Hero Bereich */}
      <div className='flex flex-col gap-8 p-6 rounded-xl shadow-md bg-white relative'>
        <Headings level={1}>{ref.comanyName}</Headings>
        {ref.description && (
          <p className='text-sm text-slate-700'>{ref.description}</p>
        )}
        <div className='flex flex-col md:flex-row gap-4 md:gap-6'>
          <div className='flex flex-col gap-1'>
            <Headings level={4}>Branche</Headings>
            <p className='text-slate-800 uppercase text-sm'>
              {ref.companyBranch}
            </p>
          </div>
          <div className='flex flex-col gap-1'>
            <Headings level={4}>Kunde</Headings>
            <p className='text-slate-800 uppercase text-sm'>{ref.comanyName}</p>
          </div>
          <div className='mt-2 md:mt-0 md:ml-auto'>
            <Link target='_blank' href={ref.website} className='relative block'>
              <Button className='flex flex-row gap-2 w-full md:w-auto'>
                Webseite besuchen
                <ArrowRight width={16} height={16} color='white' />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {ref &&
        ref.sections?.map((section, index) => {
          if (section.title === undefined || section.title == "") return null;
          const even = index % 2 === 0;

          return (
            <div
              key={index}
              className={`flex flex-col md:flex-row gap-6 md:gap-24 items-start ${
                even ? "md:flex-row" : "md:flex-row-reverse"
              }`}>
              <Image
                src={section.imagePath}
                alt={section.title}
                width={500}
                height={500}
                className='rounded-md object-cover w-full md:w-1/2 max-h-[500px] h-auto'
              />
              <div className='flex flex-col gap-6 w-full md:w-1/2'>
                <Headings level={2}>{section.title}</Headings>
                <p className='text-slate-700'>{section.text}</p>
                {section.link && (
                  <Link href={section.link}>
                    <Button className='w-full md:w-auto'>Mehr erfahren</Button>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
