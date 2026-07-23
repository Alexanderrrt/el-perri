# Disaster recovery

## Targets

- RTO: under 30 minutes through Vercel deployment rollback.
- RPO: the latest merged Git commit; the site stores no customer data.

## Restore

1. In Vercel Deployments, select the last known-good production deployment and
   promote it.
2. If code caused the incident, revert the merge on a new `fix/` branch, run
   `npm run verify`, and merge through a reviewed PR.
3. If DNS caused the incident, restore the values recorded in the ownership
   handoff and wait for the configured TTL.
4. Verify `/`, `/en`, both menu routes, phone, WhatsApp, Maps, sitemap, and TLS.

## Backups

GitHub is the source of truth for code. Restaurant media originals and the DNS
record export must also be retained in agency-controlled storage. There is no
application database to back up.
