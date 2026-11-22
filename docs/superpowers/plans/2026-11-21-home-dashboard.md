# Compact home dashboard

Owner request: replace the crowded home page with an app-like returning-user
dashboard and concise first-visitor launch pad. Balanced emphasis across music,
clock, wellness, calendar, study and practice. Local implementation and preview;
publication is a separate request.

1. Preserve accessible AtmoShaper heading, metadata, shell, player, button
   materials and destination authorization.
2. Replace repeated marketing/catalog sections with six touch targets. Category
   sheets and All tools use canonical filtered sidebar groups. About keeps brief
   product, privacy and membership context.
3. Honor explicit saved shortcut order and destinations; balanced defaults when
   none exist. Read preferences and permissions only. Preference read failure
   falls back without exposing account/provider details.
4. Remember only introduction dismissal. No clinical data, history, personal
   summaries or account identifiers enter browser state.
5. Verify actual components on phone, tablet, desktop and short/narrow screens,
   both themes, keyboard operation, returning state and denied storage. Verify
   saved shortcut compatibility and permission-filtered Notes visibility.
6. Update obsolete home tests and record concept/render comparisons. The
   `npm run preview:home-dashboard` loopback preview is guest-only. Synthetic
   signed-in/saved-shortcut states are exercised by the actual-component test
   `node --test tests/home-product-identity-layout.test.mjs`; its screenshots in
   `output/home-dashboard/` support review without a live account or sign-in.
7. Owner-requested follow-up: extract the unchanged Clock implementation into a
   shared client screen; leave framework page entry points free of internal
   preview inputs. Regenerate real route types and pass the full type check,
   focused Clock regressions and lint. Reproduce the reported preview mismatch,
   add true SSR hydration coverage, and recover the embedded preview without
   deleting saved data.

Before later publication: substantive current-source Codex and CodeRabbit
review, required hosted checks and staged acceptance. No provider/database
mutation, live email/payment action or deployment under this task.
