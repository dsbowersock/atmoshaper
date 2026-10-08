import type { Breadcrumb, ErrorEvent, Options, SpanJSON, TransactionEvent } from "@sentry/core"
import {
  filterAnonymousSentryIntegrations,
  getAnonymousSentryDataCollection,
} from "./lib/sentry-options"
import {
  getSentryEnvironment,
  getSentryTracesSampleRate,
  sanitizeSentryBreadcrumb,
  sanitizeSentryEvent,
  sanitizeSentrySpan,
  sanitizeSentryTransaction,
} from "./lib/sentry-privacy"

/** Builds the shared anonymous policy; absent app DSN keeps every runtime disabled. */
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
    tracesSampleRate: getSentryTracesSampleRate(),
    maxBreadcrumbs: 0,
    /** Removes collection pipelines whose envelopes can bypass the event sanitizer. */
    integrations(defaultIntegrations) {
      return filterAnonymousSentryIntegrations(defaultIntegrations)
    },
    /** Reduces outgoing error events to the shared anonymous diagnostic contract. */
    beforeSend(event: ErrorEvent) {
      return sanitizeSentryEvent(event) as ErrorEvent
    },
    /** Applies the same privacy boundary to transaction context and spans. */
    beforeSendTransaction(event: TransactionEvent) {
      return sanitizeSentryTransaction(event) as TransactionEvent
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
