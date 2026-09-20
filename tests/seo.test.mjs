import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import { describe, it } from "node:test"
import { LEGAL_DOCUMENTS } from "../lib/legal-documents.js"
import {
  PUBLIC_SEO_ROUTES,
  ROBOTS_PRIVATE_DISALLOW_PATHS,
  SEO_SITE_NAME,
  SEO_DEFAULT_IMAGE,
  buildCanonicalUrl,
  createPublicPageMetadata,
  createSeoJsonLd,
  createSitemapEntries,
  getRobotsRouteConfig,
  publicSeoIndexingEnabled,
} from "../lib/seo.js"
import { MASSAGELAB_SOCIAL_LINKS, MASSAGELAB_SOCIAL_URLS } from "../lib/social-links.js"

const productionEnv = Object.freeze({ NODE_ENV: "production", VERCEL_ENV: "production" })
const previewEnv = Object.freeze({ NODE_ENV: "production", VERCEL_ENV: "preview" })
const developmentEnv = Object.freeze({ NODE_ENV: "development" })

function readProjectFile(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8").toLowerCase()
}

describe("SEO route contract", () => {
  it("presents AtmoShaper and omits unapproved root social imagery", () => {
    assert.equal(SEO_SITE_NAME, "AtmoShaper")
    assert.equal(SEO_DEFAULT_IMAGE, null)

    const metadata = createPublicPageMetadata("/")

    assert.equal(metadata.title, "AtmoShaper | Massage anatomy flashcards, session timer, and practice tools")
    assert.equal(metadata.applicationName, "AtmoShaper")
    assert.equal(metadata.openGraph.siteName, "AtmoShaper")
    assert.equal("images" in metadata.openGraph, false)
    assert.equal(metadata.twitter.card, "summary")
    assert.equal("images" in metadata.twitter, false)
  })

  it("enables public indexing only for production deployments", () => {
    assert.equal(publicSeoIndexingEnabled(productionEnv), true)
    assert.equal(publicSeoIndexingEnabled(previewEnv), false)
    assert.equal(publicSeoIndexingEnabled(developmentEnv), false)
  })

  it("builds canonical URLs on the production redirect target", () => {
    assert.equal(buildCanonicalUrl("/about/"), "https://www.massagelab.app/about")
    assert.equal(buildCanonicalUrl("education/flashcards"), "https://www.massagelab.app/education/flashcards")
  })

  it("keeps legal documents and starter study routes in the public sitemap contract", () => {
    const publicPaths = PUBLIC_SEO_ROUTES.map((route) => route.path)
    const helpRoute = PUBLIC_SEO_ROUTES.find((route) => route.path === "/help")

    assert.ok(publicPaths.includes("/"))
    assert.deepEqual(helpRoute && {
      path: helpRoute.path,
      title: helpRoute.title,
      description: helpRoute.description,
    }, {
      path: "/help",
      title: "AtmoShaper Help & FAQ",
      description: "Learn how to use AtmoShaper accounts, installation, Clock, Chimer, Music, backgrounds, subscriptions, privacy, and support.",
    })
    assert.ok(publicPaths.includes("/education/flashcards/decks/starter-all-body-identification"))
    assert.ok(publicPaths.includes("/education/flashcards/decks/starter-muscle-attachments"))
    assert.ok(publicPaths.includes("/education/flashcards/decks/starter-regions-and-categories"))
    assert.ok(publicPaths.includes("/tools"))
    assert.ok(publicPaths.includes("/tools/business-planner"))
    assert.ok(publicPaths.includes("/tools/business-planner/income"))
    assert.ok(publicPaths.includes("/tools/business-planner/break-even"))
    assert.ok(publicPaths.includes("/tools/business-planner/launch-checklist"))
    assert.ok(publicPaths.includes("/tools/business-planner/service-menu"))
    assert.ok(publicPaths.includes("/tools/business-planner/plan-outline"))
    assert.ok(publicPaths.includes("/tools/business-planner/add-on-profit"))

    for (const document of LEGAL_DOCUMENTS) {
      assert.ok(publicPaths.includes(document.route), `missing legal route ${document.route}`)
    }
  })

  it("presents current legal-page metadata as AtmoShaper", () => {
    const legalPageCopy = [
      readProjectFile("app/legal/page.tsx"),
      readProjectFile("app/legal/[slug]/page.tsx"),
      readProjectFile("app/legal/accept/page.tsx"),
    ].join(" ")

    assert.match(legalPageCopy, /atmoshaper/)
    assert.doesNotMatch(legalPageCopy, /massage\s*lab/)
  })

  it("does not include private or per-user paths in sitemap entries", () => {
    const entries = createSitemapEntries(productionEnv)
    const urls = entries.map((entry) => new URL(entry.url))

    assert.equal(entries.length, PUBLIC_SEO_ROUTES.length)
    assert.equal(createSitemapEntries(previewEnv).length, 0)

    for (const [index, url] of urls.entries()) {
      const entry = entries[index]

      assert.equal(url.search, "")
      assert.equal(url.hostname, "www.massagelab.app")
      assert.equal(url.pathname.startsWith("/api/"), false)
      assert.equal(url.pathname.startsWith("/account"), false)
      assert.equal(url.pathname.startsWith("/admin"), false)
      assert.equal(url.pathname === "/book" || url.pathname.startsWith("/book/"), false)
      assert.equal(url.pathname.startsWith("/calendar"), false)
      assert.equal(url.pathname === "/anatomime/play" || url.pathname.startsWith("/anatomime/play/"), false)
      assert.equal(url.pathname.startsWith("/notes/soap"), false)
      assert.equal("priority" in entry, false)
      assert.equal("changeFrequency" in entry, false)
    }
  })

  it("blocks private sections in production robots.txt while advertising the sitemap", () => {
    const robots = getRobotsRouteConfig(productionEnv)
    const disallow = robots.rules[0].disallow

    assert.equal(robots.sitemap, "https://www.massagelab.app/sitemap.xml")
    assert.deepEqual(disallow, [...ROBOTS_PRIVATE_DISALLOW_PATHS])
    assert.ok(disallow.includes("/api/"))
    assert.ok(disallow.includes("/account"))
    assert.ok(disallow.includes("/anatomime/play"))
    assert.ok(disallow.includes("/book"))
    assert.ok(disallow.includes("/legal/accept"))
    assert.ok(disallow.includes("/notes/soap"))
  })

  it("publishes social profiles as organization sameAs links", () => {
    const organization = createSeoJsonLd()["@graph"].find((node) => node["@type"] === "Organization")
    assert.ok(organization, "Organization node missing from SEO JSON-LD graph")

    assert.equal(organization.name, "AtmoShaper")
    assert.equal("logo" in organization, false)
    assert.deepEqual(organization.sameAs, [...MASSAGELAB_SOCIAL_URLS])
    assert.deepEqual([...MASSAGELAB_SOCIAL_URLS], [
      "https://www.instagram.com/massagelab/",
      "https://www.youtube.com/@massagelabtv",
      "https://www.facebook.com/massagewithderrick",
    ])
    assert.deepEqual(MASSAGELAB_SOCIAL_LINKS.map((link) => link.description), [
      "AtmoShaper photos, updates, and behind-the-scenes work.",
      "AtmoShaper demos, education clips, and video updates.",
      "Derrick's massage practice updates and community posts.",
    ])
  })

  it("disallows all crawling outside production", () => {
    assert.deepEqual(getRobotsRouteConfig(previewEnv).rules, [{ userAgent: "*", disallow: "/" }])
    assert.deepEqual(getRobotsRouteConfig(developmentEnv).rules, [{ userAgent: "*", disallow: "/" }])
  })

  it("keeps focused public landing copy aligned with target searches", () => {
    const publicRouteCopy = PUBLIC_SEO_ROUTES
      .map((route) => `${route.title} ${route.description}`)
      .join(" ")
      .toLowerCase()

    assert.match(readProjectFile("app/page.tsx"), /massage anatomy flashcards/)
    assert.match(readProjectFile("app/page.tsx"), /massage session timer/)
    assert.match(readProjectFile("app/education/flashcards/page.tsx"), /massage anatomy flashcards/)
    assert.match(readProjectFile("app/anatomime/page.tsx"), /massage anatomy classroom game/)
    assert.match(readProjectFile("app/tools/business-planner/page.tsx"), /business planner/)
    assert.match(readProjectFile("app/tools/business-planner/income/income-planner-client.tsx"), /business income planner/)
    assert.match(readProjectFile("app/tools/business-planner/break-even/break-even-planner-client.tsx"), /break-even/)
    assert.match(readProjectFile("app/tools/business-planner/service-menu/service-menu-client.tsx"), /service menu/)
    assert.match(readProjectFile("app/tools/business-planner/launch-checklist/launch-checklist-client.tsx"), /practice launch checklist/)
    assert.match(readProjectFile("app/tools/business-planner/plan-outline/plan-outline-client.tsx"), /business plan outline/)
    assert.match(readProjectFile("app/tools/business-planner/add-on-profit/add-on-profit-client.tsx"), /add-on profit/)
    assert.match(readProjectFile("app/notes/page.tsx"), /local-first massage documentation/)
    assert.match(readProjectFile("app/wellness/page.tsx"), /massage wellness tools/)
    assert.match(publicRouteCopy, /massage anatomy flashcards/)
    assert.match(publicRouteCopy, /massage session timer/)
    assert.match(publicRouteCopy, /massage therapist income planner/)
    assert.match(publicRouteCopy, /massage business break-even planner/)
    assert.match(publicRouteCopy, /local-first massage documentation/)
  })

  it("keeps public about pages visitor-facing instead of placeholder-facing", () => {
    const aboutCopy = readProjectFile("app/about/page.tsx")
    const derrickCopy = readProjectFile("app/about/derrick/page.tsx")
    const combinedCopy = `${aboutCopy} ${derrickCopy}`

    assert.match(aboutCopy, /built from inside the massage profession/)
    assert.match(derrickCopy, /licensed massage therapist in ohio/)
    assert.doesNotMatch(combinedCopy, /current focus/)
    assert.doesNotMatch(combinedCopy, /credential note/)
    assert.doesNotMatch(combinedCopy, /intentionally brief/)
    assert.doesNotMatch(combinedCopy, /exact wording/)
    assert.doesNotMatch(combinedCopy, /private-alpha|private alpha/)
  })
})

describe("Sitemap revision dates", () => {
  it("publishes the approved shared and legal revision dates", () => {
    const entries = createSitemapEntries(productionEnv)
    const entriesByPath = new Map(entries.map((entry) => [new URL(entry.url).pathname, entry]))
    const expectedDates = new Map([
      ["/", "2026-09-19"],
      ["/about", "2026-09-19"],
      ["/legal", "2026-09-14"],
      ...LEGAL_DOCUMENTS.map((document) => [document.route, "2026-09-14"]),
    ])

    for (const [path, expectedDate] of expectedDates) {
      const entry = entriesByPath.get(path)
      assert.ok(entry, `missing sitemap entry ${path}`)
      assert.ok(Number.isFinite(entry.lastModified.getTime()), `invalid sitemap date ${path}`)
      assert.equal(entry.lastModified.toISOString().slice(0, 10), expectedDate)
    }

    assert.equal(createSitemapEntries(previewEnv).length, 0)
    assert.equal(createSitemapEntries(developmentEnv).length, 0)
  })
})
