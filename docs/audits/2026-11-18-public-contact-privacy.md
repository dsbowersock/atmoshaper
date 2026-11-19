# Customer-facing branding and contact privacy

Status: **checked email/name branding is correct; customer-support phone replacement pending**.
The owner narrowed the goal to what customers see, rather than consolidating
private administrator logins. The owner identifies Stripe's current support
phone as a personal cell number and wants to avoid exposing it.

## Read-only findings

| Surface | Observed result and limit |
| --- | --- |
| Public site | Fresh anonymous GETs for Support, Privacy and About Derrick return 200 with AtmoShaper branding. The support page shows `atmoshaper@gmail.com`; the personal Gmail is absent from all three rendered responses. |
| Runtime source | Public app/component/library/asset search finds no hardcoded personal Gmail. The central support target is the branded inbox. Third-party attribution emails and example input addresses are separate. |
| Google consent | The matched-client [accepted readback](2026-11-18-beta-final-publication.md#google-availability-read-only) shows verified AtmoShaper branding and the branded support/developer contact. No new grant or Google setting change is needed for this check. |
| Account recovery mail | The earlier approved single delivered message has a branded sender and correct site link. This check sends no new message and does not claim a new delivery or password reset. [Receipt](2026-11-18-account-recovery-mail.md). |
| Stripe public business details | Fresh live dashboard read confirms public name AtmoShaper, statement descriptor ATMOSHAPER, branded support email and canonical website/legal/support URLs. |
| Stripe customer emails | Fresh live dashboard read explicitly says replies go to `atmoshaper@gmail.com`. The sending domain is Stripe's domain. No new receipt or payment is created. |
| Stripe public support phone | A personal number remains configured. The existing native checkbox for showing it on receipts/invoices is already unchecked. Stripe's editor says bank/card statements still show the support number. No switch is changed. |
| Other public identity | The site intentionally names its legal operator and creator in copyright/legal/About text. Stripe also retains the correct individual legal name and configured support address. Legal identity and support-address changes are not bundled into the phone request. |

Stripe's [US phone requirements](https://support.stripe.com/questions/phone-number-requirements-for-us-stripe-accounts)
require a valid customer-support number and state that it is shared with card
networks and shown in cardmember transaction details. Its separate exception for
an individual/sole proprietor's business phone does not waive the support-number
requirement. Turning off receipt display therefore does not fully satisfy the
owner's personal-cell privacy preference.

## Prepared next action

Obtain an owner-selected business support number, then replace only the current
AtmoShaper Stripe public support phone under the applicable exact provider
authority. Keep receipt/invoice phone display off and preserve support email,
address, legal name, representative/verification phone, account ownership,
branding, payment settings and existing transactions. Read back that exact public
field and the display control after any approved save. No new purchase, receipt
send, account transfer or deployment is needed to verify the setting.

Until a replacement is selected, personal-cell exposure through payment
statements remains an unresolved customer-facing privacy item for payment beta
outreach. The already accepted application/release tests remain valid; this is
not a new application regression. The public-details editor was cancelled
without saving, so all provider fields are unchanged. Private contact values,
identity details and provider references are omitted from this record.
