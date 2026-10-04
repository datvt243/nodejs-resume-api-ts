# 2026-10-04 — swagger-cv-token-docs (implementer note)

- Worker: implementer (main session)
- Node: `swagger-cv-token-docs`
- No GitHub issue — operator-requested in chat, follow-up to a question
  about how `GET /api/v1/download-pdf`'s query-string token auth works.
- Branch: `chore-swagger-cv-token-docs` (forked fresh from `origin/staging`,
  which now includes `add-ats-pdf-export`/#211 after today's `/release`
  to v1.10.0).

## What changed
Swagger/OpenAPI JSDoc comments + the securitySchemes config only — **no
runtime behavior change** (confirmed: only comment blocks + one config
object touched, no controller/middleware logic edited).

1. `src/config/swagger.config.ts`:
   - Added a `description` to the existing `bearerAuth` scheme (previously
     undocumented beyond type/scheme/format).
   - Added a new `queryTokenAuth` securityScheme (`type: apiKey`,
     `in: query`, `name: token`) with a description explaining it's the
     same JWT, just read from the query string, used only by
     `download-pdf`.
2. `src/routers/api/v1/index.ts` (`download-pdf`'s swagger block):
   - Added an operation-level `description` explaining the dual-auth
     mechanism (header OR query token), why (browser-navigated downloads
     can't set custom headers), that both paths hit the identical
     `verifyToken` checks (signature, blacklist, session-revocation), and
     the log/history exposure trade-off.
   - `security:` now lists `bearerAuth` AND `queryTokenAuth` as
     alternatives (OpenAPI's `security` array at the operation level is
     OR semantics — either one satisfies the requirement), replacing the
     previous `bearerAuth`-only listing that didn't actually reflect how
     `extractTokenWithSource` works.
   - **Real doc correction, not just elaboration**: the `token` query
     param's `required` flag was `true`, which is factually wrong — the
     real code (`extractTokenWithSource`) checks the `Authorization`
     header FIRST and only falls back to the query string, so `token` is
     only required when no header is sent. Changed to `required: false`
     with a description explaining the either/or.
3. `src/routers/api/v1/cv.route.ts` (`ats-check`'s swagger block): added a
   short `description` explicitly stating this endpoint does NOT accept a
   query token (header/cookie only), to prevent the two endpoints' auth
   being conflated — this was the operator's literal follow-on question
   shape ("explain the CV token", immediately after discussing both
   endpoints together).

## Independently verified (not just trusted from memory)
- Re-read `src/utils/helper-auth.ts`'s `extractTokenWithSource`: order is
  header → body → query → cookie. Confirms `queryTokenAuth` is correctly
  modeled as an alternative to `bearerAuth`, and confirms the `required:
  false` fix on the `token` param is correct (header takes priority, query
  is the fallback, not a separate mandatory field).
- Re-read `src/middlewares/verifyToken.middleware.ts`: confirmed
  `verifyTokenByQuery` is a bare alias of `verifyToken` (zero extra logic)
  — so the swagger doc's claim "both paths hit the identical verifyToken
  checks" is literally true, not an approximation.
- Re-read `src/routers/api/v1/index.ts`: confirmed `/cv` is mounted with
  plain `verifyToken` (not `verifyTokenByQuery`) — confirms `ats-check`
  genuinely has no query-token support, matching the new contrasting note.
- Generated the real OpenAPI spec at runtime (`ts-node` + `swaggerSpec`
  import, see Test run below) and inspected the actual JSON output rather
  than trusting the JSDoc comment syntax compiles to what was intended —
  `swagger-jsdoc` parsing errors fail silently (missing/malformed
  properties, not a parse exception), so this is the only reliable way to
  confirm the YAML-in-comments was written correctly.

## Test run (verbatim)
```
npm run build
> tsc && npm run copy
> cp -R ./src/views ./src/public ./dist/
```
Clean, no errors.

```
node -e "... require swagger.config, inspect swaggerSpec ..."
securitySchemes: [ 'bearerAuth', 'queryTokenAuth' ]
download-pdf security: [{"bearerAuth":[]},{"queryTokenAuth":[]}]
token param required: false
ats-check security: [{"bearerAuth":[]}]
ats-check description present: true
```
Confirms the generated spec has exactly the intended shape — both schemes
registered, `download-pdf` lists both as alternatives, the `token` param
correctly shows `required: false`, `ats-check` keeps `bearerAuth`-only and
carries its new contrasting description.

```
npm test
Test Suites: 35 passed, 35 total
Tests:       235 passed, 235 total
Snapshots:   0 total
Time:        11.604 s, estimated 18 s
Ran all test suites.
```
Unchanged from the pre-existing baseline (no test touches swagger JSDoc
content) — run anyway per `edit-verification.md`, since "it's just
comments" is exactly the kind of claim that should be checked, not
assumed.

## Scope confirmed
`git diff --stat`: 3 real files (`swagger.config.ts`, 2 route files) +
the diagram row, 47 insertions / 2 deletions. No `src/` logic changed —
confirmed by reading every touched line: all are JSDoc comment blocks or
a `securitySchemes`/`description` object literal, nothing in a function
body. No commit/push has happened yet.
