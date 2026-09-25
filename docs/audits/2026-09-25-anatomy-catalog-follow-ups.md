# Anatomy Catalog Audit Follow-ups

Date: 2026-09-25

## Purpose and boundary

This record preserves non-blocking observations from the isolated anatomy
catalog audit performed before the AtmoShaper production identity/data cutover.
The audit inspected aggregate catalog state only; it did not copy production
data, expose database rows or credentials, change providers, or deploy code.

The accompanying bounded repair addresses the ten findings that were definite
data-consistency errors: nine action movement/joint mismatches and one extensor
carpi radialis longus origin landmark mapped to the wrong bone. The items below
are future anatomy-module work and must not silently expand that migration gate.
Counts are a 2026-09-25 snapshot and should be remeasured before implementation.

## Future work

1. Complete sparse muscle records.
   - 31 of 292 muscle records lacked origin, insertion, action, or innervation
     detail in the audited snapshot.
   - Address these as source-backed, reviewable content batches rather than one
     broad migration change.

2. Review anatomy image coverage and runtime use.
   - The catalog contained 7,771 image-to-entity links and 5,159 reviewed
     open-reuse image assets.
   - The audited study runtime exposed only three media cards and no
     identify-from-image prompts, so stored coverage and learner-visible use
     should be reconciled deliberately.

3. Rebrand the anatomy media origin before retiring legacy infrastructure.
   - 5,159 media URLs used `anatomy-media.massagelab.app` in the audited
     snapshot.
   - Move or alias them to an AtmoShaper-owned media origin with cache,
     availability, and rollback checks; do not perform a blind URL rewrite.

4. Decide the 3D and movement-visualization track.
   - One 3D model, nine spatial mappings, and two movement visualizations were
     still review-only.
   - Review and promote useful assets or retire the dormant records. This is a
     product-content decision, not a prerequisite for the data cutover.

5. Revisit partial MBLEx coverage.
   - `ap-energetic-anatomy` remained partial.
   - Expand only with appropriate scientific and commercially usable sources;
     do not fill the area with unsupported or licensing-ambiguous content.

6. Clarify aggregate-versus-specific landmark ownership.
   - The audit surfaced 66 raw attachment bone/landmark ownership mismatches.
     One was the definite humerus/femur ECRL error fixed by the bounded repair;
     many others reflected aggregate bones paired with more-specific landmarks.
   - Model that distinction explicitly or introduce reviewed exceptions before
     enforcing a global attachment landmark/bone validator. Do not bulk-rewrite
     those rows from the raw count alone.

## Migration decision

These follow-ups should remain visible in anatomy planning, but they do not
delay the broader MassageLab-to-AtmoShaper migration or the separately approved
production data-cutover procedure. Any implementation should be scoped and
reviewed as its own content or schema track.
