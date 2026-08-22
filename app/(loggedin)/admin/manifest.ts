import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Umzugshelden Admin",
    short_name: "UH Admin",
    description: "Umzugshelden Verwaltungsbereich",
    start_url: "/admin",
    scope: "/admin/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#2563eb",
    lang: "de-DE",
    icons: [
      {
        src: "/admin/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/admin/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}