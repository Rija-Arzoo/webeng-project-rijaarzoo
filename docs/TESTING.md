# Automated testing guide

This project uses **Vitest** for unit tests and **Playwright** for end-to-end (E2E) tests.

## What is covered today

| Type | Count | What it checks |
|------|-------|----------------|
| Unit | 4 | Mentor reorder helper, Gemini guard (no API key), auth middleware (no token / valid token) |
| E2E | 1 | Landing page → Sign In → login form visible |

## Run tests

From the project root:

```bash
# Unit tests only
npm run test:unit

# E2E (starts Vite on port 3000 automatically)
npm run test:e2e

# Both
npm run test
```

First-time E2E setup (downloads Chromium):

```bash
npx playwright install chromium
```

Open the last E2E HTML report:

```bash
npx playwright show-report
```

## File layout

```
tests/
  unit/
    geminiMentorRank.test.js   # 2 unit tests
    authMiddleware.test.js     # 2 unit tests
  e2e/
    landing-to-login.spec.js   # 1 E2E test
playwright.config.js
```

## What you should add next (recommended)

1. **API integration tests** – Supertest against Express routes (`/api/auth/login`, `/api/health`) with an in-memory or test MongoDB.
2. **Component tests** – React Testing Library for `Login`, `Profile` (success message), `Layout` sidebar.
3. **More E2E flows** – Register → login → save profile (use a test user + test database).
4. **CI pipeline** – GitHub Actions: `npm run test:unit` on every push; E2E on PRs with `CI=true`.
5. **Coverage** – `vitest --coverage` and aim for critical paths (auth, requests, profile update).

## E2E notes

- The app uses **HashRouter**, so URLs look like `http://localhost:3000/#/login`.
- E2E does **not** need MongoDB for the current test (public landing + login UI only).
- Login/dashboard E2E will need the **backend running** and a **test account** in the database.

## Environment

Unit tests do not call Gemini or MongoDB. E2E only needs the Vite dev server (started by Playwright).
