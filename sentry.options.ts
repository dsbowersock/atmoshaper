import type { Breadcrumb, ErrorEvent, Options, SpanJSON } from "@sentry/core"
import {
  filterAnonymousSentryIntegrations,
  getAnonymousSentryDataCollection,
} from "./lib/sentry-options"
import {
  getSentryEnvironment,
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
  sanitizeSentrySpan,
} from "./lib/sentry-privacy"

/** Builds the shared errors-only policy; absent app DSN keeps every runtime disabled. */
export function getSentryOptions(): Options {
  const sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN

  return {
    dsn: sentryDsn,
    enabled: Boolean(sentryDsn),
    environment: getSentryEnvironment(),
    sampleRate: 1.0,
    sendDefaultPii: false,
    dataCollection: getAnonymousSentryDataCollection(),
    enableLogs: false,
    enableMetrics: false,
    // Explicit zero blocks Node environment fallback; the deny sampler also rejects sampled parents.
    tracesSampleRate: 0,
    tracesSampler: () => false,
    tracePropagationTargets: [],
    // External sampled spans bypass sampling; known SDK origins also cover unnamed spans.
    ignoreSpans: [/.*/, { attributes: { "sentry.origin": /.*/ } }],
    sendClientReports: false,
    maxBreadcrumbs: 0,
    /** Removes prohibited pipelines and permits only error/diagnostic event items before transport. */
    integrations(defaultIntegrations) {
      const integrations = filterAnonymousSentryIntegrations(defaultIntegrations)
      integrations.push({
        name: "ErrorsOnlyEnvelopeFilter",
        setup(client) {
          // Direct envelopes bypass capture hooks; runtime errors and diagnostics use event items.
          client.on("beforeEnvelope", (envelope) => {
            for (let index = envelope[1].length - 1; index >= 0; index -= 1) {
              if (envelope[1][index][0].type !== "event") envelope[1].splice(index, 1)
            }
          })
        },
      })
      return integrations
    },
    /** Reduces outgoing error events to the shared anonymous diagnostic contract. */
    beforeSend(event: ErrorEvent) {
      return sanitizeSentryEvent(event) as ErrorEvent
    },
    /** Drops explicitly captured transactions even when they bypass span creation. */
    beforeSendTransaction() {
      return null
    },
    /** Sanitizes independently emitted spans before SDK transport dispatch. */
    beforeSendSpan(span: SpanJSON) {
      return sanitizeSentrySpan(span) as SpanJSON
    },
    /** Discards unsafe breadcrumbs even if a future integration attempts to add them. */
    beforeBreadcrumb(breadcrumb: Breadcrumb) {
      return sanitizeSentryBreadcrumb(breadcrumb) as Breadcrumb | null
    },
  }
}
