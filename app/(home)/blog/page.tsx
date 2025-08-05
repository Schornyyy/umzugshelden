import { Noto_Sans } from "next/font/google";
import ClientCategoryPosts from "./_components/ClientCategoryPosts";
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

export default function BlogPage() {
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

        {/* Blog Posts */}
        <div className='bg-white rounded-2xl shadow-lg p-8'>
          <ClientCategoryPosts categorySlug={"landschaftshelden"} />
        </div>
      </div>
    </div>
  );
}
