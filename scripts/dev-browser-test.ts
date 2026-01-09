/**
 * DishRank Browser Automation Test
 *
 * This script demonstrates how to use the dev-browser skill
 * to test DishRank with an authenticated session.
 *
 * Prerequisites:
 * 1. Create a test user in Supabase Dashboard > Authentication > Users
 * 2. Set environment variables:
 *    - VITE_SUPABASE_URL
 *    - VITE_SUPABASE_ANON_KEY
 *    - DISHRANK_TEST_EMAIL
 *    - DISHRANK_TEST_PASSWORD
 * 3. Start the dev-browser server
 *
 * Usage (from dev-browser skill directory):
 *   cd skills/dev-browser
 *   npx tsx /path/to/dish_rank/scripts/dev-browser-test.ts
 */

const BASE_URL = "https://mcotse.github.io/dishrank";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const TEST_EMAIL = process.env.DISHRANK_TEST_EMAIL || "";
const TEST_PASSWORD = process.env.DISHRANK_TEST_PASSWORD || "";

interface SessionData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  token_type: string;
  user: any;
}

/**
 * Get a session token from Supabase using password auth
 */
async function getSupabaseSession(): Promise<SessionData> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY");
  }

  if (!TEST_EMAIL || !TEST_PASSWORD) {
    throw new Error("Missing DISHRANK_TEST_EMAIL or DISHRANK_TEST_PASSWORD");
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
    throw new Error(data.error_description || data.error);
  }

  return data;
}

/**
 * Get the localStorage key for Supabase auth
 */
function getSupabaseStorageKey(): string {
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  return `sb-${projectRef}-auth-token`;
}

/**
 * Main test function - exports for use in dev-browser scripts
 */
export async function runAuthenticatedTest() {
  // Dynamic import for dev-browser client (only available in dev-browser environment)
  const { connect, waitForPageLoad } = await import("@/client.js");

  console.log("Getting Supabase session...");
  const session = await getSupabaseSession();
  console.log("Session obtained for:", session.user?.email);

  const client = await connect();
  const page = await client.page("dishrank-test");
  await page.setViewportSize({ width: 390, height: 844 });

  // Navigate to the app
  console.log("Navigating to app...");
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await waitForPageLoad(page);

  // Inject the auth session into localStorage
  console.log("Injecting auth session...");
  const storageKey = getSupabaseStorageKey();
  const sessionData = JSON.stringify({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at,
    expires_in: session.expires_in,
    token_type: session.token_type,
    user: session.user,
  });

  await page.evaluate(
    ({ key, value }: { key: string; value: string }) => {
      localStorage.setItem(key, value);
    },
    { key: storageKey, value: sessionData }
  );

  // Reload to pick up the session
  console.log("Reloading with auth...");
  await page.reload({ waitUntil: "networkidle" });
  await waitForPageLoad(page);
  await page.waitForTimeout(2000);

  // Take a screenshot to verify
  await page.screenshot({ path: "tmp/dishrank-authenticated.png" });
  console.log("Screenshot saved to tmp/dishrank-authenticated.png");

  // Return page info
  const title = await page.title();
  const url = page.url();
  const bodyText = await page.textContent("body");

  console.log({
    title,
    url,
    authenticated: bodyText?.includes("Hey,") || false,
  });

  await client.disconnect();
  return { client, page, session };
}

// Export for manual usage
export { getSupabaseSession, getSupabaseStorageKey };

// Run if called directly
if (process.argv[1]?.includes("dev-browser-test")) {
  runAuthenticatedTest().catch(console.error);
}
