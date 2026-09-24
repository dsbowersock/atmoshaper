// @ts-check

import { PUBLIC_PRODUCT_IDENTITY } from "./public-product-identity.js"

/**
 * Canonical product social profiles used by UI link surfaces and SEO JSON-LD.
 * Constraints:
 * - `id` values are stable keys for page-level filters.
 * - `url` values are absolute external profile URLs.
 */
export const MASSAGELAB_SOCIAL_LINKS = Object.freeze([
  {
    id: "instagram",
    label: "Instagram",
    handle: "@massagelab",
    url: "https://www.instagram.com/massagelab/",
    description: `${PUBLIC_PRODUCT_IDENTITY.name} photos, updates, and behind-the-scenes work.`,
  },
  {
    id: "youtube",
    label: "YouTube",
    handle: "@massagelabtv",
    url: "https://www.youtube.com/@massagelabtv",
    description: `${PUBLIC_PRODUCT_IDENTITY.name} demos, education clips, and video updates.`,
  },
  {
    id: "facebook",
    label: "Facebook",
    handle: "@massagewithderrick",
    url: "https://www.facebook.com/massagewithderrick",
    description: "Derrick's massage practice updates and community posts.",
  },
])

/** URL-only projection consumed by Organization.sameAs structured data. */
export const MASSAGELAB_SOCIAL_URLS = Object.freeze(MASSAGELAB_SOCIAL_LINKS.map((link) => link.url))
