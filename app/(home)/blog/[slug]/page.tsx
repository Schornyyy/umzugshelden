import { getPostBySlug } from "@/actions/blogActions";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import parse, {
  domToReact,
  HTMLReactParserOptions,
  Element,
  DOMNode,
} from "html-react-parser";
import Headings from "@/components/Headings";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Artikel nicht gefunden | Landschaftshelden Blog",
      description: "Dieser Artikel konnte nicht gefunden werden.",
    };
  }

  const keywordsString = post.acf ? post.acf?.keywords : "";
  const keywords = keywordsString
    ? keywordsString.split(",").map((keyword) => keyword.trim())
    : [];

  return {
    title: `${post.title.rendered} | Landschaftshelden Blog`,
    description:
      post.acf?.meta_description ||
      "Expertenwissen rund um Garten- und Landschaftsbau von Landschaftshelden.",
    keywords: [
      ...keywords,
      "Gartenbau",
      "Landschaftsbau",
      "Gartengestaltung",
      "Landschaftshelden",
      "Galabau",
    ],
    authors: [{ name: "Landschaftshelden" }],
    openGraph: {
      title: post.title.rendered,
      description:
        post.acf?.meta_description ||
        "Expertenwissen rund um Garten- und Landschaftsbau",
      url: `https://landschaftshelden.io/blog/${post.slug}`,
      siteName: "Landschaftshelden.io",
      type: "article",
      locale: "de_DE",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title.rendered,
      description:
        post.acf?.meta_description ||
        "Expertenwissen rund um Garten- und Landschaftsbau",
    },
    alternates: {
      canonical: `https://landschaftshelden.io/blog/${post.slug}`,
    },
  };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center'>
        <div className='text-center'>
          <h1 className='text-4xl font-bold text-gray-800 mb-4'>
            Artikel nicht gefunden
          </h1>
          <p className='text-gray-600 mb-8'>
            Dieser Artikel konnte leider nicht gefunden werden.
          </p>
          <Link href='/blog'>
            <Button className='bg-green-600 hover:bg-green-700 text-white'>
              Zurück zum Blog
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const options: HTMLReactParserOptions = {
    replace: (domNode: DOMNode) => {
      if (domNode.type === "tag") {
        const el = domNode as Element;

        if (el.attribs?.class?.includes("wp-block-group")) {
          return (
            <div className='bg-green-50 p-6 rounded-lg mb-6 border border-green-200'>
              {domToReact(el.children as DOMNode[], options)}
            </div>
          );
        }

        if (el.attribs?.class?.includes("wp-block-columns")) {
          return (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 justify-center items-center'>
              {domToReact(el.children as DOMNode[], options)}
            </div>
          );
        }

        if (el.attribs?.class?.includes("wp-block-column")) {
          return (
            <div className='p-4'>
              {domToReact(el.children as DOMNode[], options)}
            </div>
          );
        }

        if (el.attribs?.class?.trim() === "wp-block-button") {
          return (
            <Button className='bg-green-600 cursor-pointer hover:bg-green-700 text-white'>
              {domToReact(el.children as DOMNode[], options)}
            </Button>
          );
        }

        if (el.attribs?.class?.trim() === "wp-block-cover") {
          return (
            <div className='relative bg-cover bg-center rounded-lg mb-6'>
              {domToReact(el.children as DOMNode[], options)}
            </div>
          );
        }

        if (el.attribs?.class?.includes("wp-block-cover__inner-container")) {
          return (
            <div className='absolute mx-auto top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center z-10'>
              {domToReact(el.children as DOMNode[], options)}
            </div>
          );
        }

        switch (el.name) {
          case "img":
            return (
              <Image
                src={el.attribs.src}
                alt={el.attribs.alt || ""}
                className='rounded-lg w-full h-[50vh] md:h-[25vh] object-cover shadow-lg'
                width={1200}
                height={500}
              />
            );

          case "p":
            if (el.attribs?.class?.includes("has-large-font-size")) {
              return (
                <p className='mb-6 text-gray-700 leading-relaxed text-2xl font-medium'>
                  {domToReact(el.children as DOMNode[], options)}
                </p>
              );
            }

            return (
              <p className='mb-4 text-gray-700 leading-relaxed text-lg'>
                {domToReact(el.children as DOMNode[], options)}
              </p>
            );

          case "h2":
            return (
              <Headings
                level={2}
                className='text-3xl font-bold mt-12 mb-6 text-green-800 border-b-2 border-green-200 pb-2'>
                {domToReact(el.children as DOMNode[], options)}
              </Headings>
            );

          case "h3":
            return (
              <h3 className='text-2xl font-semibold mt-8 mb-4 text-green-700'>
                {domToReact(el.children as DOMNode[], options)}
              </h3>
            );

          case "ul":
            return (
              <ul className='list-disc list-inside mb-6 text-gray-700 space-y-2 pl-4'>
                {domToReact(el.children as DOMNode[], options)}
              </ul>
            );

          case "ol":
            return (
              <ol className='list-decimal list-inside mb-6 text-gray-700 space-y-2 pl-4'>
                {domToReact(el.children as DOMNode[], options)}
              </ol>
            );

          case "li":
            return (
              <li className='mb-2 text-gray-700'>
                {domToReact(el.children as DOMNode[], options)}
              </li>
            );

          case "blockquote":
            return (
              <blockquote className='border-l-4 border-green-500 pl-6 italic text-gray-600 my-6 bg-green-50 py-4 rounded-r-lg'>
                {domToReact(el.children as DOMNode[], options)}
              </blockquote>
            );

          case "strong":
            return (
              <strong className='font-bold text-green-800'>
                {domToReact(el.children as DOMNode[], options)}
              </strong>
            );

          case "a":
            return (
              <Link
                href={el.attribs.href || ""}
                className='text-green-600 hover:text-green-800 underline font-medium'
                target='_blank'
                rel='noopener noreferrer'>
                {domToReact(el.children as DOMNode[], options)}
              </Link>
            );

          case "figure":
            return (
              <figure className='my-8 text-center'>
                {domToReact(el.children as DOMNode[], options)}
              </figure>
            );

          case "figcaption":
            return (
              <figcaption className='text-sm text-gray-500 mt-3 italic'>
                {domToReact(el.children as DOMNode[], options)}
              </figcaption>
            );
          case "button":
            return (
              <button className='bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors'>
                {domToReact(el.children as DOMNode[], options)}
              </button>
            );
        }
      }
    },
  };

  const content =
    typeof post.content === "string" ? post.content : post.content.rendered;

  const title =
    typeof post.title === "string" ? post.title : post.title.rendered;

  return (
    <div className='bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen'>
      <article className='container mx-auto px-4 py-12 max-w-7xl'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h1
            className='text-4xl md:text-5xl font-bold mb-6 text-green-800 leading-tight'
            dangerouslySetInnerHTML={{ __html: title }}
          />
          <div className='flex items-center justify-center space-x-4 text-gray-600'>
            <span>
              📅{" "}
              {new Date(post.date).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
            <span>•</span>
            <span>👤 Landschaftshelden Team</span>
          </div>
        </div>

        {/* Content */}
        <div className='bg-white rounded-2xl shadow-lg p-8 md:p-12'>
          <div className='prose prose-lg max-w-none'>
            {parse(content, options)}
          </div>
        </div>

        {/* CTA Section */}
        <div className='mt-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 md:p-12 text-white text-center shadow-xl'>
          <div className='max-w-3xl mx-auto'>
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              🌿 Bereit für Ihr Gartenprojekt?
            </h2>
            <p className='text-xl md:text-2xl mb-8 opacity-90'>
              Lassen Sie unsere Experten Ihren Traum-Garten verwirklichen!
              Erstellen Sie jetzt kostenlos Ihren Auftrag und erhalten Sie
              maßgeschneiderte Angebote von qualifizierten Landschaftsbauern.
            </p>

            <div className='grid md:grid-cols-3 gap-6 mb-8'>
              <div className='flex flex-col items-center'>
                <div className='bg-white/20 rounded-full p-4 mb-3'>
                  <span className='text-2xl'>📝</span>
                </div>
                <h3 className='font-semibold mb-2'>1. Auftrag erstellen</h3>
                <p className='text-sm opacity-80'>
                  Beschreiben Sie Ihr Projekt in wenigen Minuten
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='bg-white/20 rounded-full p-4 mb-3'>
                  <span className='text-2xl'>💼</span>
                </div>
                <h3 className='font-semibold mb-2'>2. Angebote erhalten</h3>
                <p className='text-sm opacity-80'>
                  Qualifizierte Betriebe melden sich bei Ihnen
                </p>
              </div>
              <div className='flex flex-col items-center'>
                <div className='bg-white/20 rounded-full p-4 mb-3'>
                  <span className='text-2xl'>🎯</span>
                </div>
                <h3 className='font-semibold mb-2'>3. Besten wählen</h3>
                <p className='text-sm opacity-80'>
                  Vergleichen Sie und entscheiden Sie sich
                </p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/auftrag-erstellen'>
                <Button
                  size='lg'
                  className='bg-white text-green-600 hover:bg-gray-100 font-bold px-8 py-4 text-lg rounded-full shadow-lg transform hover:scale-105 transition-all duration-200'>
                  🚀 Jetzt Auftrag erstellen
                </Button>
              </Link>
              <Link href='/unternehmen-finden'>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-white hover:bg-white text-green-600 hover:text-green-600 font-bold px-8 py-4 text-lg rounded-full'>
                  🔍 Unternehmen finden
                </Button>
              </Link>
            </div>

            <p className='text-sm opacity-75 mt-6'>
              ✅ Kostenlos & unverbindlich • ✅ Nur geprüfte Betriebe • ✅
              Regionaler Service
            </p>
          </div>
        </div>

        {/* Back to Blog */}
        <div className='text-center mt-12'>
          <Link href='/blog'>
            <Button
              variant='outline'
              className='border-green-600 text-green-600 hover:bg-green-600 hover:text-white'>
              ← Zurück zum Blog
            </Button>
          </Link>
        </div>
      </article>
    </div>
  );
}
