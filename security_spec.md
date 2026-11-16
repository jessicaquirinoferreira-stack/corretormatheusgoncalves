# Firestore Security Specification — Matheus Gonçalves Imóveis & CRM

## 1. Data Invariants
1. **Strict CRM Isolation (Zero PII Exposure)**: All collections containing personally identifiable information or private commercial state (`leads`, `clients`, `activities`, `visits`, `proposals`, `tasks`, `adminLogs`, `media`, `pipelineStages`, `analytics` reads) are readable ONLY by a verified Admin (`isAdmin()`). Unauthenticated or non-admin users can NEVER `get` or `list` any lead or client document.
2. **Public Catalog Scoping**: `properties`, `empreendimentos`, and `landingPages` enforce `resource.data.isPublic == true` on public `get` and `list` operations, ensuring hidden/draft items are invisible to non-admins.
3. **Public Lead Capture Integrity**: Unauthenticated visitors can only `create` a `leads` document when `lgpdConsent == true`, `stageId == 'novo_lead'`, `createdAt == request.time`, `updatedAt == request.time`, and all string fields satisfy strict `.size()` bounds and `hasOnly` allowlists.
4. **Bootstrapped Verified Admin**: `isAdmin()` mandates `request.auth != null && request.auth.token.email_verified == true` AND either the runtime bootstrapped admin email (`jonasweb2rj@gmail.com`) or existence of `/admins/$(request.auth.uid)`.
5. **Immutable Audit Trail**: `adminLogs` cannot be modified or deleted after creation; `createdAt` is immutable on all entities.

## 2. The "Dirty Dozen" Adversarial Payloads (Must Return PERMISSION_DENIED)
1. **Unauthenticated Lead Scraping**: `list('/leads')` by unauthenticated user -> DENIED.
2. **Unverified Email Admin Spoof**: `get('/clients/c1')` with `email: 'jonasweb2rj@gmail.com', email_verified: false` -> DENIED.
3. **Ghost Field Shadow Injection on Lead Form**: `create('/leads/l1', { ..., isAdmin: true })` -> DENIED via `keys().hasOnly(...)`.
4. **Public Lead Stage Shortcutting**: `create('/leads/l1', { ..., stageId: 'fechado_ganho' })` by visitor -> DENIED (`stageId == 'novo_lead'`).
5. **Public Lead Without LGPD Consent**: `create('/leads/l1', { ..., lgpdConsent: false })` by visitor -> DENIED (`lgpdConsent == true`).
6. **Timestamp Forgery on Lead Create**: `create('/leads/l1', { ..., createdAt: '2020-01-01T00:00:00Z' })` -> DENIED (`createdAt == request.time`).
7. **ID Poisoning (>128 chars or special chars)**: `create('/leads/' + 'a'.repeat(200), ...)` -> DENIED via `isValidId()`.
8. **Resource Exhaustion (>4000 chars notes)**: `create('/leads/l1', { ..., notes: 'x'.repeat(5000) })` -> DENIED via `.size()`.
9. **Hidden Property Scrape**: `get('/properties/hidden1')` where `isPublic == false` by non-admin -> DENIED.
10. **Non-Admin Property Mutation**: `update('/properties/p1', { price: 1 })` by signed-in non-admin -> DENIED.
11. **Admin Log Tampering**: `update('/adminLogs/log1', { action: 'tampered' })` or `delete('/adminLogs/log1')` -> DENIED (logs are append-only).
12. **Self-Privilege Escalation**: `create('/admins/' + uid, { role: 'admin' })` by non-admin user -> DENIED.
