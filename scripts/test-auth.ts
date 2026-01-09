/**
 * DishRank Test Authentication Script
 *
 * This script authenticates a test user and provides the session token
 * that can be injected into the browser for automated testing.
 *
 * Setup:
 * 1. Create a test user in Supabase Dashboard > Authentication > Users
 * 2. Set a password for the test user
 * 3. Set environment variables:
 *    - DISHRANK_TEST_EMAIL
 *    - DISHRANK_TEST_PASSWORD
 *    - VITE_SUPABASE_URL
 *    - VITE_SUPABASE_ANON_KEY
 *
 * Usage:
 *   npx tsx scripts/test-auth.ts
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.DISHRANK_TEST_EMAIL;
const TEST_PASSWORD = process.env.DISHRANK_TEST_PASSWORD;

async function getTestSession() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
    process.exit(1);
  }

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.error("Missing DISHRANK_TEST_EMAIL or DISHRANK_TEST_PASSWORD");
    process.exit(1);
  }

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
    },
    body: JSON.stringify({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    }),
  });

  const data = await response.json();

  if (data.error) {
    console.error("Auth error:", data.error_description || data.error);
    process.exit(1);
  }

  console.log("Session obtained successfully!");
  console.log("\nUse this in browser automation:");
  console.log(`
localStorage.setItem('sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token', JSON.stringify(${JSON.stringify({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    expires_in: data.expires_in,
    token_type: data.token_type,
    user: data.user,
  }, null, 2)}));
`);

  return data;
}

getTestSession();
