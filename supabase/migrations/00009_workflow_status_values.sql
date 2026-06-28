-- ===== Workflow status values =====
-- Two-stage approval: the brand approves the DRAFT (no money), the creator
-- PUBLISHES the live post, then the brand approves the live post to release.
-- After the minimum post lifetime elapses, a COMPLETED gig becomes EXPIRED.
--
-- Postgres cannot use a newly-added enum value in the same transaction it is
-- added, so these live in their own migration ahead of any code that references
-- them as literals.

alter type gig_status add value if not exists 'PUBLISHED';
alter type gig_status add value if not exists 'EXPIRED';
