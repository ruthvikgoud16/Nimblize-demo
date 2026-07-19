import { test, expect } from "@playwright/test";

test.describe("Nimblize Studio Production E2E Suite", () => {
  
  test("1. Authentication Redirection and Login Fallback", async ({ page }) => {
    // Navigate to root route (should protect and redirect to login if unauthenticated)
    await page.goto("/");
    
    // Check for landing or authorization credentials panel
    const devAuthHeading = page.locator("h2:has-text('Console Developer Access')");
    await expect(devAuthHeading).toBeVisible();

    // Fill dev authorization form
    await page.fill("input[type='email']", "admin.developer@nimblize.ai");
    await page.fill("input[type='password']", "password");
    
    // Trigger submit
    await page.click("button:has-text('Authenticate Profile')");

    // Should successfully redirect to Dashboard
    await expect(page.locator("h1:has-text('Competitor Intelligence')")).toBeVisible();
  });

  test("2. Console Page Navigation", async ({ page }) => {
    // Authenticate first
    await page.goto("/");
    await page.fill("input[type='email']", "admin.developer@nimblize.ai");
    await page.fill("input[type='password']", "password");
    await page.click("button:has-text('Authenticate Profile')");
    await expect(page.locator("h1:has-text('Competitor Intelligence')")).toBeVisible();

    // Navigate to Prompt Playground
    await page.click("a[href='/playground']");
    await expect(page.locator("h1:has-text('Prompt Playground')")).toBeVisible();

    // Navigate to Automation Studio
    await page.click("a[href='/automation']");
    await expect(page.locator("h1:has-text('Automation Studio')")).toBeVisible();

    // Navigate to Evaluation Dashboard
    await page.click("a[href='/evaluation']");
    await expect(page.locator("h1:has-text('Evaluation Dashboard')")).toBeVisible();

    // Navigate to Reports Center
    await page.click("a[href='/reports']");
    await expect(page.locator("h1:has-text('Reports Center')")).toBeVisible();

    // Navigate to Settings
    await page.click("a[href='/settings']");
    await expect(page.locator("h1:has-text('System Settings')")).toBeVisible();
  });

  test("3. Prompt Playground Interaction", async ({ page }) => {
    await page.goto("/playground");
    // Ensure redirect forces login
    await page.fill("input[type='email']", "admin.developer@nimblize.ai");
    await page.fill("input[type='password']", "password");
    await page.click("button:has-text('Authenticate Profile')");
    await expect(page.locator("h1:has-text('Prompt Playground')")).toBeVisible();

    // Click version selector dropdown trigger
    await page.click("button:has-text('v')");
    
    // Check version options are listed
    const firstVersion = page.locator("role=menuitem").first();
    await expect(firstVersion).toBeVisible();
    await firstVersion.click();

    // Search registry
    await page.fill("input[placeholder='Search templates...']", "SEO");
    
    // Select variable tab
    await page.click("button:has-text('Variables')");
    
    // Check if YAML code viewer works
    await page.click("button:has-text('YAML Config')");
    const yamlPre = page.locator("pre");
    await expect(yamlPre).toBeVisible();
  });

  test("4. Automation DAG Executions", async ({ page }) => {
    await page.goto("/automation");
    await page.fill("input[type='email']", "admin.developer@nimblize.ai");
    await page.fill("input[type='password']", "password");
    await page.click("button:has-text('Authenticate Profile')");
    await expect(page.locator("h1:has-text('Automation Studio')")).toBeVisible();

    // Select a node (e.g. LLM node)
    await page.click("text=LLM Generation");
    
    // Verify logs and stats for that node appear
    await expect(page.locator("h3:has-text('Node Detail:')")).toBeVisible();
    await expect(page.locator("text=Latency")).toBeVisible();

    // Trigger pipeline run
    await page.click("button:has-text('Execute Pipeline')");
    
    // Wait for running status or completion
    await expect(page.locator("button:has-text('Executing...')")).toBeVisible();
  });

  test("5. System Settings Modification", async ({ page }) => {
    await page.goto("/settings");
    await page.fill("input[type='email']", "admin.developer@nimblize.ai");
    await page.fill("input[type='password']", "password");
    await page.click("button:has-text('Authenticate Profile')");
    await expect(page.locator("h1:has-text('System Settings')")).toBeVisible();

    // Check settings inputs exist
    const evaluatorInput = page.locator("input[type='text']").first();
    await expect(evaluatorInput).toBeVisible();

    // Toggle a setting switch
    const debugSwitch = page.locator("button[role='switch']").first();
    await expect(debugSwitch).toBeVisible();
    await debugSwitch.click();
  });
});
