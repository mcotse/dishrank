/**
 * Browser Test Helper for DishRank
 *
 * Provides functions to authenticate and test the app using the dev-browser skill.
 *
 * Setup:
 * 1. Create a test user in Supabase with password auth
 * 2. Create .env.test with:
 *    VITE_SUPABASE_URL=your-url
 *    VITE_SUPABASE_ANON_KEY=your-key
 *    DISHRANK_TEST_EMAIL=test@example.com
 *    DISHRANK_TEST_PASSWORD=your-password
 *
 * Usage from dev-browser skill:
 *   import { authenticateAndTest } from './browser-test-helper.js';
 *   await authenticateAndTest();
 */

const BASE_URL = "https://mcotse.github.io/dishrank";

// Get these from environment or hardcode for testing
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const TEST_EMAIL = process.env.DISHRANK_TEST_EMAIL || "";
const TEST_PASSWORD = process.env.DISHRANK_TEST_PASSWORD || "";

/**
 * Get a session token from Supabase using password auth
 */
export async function getSupabaseSession(email: string, password: string) {
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error_description || data.error);
  }

  return data;
}

/**
 * Get the localStorage key for Supabase auth
 */
export function getSupabaseStorageKey() {
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

/**
 * Format session data for localStorage
 */
export function formatSessionForStorage(session: any) {
  return JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });
}

/**
 * Example usage with Playwright page
 */
export async function injectAuthSession(page: any) {
  // Get session from Supabase
  const session = await getSupabaseSession(TEST_EMAIL, TEST_PASSWORD);
  const storageKey = getSupabaseStorageKey();
  const sessionData = formatSessionForStorage(session);

  // Inject into page localStorage
  await page.evaluate(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
    },
    { key: storageKey, value: sessionData }
  );

  return session;
}

// Export config for use in scripts
export const config = {
  BASE_URL,
  SUPABASE_URL,
  SUPABASE_KEY,
  TEST_EMAIL,
  TEST_PASSWORD,
};
