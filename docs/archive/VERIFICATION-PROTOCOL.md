# Pre-Merge Verification Protocol — Claude's Safety Checklist

**Purpose:** This document defines the exact steps Claude (agentic tools) must execute before signaling "ready for production merge."

**Non-negotiable:** This protocol is law. Do not skip steps. If any step fails, STOP and report the issue.

---

## Phase 1: Build Verification (5 min)

### Step 1.1: Clean build test
```bash
npm run build
```

**Success criteria:**
- ✅ Process completes with exit code 0
- ✅ No error messages in output
- ✅ `.next/` build directory is created
- ✅ No TypeScript compilation errors
- ✅ No JSX syntax errors
- ✅ All imports resolve

**Failure protocol:**
- If build fails: READ the error message carefully
- Fix the issue (usually: import missing, typo, syntax error)
- Re-run `npm run build`
- Do NOT proceed until build passes

### Step 1.2: Verify no console.log() left behind
```bash
grep -r "console\.log" app/ --include="*.jsx" --include="*.js"
```

**Success criteria:**
- ✅ No output (no console.log found)

**Failure protocol:**
- If any console.log found: Remove it
- Search for "DEBUG", "TEMP", "TODO" and evaluate if they should be kept
- Re-run grep
- Do NOT proceed until clean

### Step 1.3: Verify no hardcoded secrets
```bash
grep -r -i "password\|api_key\|secret\|token" app/ --include="*.jsx" --include="*.js" | grep -v "// "
```

**Success criteria:**
- ✅ No output OR only commented-out examples

**Failure protocol:**
- If secrets found: Move to .env.local immediately
- Update .env.example if new var added
- Remove from code
- Do NOT proceed until clean

**Result:**
```
✅ BUILD PHASE PASSED
- npm run build: SUCCESS
- console.log: CLEAN
- Secrets: CLEAN
```

---

## Phase 2: Functional Testing (15 min)

### Step 2.1: Start dev server
```bash
npm run dev
```

Wait for output: `ready - started server on 0.0.0.0:3000, url: http://localhost:3000`

### Step 2.2: Full site smoke test

Visit each page in browser at `http://localhost:3000`:

#### Home page (/)
- [ ] Page loads without errors
- [ ] Hero section visible
- [ ] Gallery images load (or show gradient placeholders)
- [ ] Navigation works (click menu items)
- [ ] Order Assistant button ("¿Qué pido?") appears in bottom right
- [ ] No console errors (F12 → Console tab)

#### Menu page (/menu)
- [ ] Page loads
- [ ] All menu sections visible
- [ ] Scroll is smooth
- [ ] No layout shift or broken styling
- [ ] No console errors

#### Catering page (/catering)
- [ ] Page loads
- [ ] Form visible
- [ ] No console errors

#### Historia page (/nuestra-historia)
- [ ] Page loads
- [ ] Video visible (or poster image)
- [ ] No console errors

### Step 2.3: Test modified features specifically

**If you modified OrderAssistant.jsx:**
- [ ] Chatbot opens (click "¿Qué pido?")
- [ ] First question appears
- [ ] Click an option → next question appears
- [ ] Conversation flows without errors
- [ ] Recommendations appear at end
- [ ] Heart button (favorites) works
- [ ] Favorites counter updates
- [ ] "Ver menú" button links to /menu
- [ ] "Empezar de nuevo" restarts conversation
- [ ] Click favorites button → shows favorites view
- [ ] All animations are smooth (no jank)
- [ ] Typing indicator appears (animated dots)
- [ ] No console errors

**If you modified globals.css:**
- [ ] All colors correct
- [ ] Spacing consistent
- [ ] Hover states work on buttons
- [ ] No text is unreadable
- [ ] No broken layouts

**If you modified site.config.js:**
- [ ] All menu items render
- [ ] Prices display correctly
- [ ] Hours display correctly
- [ ] Contact info displays correctly

### Step 2.4: Mobile responsiveness test

Resize browser to **375px width** (mobile):

- [ ] Navigation hamburger menu works
- [ ] No horizontal scroll
- [ ] Text is readable
- [ ] Buttons are tappable (min 44px)
- [ ] Images scale correctly
- [ ] Chatbot panel fits on screen
- [ ] No layout breaks

**Check each modified page at mobile size.**

### Step 2.5: Console & Network check

Open **DevTools** (F12 or Cmd+Option+I):

- [ ] Console tab: No red errors (warnings OK)
- [ ] Network tab: No failed requests (404, 500)
- [ ] All CSS, JS, images loaded successfully
- [ ] Page load time reasonable (< 3 sec)

**Result:**
```
✅ FUNCTIONAL TESTING PASSED
- All pages load without errors
- Modified features work as intended
- Mobile view functional
- Console clean (no errors)
- No regressions detected
```

---

## Phase 3: Code Quality Review (10 min)

### Step 3.1: Check modified files for code quality

For each file you modified, verify:

**Syntax & Format:**
- [ ] No trailing whitespace
- [ ] Consistent indentation (2 spaces)
- [ ] No unused imports
- [ ] No dead code (commented-out sections)
- [ ] Imports are in logical order (React, libs, local)

**Naming Conventions:**
- [ ] Functions/components are named clearly (PascalCase for components)
- [ ] Variables use camelCase
- [ ] CSS classes follow existing conventions
- [ ] No single-letter variables (except loop counters i, j)

**Comments:**
- [ ] Confusing logic has explanatory comments
- [ ] TODO/FIXME comments have context
- [ ] JSDoc headers on exported functions/components
- [ ] No over-commented obvious code

**Example of good comment:**
```jsx
/**
 * OrderAssistant — Interactive menu guidance chatbot.
 * Uses conversational flow to understand user preferences,
 * then recommends dishes. State persists in session only.
 */
export function OrderAssistant() {
```

**Example of bad comment:**
```jsx
// Set answer (UNNECESSARY)
const na = { ...answers, [key]: option.value };
```

### Step 3.2: Check git diff for unintended changes

```bash
git diff main
```

Verify:
- [ ] Only relevant files changed
- [ ] No accidental deletions
- [ ] No reformatting of unrelated code
- [ ] No changes to package-lock.json (unless dependencies actually changed)

**Failure protocol:**
- If you see unintended changes: `git reset <file>`
- Or manually revert in your editor
- Re-run diff to confirm

**Result:**
```
✅ CODE QUALITY PASSED
- Syntax & format: CLEAN
- Naming conventions: FOLLOWED
- Comments where needed: YES
- Git diff: ONLY RELEVANT CHANGES
```

---

## Phase 4: Git Hygiene (5 min)

### Step 4.1: Verify commit message

```bash
git log --oneline -1
```

**Requirement:** Commit message matches format:
```
[TYPE] Short description

Longer explanation (optional)
```

**Types:** `feat:`, `fix:`, `refactor:`, `style:`, `docs:`, `chore:`

**Example GOOD:**
```
feat: add favorites to order assistant chatbot

- Users can heart items to save them
- Favorites persist in session state
- Added heart button + counter to UI
- Improved typing indicator animations
```

**Example BAD:**
```
updated stuff
asdf
work in progress
```

### Step 4.2: Verify branch name

```bash
git branch --show-current
```

**Must match pattern:**
- `feature/*` for features
- `fix/*` for bug fixes
- `chore/*` for maintenance
- `docs/*` for documentation

**Not allowed:**
- `main` or `master` (you should NOT be working here)
- Random names like `work`, `temp`, `asdf`

### Step 4.3: Verify branch is up to date with main

```bash
git fetch origin
git log main..HEAD --oneline
```

**Success criteria:**
- Should show only YOUR commits
- Should NOT show any commits from main that you're missing

**If behind:**
```bash
git rebase origin/main
git push origin feature/your-branch --force-with-lease
```

**Result:**
```
✅ GIT HYGIENE PASSED
- Commit message: DESCRIPTIVE & FORMATTED
- Branch name: FOLLOWS CONVENTION
- Branch status: UP TO DATE with main
```

---

## Phase 5: Security Audit (5 min)

### Step 5.1: No environment variable leaks

Check for hardcoded values that should be in .env:
```bash
grep -r "localhost\|127.0.0.1\|192.168\|api_key\|password\|secret" app/ --include="*.jsx" --include="*.js" | grep -v node_modules
```

**Failure protocol:**
- Any hardcoded env-dependent values? Move to .env.local
- Update .env.example
- Remove from code

### Step 5.2: Check dependencies for known vulnerabilities (optional)

```bash
npm audit
```

**If vulnerabilities found:**
- Run `npm audit fix`
- If not fixable: document why you kept the vulnerable dep
- Do NOT ignore this step

**Result:**
```
✅ SECURITY PASSED
- No hardcoded secrets
- No env leaks
- npm audit: OK (or documented)
```

---

## Phase 6: Final Sign-Off

### Consolidate all results:

```
════════════════════════════════════════════
 ✅ PRE-MERGE VERIFICATION COMPLETE
════════════════════════════════════════════

Build Phase:        PASS ✅
- npm run build:    SUCCESS
- console.log:      CLEAN
- Secrets:          NO HARDCODING

Functional Phase:   PASS ✅
- All pages:        LOAD OK
- Modified features: WORK
- Mobile:           RESPONSIVE
- Console:          CLEAN

Code Quality:       PASS ✅
- Syntax/format:    GOOD
- Conventions:      FOLLOWED
- Comments:         PRESENT
- Git diff:         CLEAN

Git Hygiene:        PASS ✅
- Commit message:   DESCRIPTIVE
- Branch name:      VALID
- Up to date:       YES

Security:           PASS ✅
- No secrets:       CONFIRMED
- No env leaks:     CONFIRMED
- Dependencies:     SAFE

════════════════════════════════════════════
STATUS: ✅ READY FOR PRODUCTION MERGE
════════════════════════════════════════════

Branch: feature/chatbot-improvements
Commits: 3 (feat: add favorites, fix: typing indicator, docs: update)
Files changed: 2 (OrderAssistant.jsx, globals.css)

Next: Open/update PR on GitHub → request review → merge to main
```

---

## Failure Exit Criteria

If ANY of the following occur, STOP and report the issue:

1. **Build fails** → DO NOT PROCEED. Fix and re-test.
2. **Console errors appear** → DO NOT PROCEED. Debug locally.
3. **Security concerns** → ESCALATE. Do not merge.
4. **Code quality issues** → FIX. Do not merge broken code.
5. **Git is messy** → CLEAN. Rebase, clean up commits.

**When stopping:** Report the exact failure, what you tried, and ask for guidance.

Example:
```
❌ VERIFICATION FAILED

Phase: Functional Testing
Issue: Order Assistant chatbot crashes on first question selection
Error: "TypeError: Cannot read property 'text' of undefined"
File: app/components/OrderAssistant.jsx, line 185

Steps tried:
- Restarted dev server
- Checked getQuestion() return value
- Looks like messages state not updating correctly

Need guidance before proceeding.
```

---

## When Everything Passes

Output the final sign-off message (see Phase 6 above), then:

1. **Create or update PR on GitHub** (if not already done)
2. **Request review** (if human review required)
3. **Merge to main** (GitHub Actions will auto-deploy)
4. **Monitor deployment** in GitHub Actions tab for success

---

## Emergency Rollback

If production breaks immediately after deploy:

1. **Do NOT panic**
2. Revert the commit:
   ```bash
   git revert -m 1 <commit-hash>
   git push origin main
   ```
3. GitHub Actions will auto-deploy the revert (within 2 min)
4. Site returns to previous state
5. Then investigate locally what went wrong

---

**This protocol is not optional. Every merge must pass all phases.**

Last updated: 2026-06-23
