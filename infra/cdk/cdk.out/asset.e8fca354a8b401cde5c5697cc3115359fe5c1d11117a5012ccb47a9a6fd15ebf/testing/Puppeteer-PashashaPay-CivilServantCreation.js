const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

(async () => {
  const headless = process.env.HEADLESS !== 'false';
  const slowMo = Number(process.env.SLOWMO || 0) || 0;
  const baseUrl = process.env.BASE_URL || 'https://main.d2vxflzymkt19g.amplifyapp.com';

  const firstName = process.env.FIRST_NAME || 'Lerato';
  const familyName = process.env.FAMILY_NAME || 'Dlamini';
  const email =
    process.env.EMAIL || `pasha+${Date.now()}_${randomUUID().slice(0, 6)}@leansystems.co.za`;
  const phone = process.env.PHONE || '+27726840479';
  const password = process.env.PASSWORD || 'Test@123';

  const userDataDir = path.join(__dirname, '..', 'tmp', 'puppeteer-profile');
  fs.mkdirSync(userDataDir, { recursive: true });

  // Prefer the system Chrome if available; falls back to bundled Chromium.
  const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const hasSystemChrome = fs.existsSync(systemChrome);
  const executablePath = hasSystemChrome ? systemChrome : puppeteer.executablePath();

  // Launch browser with a local profile to avoid crashpad permission issues
  const browser = await puppeteer.launch({
    headless,
    executablePath,
    slowMo,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-crash-reporter',
      '--disable-crashpad',
      '--no-crashpad',
      `--user-data-dir=${userDataDir}`,
    ],
    env: { ...process.env, CHROME_CRASHPAD_PIPE_NAME: '' },
    // If this line causes issues, just remove it – Puppeteer will use its own Chromium
    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  console.log(`Browser launched (headless=${headless}, executable=${executablePath})`);

  const page = await browser.newPage();
  await page.setViewport({ width: 1512, height: 945 });

  // Go straight to the signup page
  await page.goto(`${baseUrl}/signup`, {
    waitUntil: 'networkidle2',
  });
  console.log('Navigated to signup page');

  // ---- Fill in the form ----

  // First name
  const firstNameSelector = 'div:nth-of-type(1) > label:nth-of-type(1) > input';
  await page.waitForSelector(firstNameSelector);
  await page.click(firstNameSelector, { clickCount: 3 });
  await page.type(firstNameSelector, firstName);

  // Family name
  const familyNameSelector = 'div:nth-of-type(1) > label:nth-of-type(2) > input';
  await page.click(familyNameSelector, { clickCount: 3 });
  await page.type(familyNameSelector, familyName);

  // Email
  const emailSelector = 'div:nth-of-type(2) > label:nth-of-type(1) > input';
  await page.click(emailSelector, { clickCount: 3 });
  await page.type(emailSelector, email);

  // Mobile phone
  const mobileSelector = 'div:nth-of-type(2) > label:nth-of-type(2) > input';
  await page.click(mobileSelector, { clickCount: 3 });
  await page.type(mobileSelector, phone);

  // Password
  const passwordSelector = 'div:nth-of-type(3) > label:nth-of-type(1) > input';
  await page.click(passwordSelector, { clickCount: 3 });
  await page.type(passwordSelector, password);

  // Confirm password
  const confirmSelector = 'div:nth-of-type(3) > label:nth-of-type(2) > input';
  await page.click(confirmSelector, { clickCount: 3 });
  await page.type(confirmSelector, password);

  // Civil Servant (Guard) radio button
  const civilServantSelector = 'label.border-slate-200 input';
  await page.click(civilServantSelector);

  // ---- Click "Continue to verification" ----
  const buttonSelector = 'button[type="submit"], button';
  await page.waitForSelector(buttonSelector);
  await page.click(buttonSelector);

  // Wait for either success or error text/snackbar
  const successSelector = 'text/Civil Servant Dashboard';
  const errorSelector = '.text-rose-600, .text-red-600, [role="alert"]';

  const outcome = await Promise.race([
    page.waitForSelector(successSelector, { timeout: 10000 }).then(() => 'success'),
    page.waitForSelector(errorSelector, { timeout: 10000 }).then(() => 'error'),
    new Promise((resolve) => setTimeout(() => resolve('timeout'), 12000)),
  ]);

  const screenshotPath = path.join(__dirname, '..', 'tmp', `signup-outcome-${Date.now()}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Signup attempt outcome=${outcome}, screenshot=${screenshotPath}`);

  console.log('Form submitted, closing browser');
  await browser.close();
})().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
