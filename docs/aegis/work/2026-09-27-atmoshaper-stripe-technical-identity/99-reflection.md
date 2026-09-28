# Reflection

- Centralizing Stripe provider metadata prevented readiness, billing, and the
  migration script from defining competing ownership rules.
- The explicit current/legacy classifiers preserve necessary historical
  reconciliation while making fresh AtmoShaper writes unambiguous and
  fail-closed when metadata is partial or contradictory.
- Keeping public identity separate from technical compatibility identifiers
  lets user-facing Checkout copy move to AtmoShaper without prematurely
  retiring historical idempotency, purpose, Price, or database contracts.
- Provider setup remains a distinct stage because catalog creation, webhook
  configuration, Vercel secrets, deployment, and test transactions require an
  exact external-write authorization and provider-specific rollback evidence.
