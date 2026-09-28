# Supporter Buyer-Use Classification Reflection

The approved customer-choice model is implemented without changing the economic offer: a buyer must declare personal/non-business or work/business use, while price and benefits remain identical. Public Checkout fails closed unless the complete v2 catalog is present and internally consistent.

Historical v1 Price and Product identity is intentionally retained for webhook, subscription, admin, and reconciliation compatibility. It is not selectable by new public Checkout. Removing those remnants safely requires a future provider/database inventory proving that no historical objects still reference them.

The application slice is ready for review, but the migration is not ready for activation. A separate, explicitly authorized provider step must create and verify the 6-Product/12-Price Stripe sandbox catalog, configure the corresponding Vercel variables, redeploy, and run controlled synthetic Checkout/Portal/webhook tests. Live billing remains paused until tax-registration and provider-classification gates are satisfied.

Validation is strong but not presented as perfect: the focused 383-test billing/workload matrix, typecheck, lint, and production build passed; the monolithic full-suite command hung after many passing suites, and the line-based brand audit is already stale on exact `main` while also being sensitive to intentional private reconciliation occurrences. Those residuals are recorded rather than hidden or mechanically rewritten into this billing PR.
