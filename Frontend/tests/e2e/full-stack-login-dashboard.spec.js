import { test, expect } from '@playwright/test';

const API = 'http://127.0.0.1:5000/api';
const password = 'TestPass123!';

function buildTestUser() {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const nextYear = new Date().getFullYear() + 1;
  return {
    name: 'E2E Test Student',
    email: `e2e.student.${id}@university.edu`,
    password,
    role: 'student',
    university: 'Test University',
    department: 'Computer Science',
    degreeLevel: 'BS',
    studentId: `STU-${id}`,
    batchYear: nextYear,
    securityQuestions: [
      { question: 'What is the name of your first school?', answer: 'Greenwood' },
      { question: 'What is your best friend’s first name?', answer: 'Alex' },
    ],
  };
}

test.describe('Full stack (frontend + API + database)', () => {
  let testUser;

  test.beforeAll(async ({ request }) => {
    testUser = buildTestUser();

    const registerRes = await request.post(`${API}/auth/register`, { data: testUser });
    if (!registerRes.ok()) {
      const body = await registerRes.text();
      test.skip(
        true,
        `MongoDB/API not ready (${registerRes.status()}): ${body}. Start MongoDB on 127.0.0.1:27017 or set MONGODB_URI.`,
      );
    }

    const loginRes = await request.post(`${API}/auth/login`, {
      data: { email: testUser.email, password: testUser.password },
    });
    expect(loginRes.ok(), await loginRes.text()).toBeTruthy();
    const loginBody = await loginRes.json();
    expect(loginBody.token).toBeTruthy();
  });

  test('user can sign in through the UI and load dashboard data from the API', async ({ page }) => {
    await page.goto('/login');

    await page.getByPlaceholder('you@university.edu').fill(testUser.email);
    await page.getByPlaceholder('••••••••').fill(testUser.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15_000 });
    await expect(page.getByRole('heading', { name: /good to see you, e2e/i })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('heading', { name: /mentorship requests/i })).toBeVisible();
  });
});
