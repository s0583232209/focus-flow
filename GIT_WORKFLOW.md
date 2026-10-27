# GIT_WORKFLOW.md — כללי עבודה מול GitHub (FocusFlow, מטלות 3+4)

> **למי הקובץ:** לכל מפתח בצוות, ול-AI שעובד בשבילו (Cursor ו-Claude Code).
> **איפה הוא יושב:** בשורש הריפו. כך שני הכלים קוראים אותו אוטומטית:
> - **Claude Code** – קובץ `CLAUDE.md` בשורש הריפו מכיל את השורה `@GIT_WORKFLOW.md` (ייבוא).
> - **Cursor** – קובץ `.cursor/rules/git-workflow.mdc` עם `alwaysApply: true` שמפנה לקובץ הזה (`@GIT_WORKFLOW.md`).
>
> החלק שמתחת לקו כתוב באנגלית, כי הוא מיועד בעיקר לסוכני ה-AI, והם מצייתים לו בצורה מדויקת יותר באנגלית.

---

## 0. Golden rules (never break these)

1. **Never commit directly to `main`.** Every task is done on its own new branch.
2. **One task = one branch = one Pull Request.** Task IDs come from `TASKS.md` (T01, T02, …).
3. **Never merge, never force-push, never rewrite shared history.** The AI agent may create branches, commit and push its own task branch, and open a PR. Merging into `main` is done only by a human reviewer on GitHub.
4. **Never commit secrets.** No `.env`, passwords, Mongo URLs with credentials, JWT secrets, API keys, tokens or service-account JSON files. Only `.env.example` with placeholders.
5. **Every commit message explains how to test it.** A commit without a "How to test" section is not allowed.
6. **When unsure about any git operation that deletes or rewrites something — stop and ask the human.**

---

## 1. Starting a task

```bash
git checkout main
git pull --rebase origin main
git checkout -b <type>/T<NN>-<short-kebab-slug>
```

### Branch naming

| Type | When | Example |
| --- | --- | --- |
| `feat` | New feature or screen | `feat/T13-content-api` |
| `fix` | Bug fix | `fix/T19-delete-confirm` |
| `infra` | Docker, cloud, scripts, CI | `infra/T09-load-balancer` |
| `test` | Tests only | `test/T14-sessions-tests` |
| `docs` | Documentation, PROJECT_INFO | `docs/T29-project-info` |
| `chore` | Setup, dependencies, cleanup | `chore/T01-repo-skeleton` |

Rules: lowercase, kebab-case, max ~40 chars, always contains the task ID.

**Agent behavior:** before writing any code, check the current branch with `git branch --show-current`. If it is `main` or belongs to a different task, create the correct branch first. If there are uncommitted changes that are not yours, stop and ask.

---

## 2. Commits

### Size
- One logical change per commit (e.g. "add register route", then "add register tests").
- A task usually has 2–6 commits. Never one giant commit with everything.
- Code must run after every commit (no half-broken commits).

### Message format (Conventional Commits + test section)

```
<type>(<scope>): <imperative summary, max 72 chars>

What:
- <what changed, bullet per file/area>

Why:
- <reason / requirement from the assignment>

How to test:
1. <exact command or UI steps>
2. <...>
Expected: <what you should see>

Task: T<NN>
```

- `type`: feat | fix | infra | test | docs | chore | refactor
- `scope`: backend | frontend | model | docker | cloud | docs
- Summary in English, imperative ("add", not "added"), no period at the end.
- The body may be in English or Hebrew, but "How to test" must contain real, copy-pasteable steps.

### Example

```
feat(backend): add login route with failed-attempt limit

What:
- POST /api/auth/login returns access_token, token_type, expires_in
- login_attempts collection with 15-minute TTL index
- 5 failed attempts per email in 15 minutes -> 429

Why:
- Assignment 3 login requirement + "extra account security" bonus

How to test:
1. docker compose -f docker-compose.dev.yml up --build
2. Open http://localhost:8000/docs, register a user, then POST /api/auth/login
3. Send a wrong password 6 times
Expected: 200 with a token for the correct password; 401 {"message": ...} for a
wrong one; 429 on the 6th wrong attempt.
4. cd backend && pytest -q  -> all green

Task: T11
```

### Before every commit (agent must do this)

1. `git status` — make sure only files related to the task are changed.
2. `git diff --staged` — review the actual diff.
3. Secret check — the staged diff must not match any of:
   `mongodb+srv://.*:.*@`, `JWT_SECRET=.{8,}` (outside `.env.example`), `AIza`, `-----BEGIN`, `"private_key"`, `password\s*=\s*['"][^'"]+`.
   If anything matches: unstage it, tell the human, do not commit.
4. Run the relevant checks:
   - backend changed → `cd backend && pytest -q`
   - frontend changed → `cd frontend && npm run build`
   - Docker/compose changed → `docker compose -f docker-compose.dev.yml up --build` and check `/health`
5. Only then: `git add <specific files>` (never `git add -A` blindly) and commit with the format above.

---

## 3. Finishing a task — Pull Request

```bash
git fetch origin
git rebase origin/main          # resolve conflicts carefully, re-run the checks
git push -u origin <branch>
gh pr create --base main --title "T<NN>: <task title>" --body-file .github/pull_request_template.md
```

(If `gh` is not installed, push and give the human the GitHub "Compare & pull request" link.)

### PR description must contain
- **Task:** T<NN> + link/line from `TASKS.md`
- **What changed** (short bullets)
- **How to test** (the full flow, combining all commits)
- **Screenshots** for any UI change
- **Checklist:**
  - [ ] Branch is up to date with `main`
  - [ ] Tests / build pass locally
  - [ ] `docker compose -f docker-compose.dev.yml up --build` works
  - [ ] No secrets, no `.env`, no `node_modules` in the diff
  - [ ] "Definition of done" from TASKS.md is met

### Review and merge (humans only)
- Another team member reviews and runs "How to test".
- Merge with **Squash and merge**; the squash title = `T<NN>: <task title>`.
- Delete the branch after merge.
- After a merge, everyone runs `git checkout main && git pull --rebase`.

---

## 4. Conflicts and mistakes

- **Conflict during rebase:** resolve file by file, keep both sides' intent, re-run tests, `git rebase --continue`. If the conflict is in someone else's area (backend vs frontend), ask them before choosing.
- **Committed a secret by mistake:** do NOT just delete it in a new commit. Stop, tell the team, **rotate the secret immediately** (new Atlas password / new JWT secret / new key in Secret Manager), then clean history with the team lead.
- **Wrong branch:** `git stash`, `git checkout -b <correct-branch>`, `git stash pop`. Never cherry-pick onto `main`.
- **Forbidden for the agent without explicit human approval:** `git push --force`, `git reset --hard` on shared branches, `git rebase` of `main`, deleting remote branches, `git clean -fdx`.

---

## 5. What is (and is not) in the repo

| Commit it | Never commit it |
| --- | --- |
| Source code, Dockerfiles, compose files | `.env`, any real secret |
| `.env.example` with placeholders | `node_modules/`, `dist/`, `__pycache__/`, `.venv/` |
| Model files in `frontend/public/models/` (needed inside the image) | `submission/*.zip`, recordings, personal test videos |
| Scripts in `scripts/` (no secrets inside) | Service-account keys (`*.json` from GCP) |
| `PROJECT_INFO.docx` drafts in `docs/` | Database dumps with real users |

---

## 6. GitHub settings (team lead, once)

- Settings → Branches → Branch protection for `main`: require a pull request, require 1 approval, block force pushes and deletions.
- Settings → Secret scanning / push protection: enable if available.
- Add `.github/pull_request_template.md` with the PR checklist from section 3.
