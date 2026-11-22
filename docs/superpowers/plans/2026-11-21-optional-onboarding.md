# Optional account onboarding

Owner request: offer guided setup once after first signup. Declining or leaving
the invitation must not cause later automatic prompts. Account settings keeps
explicit setup and independent controls. The owner subsequently clarifies that
unfinished guided setup should save its progress and offer continuation on return.

1. Seed a non-PHI pending invitation only in new password/Google account
   creation transactions. Existing users receive no retroactive invitation.
2. Keep login, verification and legal acceptance intact. Their default return
   becomes Home. After legal acceptance, pending new accounts go to an optional
   invitation with their sanitized intended destination preserved.
3. Claim the invitation through an authenticated client action, never a GET.
   Lock the preference owner, consume once before displaying, and isolate late
   replies/Strict Mode replay. Store lifecycle separately from actual answers;
   ordinary settings sync must not reopen it from a stale client snapshot.
4. Offer Start guided setup / Not now. Both retain the intended destination.
   Guided setup saves a constrained account draft separately from applied
   answers, starting when the user explicitly opens it. Serialize captures,
   save shortcut reorder changes, and wait for acknowledgement on Leave/Finish.
   Use a monotonic revision under the owner lock to reject stale tabs and late
   autosaves after completion. Keep drafts out of generic preference sync.
5. An unfinished started draft receives one Continue setup / Not now offer at
   the next sign-in or when returning to Home. Home uses an inline card, keeping
   tools available. Claim once across tabs. A shown/declined continuation cannot
   be re-enabled by a late autosave; drafts remain available in Account settings.
   Completion applies the answers, removes the draft and consumes reminders.
6. Validate new/existing accounts, skipped/abandoned/completed invitations,
   parallel claims, owner changes, failures, callbacks, consent boundaries and
   draft restore/revision conflicts, persistence failures, explicit Leave/Finish
   and preservation of unrelated preferences. Use fictional local browser fixtures.

No schema migration, live signup/email/provider/database operation or deployment
is authorized. Source reviews, hosted checks and release acceptance remain
required before publication.
