# CI/CD Pipeline Setup Guide — El Perri

This document explains the production-grade CI/CD pipeline for El Perri and how to configure it.

---

## What You Have Now

After running this setup, you'll have:

✅ **CLAUDE.md** — Rules of engagement for agentic updates
✅ **.gitignore** — Prevents committing secrets, node_modules, build artifacts
✅ **.env.example** — Template for environment variables
✅ **.github/workflows/ci.yml** — Automated build checks on every PR
✅ **.github/workflows/deploy.yml** — Automated deployment on merge to main
✅ **package.json scripts** — `npm run verify` for pre-commit checks

---

## Step-by-Step Setup

### Step 1: Enable GitHub Actions (if not already on GitHub)

1. Push this repo to GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: add CI/CD pipeline infrastructure"
   git remote add origin https://github.com/YOUR_USERNAME/el-perri.git
   git branch -M main
   git push -u origin main
   ```

2. GitHub Actions is enabled by default. Verify:
   - Go to **Settings → Actions → General**
   - Ensure "Allow all actions and reusable workflows" is selected

### Step 2: Configure Your Hosting Platform

Choose ONE hosting option and follow its setup instructions:

#### Option A: Vercel (Recommended for Next.js)

1. Go to https://vercel.com and sign up
2. Import your GitHub repo:
   - Click "Add New..." → "Project"
   - Select your GitHub repo
   - Vercel auto-detects Next.js configuration
   - Click "Deploy"
3. Get your deployment tokens:
   ```bash
   # From Vercel dashboard:
   # 1. Go to Settings → Tokens
   # 2. Create a new token (name: "GitHub Actions Deploy")
   # 3. Copy the token
   ```
4. Add secrets to GitHub:
   - Go to your repo → **Settings → Secrets and variables → Actions**
   - Click "New repository secret"
   - Add these:
     - `VERCEL_TOKEN` = (paste token from step 3)
     - `VERCEL_ORG_ID` = (from Vercel settings)
     - `VERCEL_PROJECT_ID` = (from Vercel project settings)
5. Uncomment Vercel section in `.github/workflows/deploy.yml`

#### Option B: Netlify

1. Go to https://netlify.com and sign up
2. Connect your GitHub repo:
   - Click "Import an existing project"
   - Select GitHub
   - Choose your repo
3. Get deployment credentials:
   - Go to **Settings → API**
   - Create a new access token (name: "GitHub Actions")
4. Add secrets to GitHub:
   - Go to your repo → **Settings → Secrets and variables → Actions**
   - Add these:
     - `NETLIFY_AUTH_TOKEN` = (paste token)
     - `NETLIFY_SITE_ID` = (from Netlify settings)
5. Uncomment Netlify section in `.github/workflows/deploy.yml`

#### Option C: Custom Server (SSH)

1. Generate SSH key pair (if you don't have one):
   ```bash
   ssh-keygen -t rsa -b 4096 -C "github-actions"
   # Don't set a passphrase, save as ~/.ssh/github_actions_key
   ```
2. Add public key to server:
   ```bash
   cat ~/.ssh/github_actions_key.pub | ssh user@host "cat >> ~/.ssh/authorized_keys"
   ```
3. Add secrets to GitHub:
   - Go to your repo → **Settings → Secrets and variables → Actions**
   - Add these:
     - `SSH_PRIVATE_KEY` = (contents of ~/.ssh/github_actions_key)
     - `SSH_HOST` = your server hostname
     - `SSH_USER` = deploy user
4. Uncomment SSH section in `.github/workflows/deploy.yml`
5. Update the deployment command in `deploy.yml` to match your setup

#### Option D: AWS S3 + CloudFront

1. Create S3 bucket and CloudFront distribution
2. Create IAM user for GitHub Actions:
   - Permissions: S3 put/delete on your bucket
   - Generate access key
3. Add secrets to GitHub:
   - `AWS_ACCESS_KEY_ID`
   - `AWS_SECRET_ACCESS_KEY`
4. Uncomment AWS section in `.github/workflows/deploy.yml`

### Step 3: Test the Pipeline

1. Create a test branch:
   ```bash
   git checkout -b test/ci-pipeline
   ```

2. Make a small change (e.g., add a comment to a file):
   ```bash
   echo "# Test CI/CD pipeline" >> README.md
   git add README.md
   git commit -m "test: verify CI/CD pipeline"
   git push origin test/ci-pipeline
   ```

3. Create a pull request on GitHub
   - Go to your repo → **Pull requests** → **New pull request**
   - Select `test/ci-pipeline` → `main`
   - GitHub Actions will automatically run (see **Actions** tab)
   - Wait for build to complete
   - If green ✅: pipeline works!

4. Merge the PR to main:
   - Click "Merge pull request"
   - GitHub Actions will run deploy workflow
   - Check **Actions** tab to confirm deployment succeeded

---

## How the Pipeline Works

### On Every Push (including PRs):

```
You push code to any branch
        ↓
GitHub Actions triggers ci.yml
        ↓
[ Build Check ]  — npm run build (catches syntax errors)
[ Security ]     — Detects hardcoded secrets
[ Lint ]         — (optional, when configured)
[ Test ]         — (optional, when configured)
        ↓
✅ All pass? → PR merge button enabled
❌ Any fail? → PR merge button disabled, shows error
```

### When You Merge to Main:

```
You merge PR to main
        ↓
GitHub Actions triggers deploy.yml
        ↓
[ Re-build ]     — npm run build (final verification)
[ Deploy ]       — Pushes to Vercel/Netlify/Custom server
        ↓
✅ Success → Site live at https://your-domain.com
❌ Fail → Deployment halted, rollback not triggered
```

---

## Adding Linting & Testing (Optional but Recommended)

### Add ESLint:

```bash
npm install --save-dev eslint eslint-config-next
npx eslint --init
```

Then update `package.json`:
```json
"lint": "eslint . --ext .js,.jsx --fix"
```

And uncomment in `.github/workflows/ci.yml`:
```yaml
- name: Lint
  run: npm run lint
```

### Add Jest Testing:

```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom
```

Create `jest.config.js`:
```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

Then update `package.json`:
```json
"test": "jest"
```

---

## Safety Protocol for Agentic Tools (Claude)

Before I (Claude) commit code and mark it "ready for production merge," I will:

### 1. Build Verification
```bash
npm run build
```
- Must complete with zero errors
- Must not have TypeScript/JSX syntax issues
- All imports must resolve

### 2. Manual Functionality Testing
```bash
npm run dev
# Visit http://localhost:3000 in browser
```
- Test every changed feature
- Test all unrelated pages to confirm no regression
- Check mobile responsiveness (375px width)
- Verify no console.log() errors in DevTools

### 3. Code Review Checklist
- [ ] No hardcoded secrets/credentials
- [ ] No unused imports or dead code
- [ ] Commit message follows format (feat:, fix:, etc.)
- [ ] Only relevant files changed
- [ ] Comments explain non-obvious logic
- [ ] CSS follows existing naming conventions

### 4. Security Check
- [ ] No API keys, tokens, or passwords hardcoded
- [ ] No console.log() in production code
- [ ] No risky dependencies added

### 5. Git Hygiene
- [ ] Working on feature branch (not main)
- [ ] Branch is up to date with main
- [ ] Commit message is descriptive

### Output Before Merge:
```
✅ PRE-MERGE VERIFICATION COMPLETE

Build:      PASS (npm run build)
Functionality: PASS (manual test at localhost:3000)
Security:   PASS (no secrets/logs detected)
Code Quality: PASS (follows conventions)
Git Hygiene: PASS (clean commits)

Status: READY FOR PRODUCTION MERGE
```

---

## Troubleshooting

### GitHub Actions shows red X (build failed)

1. Click the failed action → see error message
2. Common issues:
   - **Syntax error:** Check JSX/TypeScript syntax
   - **Missing import:** Install missing dependency
   - **Node version mismatch:** Ensure node-version in ci.yml matches your local

### Deployment succeeded but site didn't update

1. Check your hosting platform's dashboard
2. Vercel: Check deployment logs in dashboard
3. Custom server: SSH in and verify files were uploaded
4. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)

### I can't merge to main (button greyed out)

1. GitHub requires all CI checks to pass
2. Click the failed check to see why
3. Fix the issue locally, push again
4. Wait for Actions to re-run and pass

### Accidentally pushed to main

1. Don't panic! Revert the commit:
   ```bash
   git revert -m 1 <commit-hash>
   git push origin main
   ```
2. This pushes a "undo" commit, auto-deploys the revert
3. Then investigate locally and open a proper PR

---

## Next Steps

1. **Immediate:** Complete Step 1-2 above (choose hosting platform)
2. **Week 1:** Run test pipeline (Step 3)
3. **Week 2:** Add ESLint and Jest (optional but recommended)
4. **Ongoing:** Follow CLAUDE.md rules for all commits

---

## Quick Reference: Commands for Claude

### Before committing:
```bash
npm run verify        # Ensures build passes
npm run dev          # Manual test at http://localhost:3000
npm run lint         # (when configured)
npm run test         # (when configured)
git status           # Verify only relevant files changed
```

### Creating a feature branch:
```bash
git checkout -b feature/chatbot-improvements
# ... make changes ...
npm run verify
npm run dev
git add .
git commit -m "feat: add favorites to chatbot"
git push origin feature/chatbot-improvements
# → Open PR on GitHub
```

---

## Questions or Issues?

- **CI/CD Pipeline**: See this document
- **Rules of Engagement**: See CLAUDE.md
- **Code Style**: See app/globals.css and existing components
- **Deployment**: Check your hosting platform's docs (Vercel, Netlify, etc.)
