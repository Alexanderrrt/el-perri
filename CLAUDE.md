# CLAUDE.md — Rules of Engagement for El Perri

**Purpose:** This document defines the contract between humans and agentic tools (like Claude) for maintaining code quality, safety, and deployment readiness in the El Perri project.

---

## 1. Branching & Commit Strategy

### Rule 1.1: Never commit directly to `main`
- **Why:** `main` is production. Direct commits bypass safety gates.
- **How to apply:** 
  - Always create a feature branch: `git checkout -b feature/chatbot-improvements`
  - Branch naming: `feature/<description>`, `fix/<bug-name>`, `chore/<task>`, `docs/<doc-name>`
  - Push to your branch, create a pull request (PR), request review

### Rule 1.2: One logical unit per PR
- **Why:** Smaller PRs are reviewed faster, easier to revert if needed.
- **How to apply:**
  - One feature or one fix per PR
  - Related UI improvements can be batched (e.g., chatbot animations + favorites together)
  - Unrelated changes → separate PRs

### Rule 1.3: Descriptive commit messages
- **Why:** Git history is a changelog. Future developers (and you) need clarity.
- **Format:**
  ```
  [TYPE] Short description (50 chars max)

  Longer explanation if needed (wrap at 72 chars).
  Mention: what changed, why, and any gotchas.

  Closes #123  (if fixing an issue)
  ```
- **Types:** `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`
- **Example:**
  ```
  feat: add favorites to order assistant chatbot

  - Users can now heart items to save them
  - Favorites persist in session state
  - Added heart button to recommendation cards
  - Updated CSS for hover and active states

  Closes #15
  ```

---

## 2. Before Committing: Local Safety Checks

### Rule 2.1: Code format check
```bash
npm run build    # Ensure no build errors
```
- **Why:** Catches syntax errors, missing imports, type mismatches early.
- **Required before:** Any commit involving `.jsx`, `.js`, `.css` changes.

### Rule 2.2: No console.log() in production code
- **Why:** Clutters prod logs, reveals debug info.
- **Exception:** Structured logging for errors (if added later).
- **Check:** Search codebase before commit.

### Rule 2.3: No hardcoded secrets, API keys, or credentials
- **Why:** Security risk. These belong in `.env.local` (gitignored).
- **Check:** Review your changes for any `password`, `token`, `key`, `secret`.

### Rule 2.4: Verify your changes don't break existing features
- **How:**
  ```bash
  npm run dev     # Start local dev server
  # Manually test: visit http://localhost:3000 and check all pages
  ```
- **Required before:** Publishing a PR.

---

## 3. Code Quality Standards

### Rule 3.1: Component documentation
- **Why:** Future devs (or agentic tools) need to understand intent.
- **For React components:** Add a JSDoc comment at the top:
  ```jsx
  /**
   * OrderAssistant — Interactive chatbot for menu guidance.
   * Asks clarifying questions about preferences, then recommends dishes.
   * 
   * Features: conversation history, favorites (heart button), typing indicator.
   * State persists in session only (no backend required).
   */
  export function OrderAssistant() { ... }
  ```

### Rule 3.2: CSS follows BEM naming convention where new styles added
- **Why:** Scopes styles, prevents naming collisions.
- **Pattern:** `.block__element--modifier`
- **Example:** `.assistant-rec__heart--active`
- **Note:** Existing code may not follow this; only enforce for new additions.

### Rule 3.3: No unused imports or dead code
- **Why:** Confuses readers, bloats bundle.
- **Check:** Remove before commit.

---

## 4. Testing & Verification (Pre-Merge)

### Rule 4.1: Agentic tools must run full verification before marking "ready to merge"
This is YOUR safety protocol. Run these before flagging a PR as ready:

```bash
# 1. Build verification (catches syntax/type errors)
npm run build

# 2. Manual functionality check (at minimum)
npm run dev
# — Visit http://localhost:3000
# — Test all modified features (not just the ones you changed)
# — Check responsive design on mobile view
# — Verify no console errors in DevTools

# 3. Code review checklist (see section 4.2)
```

### Rule 4.2: Pre-Merge Verification Checklist (for Claude/agentic tools)

Before you signal "ready for production merge," verify ALL of:

#### Syntax & Build
- [ ] `npm run build` succeeds with no errors
- [ ] No TypeScript/JSX syntax errors
- [ ] All imports resolve correctly
- [ ] No unused variables or imports left behind

#### Functionality
- [ ] Feature works as intended (manually tested in dev)
- [ ] No regression in other pages (click through home, menu, catering, history)
- [ ] Mobile view works (test at 375px width)
- [ ] Chatbot: conversation flows without errors
- [ ] Chatbot: favorites heart button works
- [ ] Chatbot: animations are smooth (no jank)

#### Security
- [ ] No hardcoded secrets, API keys, credentials
- [ ] No console.log() left in production code
- [ ] No security vulnerabilities introduced

#### Code Quality
- [ ] Comments added where logic is non-obvious
- [ ] Changed files follow existing style conventions
- [ ] No dead code or commented-out sections

#### Git Hygiene
- [ ] Commit message is descriptive and follows format
- [ ] Only relevant files changed (no accidental commits)
- [ ] Branch is up to date with `main` (no merge conflicts)

**Output Template:**
```
✅ Pre-merge verification complete:
- Build: PASS
- Functionality: PASS
- Security: PASS
- Code quality: PASS
- Git hygiene: PASS

Status: Ready for production merge
```

---

## 5. Deployment Pipeline (GitHub Actions)

### Rule 5.1: Automated checks before merge
When you push to a feature branch, GitHub Actions automatically runs:
1. **Build** — `npm run build` (catches errors)
2. **Lint** — ESLint (code quality, if added)
3. **Security** — Checks for hardcoded secrets (if added)

All must pass before merge button is available.

### Rule 5.2: Deployment to production
When you merge to `main`, GitHub Actions automatically:
1. Runs build & verification again
2. Deploys to Vercel (or your hosting)
3. Sends confirmation to channel (if configured)

**No manual deploy commands.** GitHub Actions handles it.

### Rule 5.3: Rollback procedure
If production breaks:
1. Revert the merge commit: `git revert -m 1 <commit-hash>`
2. Push to `main` (auto-deploys the revert)
3. Investigate locally, fix, open new PR

---

## 6. For Agentic Tools (You!)

### Rule 6.1: Always disclose what you're changing
Before you start editing:
- List the files you'll modify
- Explain the why (business logic, bug fix, improvement)
- Estimate risk (low/medium/high)

**Example:**
```
Updating Order Assistant:
- Modified: app/components/OrderAssistant.jsx
- Modified: app/globals.css
- Reason: Add favorites feature, improve animations
- Risk: Low (isolated to chatbot, no API changes)
```

### Rule 6.2: Commit your changes in logical batches
- One commit per clear logical unit
- Don't squash unrelated changes together
- Example: separate commits for component logic, CSS, docs

### Rule 6.3: Never force-push to shared branches
- **Why:** Corrupts history for other team members.
- **Exception:** Only to your own feature branch (if in progress).

### Rule 6.4: If anything feels risky, stop and escalate
- Uncertain about a change? Ask first.
- Examples: Database changes, dependency updates, auth modifications.
- Better to be cautious than to break production.

---

## 7. Environment Variables & Secrets

### Rule 7.1: Use `.env.local` for local development
- Never commit `.env.local` to git
- Check `.gitignore` includes `.env.local`
- Use `.env.example` as template

### Rule 7.2: Production secrets go in GitHub Secrets
- Navigate to: **Settings → Secrets and variables → Actions**
- Store sensitive vars there (API keys, DB passwords, etc.)
- GitHub Actions can access them securely

### Rule 7.3: Document all required environment variables
- Update `.env.example` when you add a new var
- Include description: what it's for, example value

---

## 8. Documentation Updates

### Rule 8.1: Update README.md if you change how to run/deploy the project
- **Examples:** New build step, new env var, new dependency

### Rule 8.2: Update CLAUDE.md if rules change
- This document is living. Adapt it as you learn what works.
- Example: "We added linting, so add `npm run lint` to pre-merge checks"

---

## 9. Quick Reference: What To Do Before Pushing

```bash
# 1. Create feature branch
git checkout -b feature/your-feature

# 2. Make your changes, test locally
npm run dev
# (manually verify in browser)

# 3. Verify it builds
npm run build

# 4. Check for leftover debug code
git diff  # scan for console.log, hardcoded secrets, etc.

# 5. Commit with descriptive message
git add .
git commit -m "feat: add your feature description"

# 6. Push to your branch
git push origin feature/your-feature

# 7. Open PR on GitHub, request review
```

---

## 10. Escalation & Questions

**If you're unsure:**
- Agentic tools: Stop, describe the uncertainty, wait for clarification.
- Humans: Open an issue or discussion on GitHub.

**Suspected security issue:**
- Do not merge. Escalate immediately.

---

## Changelog (This Document)

- **2026-06-23** (v1.0): Initial rules for chatbot improvement pipeline. Next steps: add ESLint config and test framework per Rule 4.1.

---

**TL;DR for Agentic Tools:**
1. Branch → Feature → PR (never `main` directly)
2. `npm run build` succeeds
3. Manual test in dev
4. Review checklist in §4.2
5. Commit with clear message
6. GitHub Actions handles deploy
7. If risky → ask first
