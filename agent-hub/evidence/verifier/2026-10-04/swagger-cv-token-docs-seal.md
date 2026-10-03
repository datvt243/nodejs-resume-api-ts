# 2026-10-04 — swagger-cv-token-docs (verifier note)

## Isolation proof
Spawned fresh via the Agent tool with only this task description — no memory of any implementation session.

## Re-run
full — independently re-ran `npm run build`, `npm test`, and OpenAPI spec
generation from scratch, given this touches a shared config file
(`swagger.config.ts`) and two route files, per the recipe's own
"Re-run scope" guidance.

## Verdict: SEAL

## What I independently confirmed

1. **Diagram row**: `swagger-cv-token-docs` found on
   `agent-hub/haven/diagrams/dev-loop.prime-mermaid.md`, was PENDING,
   scope description matched the evidence note.

2. **Real mechanism, read from source (not trusted from the note's prose)**:
   - `src/utils/helper-auth.ts` `extractTokenWithSource`: lookup order is
     header → body → query → cookie. Confirms `token` query param should be
     (and now is) `required: false` — only a fallback when no header is sent.
   - `src/middlewares/verifyToken.middleware.ts`: `verifyTokenByQuery` (lines
     79-82) is a bare pass-through to `verifyToken`, zero extra logic.
     Confirms "exact same checks" claim is literally true.
   - `src/routers/api/v1/index.ts` line 37: `router.use('/cv', verifyToken,
     routeCv)` uses plain `verifyToken`, not `verifyTokenByQuery` — confirms
     `ats-check`'s new "no query token" note is accurate.

3. **Diff read line-by-line** (`git diff staging -- src/config/swagger.config.ts
   src/routers/api/v1/index.ts src/routers/api/v1/cv.route.ts`):
   - New `queryTokenAuth` scheme: `type: 'apiKey'`, `in: 'query'`,
     `name: 'token'` — well-formed.
   - `download-pdf`'s `security:` now lists both `bearerAuth` and
     `queryTokenAuth`.
   - `download-pdf`'s `token` param changed `required: true` → `required: false`.
   - `ats-check` gained a new `description` field, content matches the
     router-mounting fact confirmed in step 2.
   - Every changed line sits inside a JSDoc comment block or the
     `securitySchemes` object literal — no function/logic line touched.

4. **Regenerated the real OpenAPI spec myself** (`ts-node` + `tsconfig-paths`
   + direct `swaggerSpec` import, not copy-pasting the note's numbers):
   ```
   SECURITY SCHEMES: ["bearerAuth","queryTokenAuth"]
   download-pdf security: [{"bearerAuth":[]},{"queryTokenAuth":[]}]
   download-pdf token param: required:false
   ats-check security: [{"bearerAuth":[]}]
   ats-check description present: true
   ```
   Matches the note's claims exactly, with full description text also
   inspected (not just presence/booleans).

5. **Full re-run**:
   - `npm run build` → clean, `tsc` + copy succeeded, no errors.
   - `npm test` → `Test Suites: 35 passed, 35 total`, `Tests: 235 passed,
     235 total`. Exact match to the note's claimed baseline.

6. **Scope** (`git status --short`): exactly the 3 claimed files modified
   (`src/config/swagger.config.ts`, `src/routers/api/v1/index.ts`,
   `src/routers/api/v1/cv.route.ts`) + the diagram row + the new evidence
   note. Nothing else touched.

7. **Forbidden states**: none triggered.
   - `ADHOC_WORK`: no — node pre-existed on diagram (as PENDING).
   - `NO_EVIDENCE`: no — implementer note present and complete.
   - `EDIT_UNVERIFIED`: no — every claim independently re-derived above,
     not trusted from the note.
   - `CODE_IN_HAVEN`: no — only the diagram `.md` row changed in `haven/`.
   - `DIAGRAM_DRIFT`: no — row updated PENDING → SEALED in place in this
     pass, matching the actual (doc-only) diff.

No commit/push performed.
