# Customer-facing branding and contact privacy

Status: **temporary business support phone saved and verified; personal-cell item closed**.
The owner narrowed the goal to what customers see, rather than consolidating
private administrator logins. The initial personal-cell finding below is
superseded by the approved business-number replacement in this receipt.

## Approved replacement and readback

The owner selects the existing salon number as temporary AtmoShaper support and
confirms the exact digits and that callers can reach the owner or leave an
AtmoShaper message. The approval covers only Stripe's public customer-support
phone, with receipt/invoice display kept off and private phones unchanged.

Fresh preflight matches the reviewed original phone in the visible public
summary, branded support email, public name and descriptor. The editor's DOM
redacts phone values: an initial exact-value guard stops before any fill or
save. The public summary supplies the legitimate visible preflight instead.
Filled only the approved public phone; all other visible form fields compare
unchanged and receipt display is false. Submitted Save once.

The saved summary shows the approved salon number and no longer lists the
personal cell as support. A fresh editor reopen matches every other visible
public-contact field and confirms receipt/invoice phone display still off.
The reopened editor is cancelled without a second save. A file-backed screenshot
of the saved number and unchecked display control remains in ignored operator
output. The actual contact values are not copied into Git.

This closes the owner's personal-cell exposure item for the current setting.
It does not prove that historical bank transaction displays are rewritten.
Private representative/verification/recovery phones, legal identity, support
address/email/URLs, branding and transactions are untouched. No new financial
submission, receipt email, deployment, phone-service account or port occurs.

## Initial read-only findings (historical)

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

## Original prepared action (completed above)

Obtain an owner-selected business support number, then replace only the current
AtmoShaper Stripe public support phone under the applicable exact provider
authority. Keep receipt/invoice phone display off and preserve support email,
address, legal name, representative/verification phone, account ownership,
branding, payment settings and existing transactions. Read back that exact public
field and the display control after any approved save. No new purchase, receipt
send, account transfer or deployment is needed to verify the setting.

Before this approval, personal-cell exposure through payment statements remained
an unresolved customer-facing item and the initial inspection editor was
cancelled without saving. The later approved replacement above supersedes that
hold. Accepted application/release tests remain valid. Private contact values,
identity details and provider references are omitted from this record.

## Phone-service research, November 18

No examined free service provides a verified no-inactivity-expiry guarantee:

| Service | Relevant published constraint |
| --- | --- |
| Free Google Voice | Its [acceptable-use policy](https://support.google.com/voice/answer/9230450?hl=en) allows number reclamation after three months without intended use. [Reclaim guidance](https://support.google.com/voice/answer/159519?hl=en) lists calls, texts or listening to voicemail before the reclaim date. No promised permanent-number exception is established by this check. |
| TextFree | [Thirty days without an outgoing call/text](https://textfree.zendesk.com/hc/en-us/articles/360037485572-Did-your-number-expire) expires a free number; merely receiving calls/messages does not preserve it. |
| TextNow | [Free-number recycling](https://help.textnow.com/hc/en-us/articles/360043106673-Help-My-Phone-Number-was-recycled-how-can-I-get-it-back) has no fixed inactivity guarantee. Its [free wireless plan is personal-use only](https://help.textnow.com/hc/en-us/articles/13348268993303-Why-was-my-account-limited), so it is not a business recommendation here. |
| Talkatone | [Thirty-day inactivity](https://talkatone.zendesk.com/hc/en-us/articles/360037775852-For-how-long-do-I-get-to-keep-my-number) can consume paid credits or lead to losing the number; that does not satisfy a free low-maintenance requirement. |

The optional [Google Voice Starter standalone](https://support.google.com/voice/answer/16515632?hl=en)
is listed at $10/month before applicable taxes/fees for a single US Gmail user,
without a separate Workspace subscription. Its current
[paid-service terms](https://workspace.google.com/terms/voice-personal-terms/)
also reserve inactive-number removal; do not claim an unconditional retention
guarantee or buy a plan without reviewing actual offered retention/billing terms.

Recommendation for this beta is the existing owner-approved salon line, with
the branded inbox as the normal written support route. A dedicated line can
be selected later; no new account, reminder, paid plan or recurring charge is
created by this research.
