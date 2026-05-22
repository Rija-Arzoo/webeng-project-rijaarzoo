# Automated testing guide

| App | Tool | Location |
|-----|------|----------|
| Backend | Vitest | `Backend/tests/unit/` |
| Frontend | Playwright (e2e) | `Frontend/tests/e2e/` |

Playwright config and reports live **only** under `Frontend/` (`playwright.config.js`, `playwright-report/`, `test-results/`). All are gitignored.

## Run tests (from repo root)

```bash
npm run test:backend      # Vitest — Backend/
npm run test:frontend     # Vitest unit (if added later)
npm run test:e2e          # Playwright — Frontend/
npm run test              # Backend unit tests
```

Or from each app folder:

```bash
cd Backend && npm test
cd Frontend && npm run test:e2e
```

## First-time Playwright setup

```bash
cd Frontend
npm run test:e2e:install
```

View the HTML report:

```bash
cd Frontend
npx playwright show-report
```

## What is covered

| Type | Count | What it checks |
|------|-------|----------------|
| Unit | 4 | Mentor reorder helper, Gemini guard (no API key), auth middleware |
| E2E | 1 | Landing page → Sign In → login form visible |

E2E starts the Vite dev server on port 3000 automatically (`Frontend/playwright.config.js`).
