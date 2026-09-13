import type { MetadataRoute } from "next"
import { PUBLIC_PRODUCT_IDENTITY } from "@/lib/public-product-identity"

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: PUBLIC_PRODUCT_IDENTITY.name,
    short_name: PUBLIC_PRODUCT_IDENTITY.shortName,
    description: "Anatomy study, session timing, wellness, and local-first practice tools for massage students, educators, therapists, and small practices.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#050505",
    theme_color: "#050505",
    categories: ["health", "education", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/maskable-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
