import { Noto_Sans } from "next/font/google";
// Server-side gerenderte Blog-Seite mit Pagination & Filtern
import Link from "next/link";
import { getPosts, getPostsByCategory } from "@/actions/blogActions";
import { WPPost } from "@/types/wordpressTypes";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Landschaftshelden Blog - Garten- und Landschaftsbau Tipps & Trends",
  description:
    "Entdecke hilfreiche Artikel rund um Garten- und Landschaftsbau, Gartengestaltung und Pflegetipps. Expertenwissen für Gärtner, Landschaftsbauer und Gartenliebhaber.",
  keywords: [
    "Garten Blog",
    "Landschaftsbau Blog",
    "Gartengestaltung Tipps",
    "Gartenpflege",
    "Landschaftsarchitektur",
    "Galabau Tipps",
    "Garten Trends",
    "Pflanzen Ratgeber",
    "Outdoor Design",
    "Garten Inspiration",
  ],
  authors: [{ name: "Landschaftshelden" }],
  openGraph: {
    title: "Landschaftshelden Blog - Garten- und Landschaftsbau Expertenwissen",
    description:
      "Hilfreiche Artikel rund um Garten- und Landschaftsbau, Gartengestaltung und Pflegetipps von echten Experten.",
    type: "website",
    locale: "de_DE",
    url: "https://landschaftshelden.io/blog",
    siteName: "Landschaftshelden.io",
  },
  twitter: {
    card: "summary_large_image",
    title: "Landschaftshelden Blog",
    description:
      "Expertenwissen rund um Garten- und Landschaftsbau, Gartengestaltung und Pflegetipps.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://landschaftshelden.io/blog",
  },
};

const noto = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "700"],
});

const BLOG_CATEGORY_SLUG =
  process.env.NEXT_PUBLIC_BLOG_CATEGORY_SLUG || "landschaftshelden";

const PER_PAGE = 24;

interface BlogPageProps {
  searchParams?: Promise<{
    page?: string;
    letter?: string;
    q?: string;
  }>;
}
export default async function BlogPage(props: BlogPageProps) {
  const params = props.searchParams ? await props.searchParams : {};
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const letter = params.letter ? decodeURIComponent(params.letter) : undefined;
  const q = params.q ? decodeURIComponent(params.q) : undefined;

  // Basisdaten holen (Kategorie bevorzugt)
  let basePosts: WPPost[] = [];
  try {
    const byCat = await getPostsByCategory(BLOG_CATEGORY_SLUG);
    basePosts = byCat.length ? byCat : await getPosts();
  } catch {
    basePosts = await getPosts();
  }

  // Alphabet & Suche filtern (SSR)
  let filtered = basePosts;
  if (letter) {
    filtered = filtered.filter((p) =>
      (p.title?.rendered || "")
        .trim()
        .toLowerCase()
        .startsWith(letter.toLowerCase())
    );
  }
  if (q) {
    const s = q.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        (p.title?.rendered || "").toLowerCase().includes(s) ||
        (p.excerpt?.rendered || "").toLowerCase().includes(s)
    );
  }

  // Pagination berechnen
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  const letters = Array.from(
    new Set(
      basePosts
        .map((p) => (p.title?.rendered || "").trim().charAt(0).toUpperCase())
        .filter((ch) => /[A-ZÄÖÜ]/i.test(ch))
    )
  ).sort();

  function buildQuery(
    params: Record<string, string | number | undefined | null>
  ) {
    const qs = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && String(v).length > 0)
        qs.set(k, String(v));
    });
    return qs.toString();
  }

  return (
    <div className='w-full bg-gradient-to-br from-green-50 to-emerald-50 min-h-screen'>
      <div className='container mx-auto max-w-7xl py-12 px-4 flex flex-col gap-8'>
        {/* Hero Section */}
        <div className='text-center mb-12'>
          <h1
            className={
              noto.className +
              " text-4xl md:text-7xl font-bold leading-tight z-10"
            }>
            Landschaftshelden Blog
          </h1>
          <p className='text-xl md:text-2xl text-gray-700 mt-6 max-w-4xl mx-auto leading-relaxed'>
            Expertenwissen, Trends und Inspiration rund um Garten- und
            Landschaftsbau
          </p>
          <div className='flex flex-wrap justify-center gap-4 mt-8'>
            <span className='bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium'>
              🌿 Gartengestaltung
            </span>
            <span className='bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full text-sm font-medium'>
              🏡 Landschaftsbau
            </span>
            <span className='bg-lime-100 text-lime-800 px-4 py-2 rounded-full text-sm font-medium'>
              🌱 Pflegetipps
            </span>
            <span className='bg-teal-100 text-teal-800 px-4 py-2 rounded-full text-sm font-medium'>
              🛠️ Profi-Tricks
            </span>
          </div>
        </div>

        {/* Filter & Suche */}
        <div className='bg-white rounded-2xl shadow-lg p-6 w-full'>
          <div className='flex flex-wrap gap-2 mb-4'>
            <Link
              href={`?${buildQuery({ letter: undefined, q, page: 1 })}`}
              className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                !letter
                  ? "bg-green-600 text-white border-green-600"
                  : "bg-white hover:bg-green-50 border-gray-300 text-gray-700"
              }`}>
              Alle
            </Link>
            {letters.map((l) => (
              <Link
                key={l}
                href={`?${buildQuery({ letter: l, q, page: 1 })}`}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  letter === l
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white hover:bg-green-50 border-gray-300 text-gray-700"
                }`}>
                {l}
              </Link>
            ))}
          </div>
          <form method='get' className='mb-4 flex flex-col md:flex-row gap-3'>
            {letter && <input type='hidden' name='letter' value={letter} />}
            <input
              type='text'
              name='q'
              defaultValue={q || ""}
              placeholder='Suche nach Beiträgen...'
              className='flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-500'
            />
            <button
              type='submit'
              className='px-5 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700'>
              Suche
            </button>
          </form>
          <div className='text-sm text-gray-500 mb-6'>
            {total} Beitrag{total !== 1 && "e"} gefunden • Seite {currentPage} /{" "}
            {totalPages}
          </div>

          {/* Posts Grid */}
          {pageItems.length === 0 ? (
            <div>Keine Beiträge gefunden.</div>
          ) : (
            <ul className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {pageItems.map((post) => (
                <li
                  key={post.id}
                  className='mb-8 border-b pb-4 w-full bg-white p-3 rounded-lg shadow hover:shadow-lg transition-shadow duration-300'>
                  <Link href={`/blog/${post.slug}`}>
                    {post.acf?.featured_image?.url && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.acf.featured_image.url}
                        alt={post.acf.featured_image.alt || "Beitragsbild"}
                        className='rounded-lg mb-2 h-[250px] w-full object-cover'
                        loading='lazy'
                      />
                    )}
                    <h3 className='text-lg font-semibold leading-snug'>
                      {post.title.rendered}
                    </h3>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='mt-10 flex flex-wrap items-center gap-2 justify-center'>
              {currentPage > 1 && (
                <Link
                  href={`?${buildQuery({ letter, q, page: currentPage - 1 })}`}
                  className='px-3 py-1 rounded border bg-white hover:bg-green-50 text-sm'>
                  ← Zurück
                </Link>
              )}
              {Array.from({ length: totalPages }).map((_, idx) => {
                const p = idx + 1;
                if (totalPages > 8) {
                  // Kompakte Darstellung bei vielen Seiten
                  if (
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 2 ||
                    p === 2 ||
                    p === totalPages - 1
                  ) {
                    return (
                      <Link
                        key={p}
                        href={`?${buildQuery({ letter, q, page: p })}`}
                        className={`px-3 py-1 rounded border text-sm ${
                          p === currentPage
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white hover:bg-green-50"
                        }`}>
                        {p}
                      </Link>
                    );
                  }
                  if (p === 3 && currentPage > 4)
                    return <span key='dots-left'>…</span>;
                  if (p === totalPages - 2 && currentPage < totalPages - 3)
                    return <span key='dots-right'>…</span>;
                  return null;
                }
                return (
                  <Link
                    key={p}
                    href={`?${buildQuery({ letter, q, page: p })}`}
                    className={`px-3 py-1 rounded border text-sm ${
                      p === currentPage
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-white hover:bg-green-50"
                    }`}>
                    {p}
                  </Link>
                );
              })}
              {currentPage < totalPages && (
                <Link
                  href={`?${buildQuery({ letter, q, page: currentPage + 1 })}`}
                  className='px-3 py-1 rounded border bg-white hover:bg-green-50 text-sm'>
                  Weiter →
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
