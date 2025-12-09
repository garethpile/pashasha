const puppeteer = require('puppeteer');

(async () => {
  // Launch a visible browser so you can watch it work
  const browser = await puppeteer.launch({
    headless: false,
    // If this line causes issues, just remove it – Puppeteer will use its own Chromium
    // executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1512, height: 945 });

  // Go straight to the signup page
  await page.goto('https://main.d2vxflzymkt19g.amplifyapp.com/signup', {
    waitUntil: 'networkidle2',
  });

  // ---- Fill in the form ----

  // First name
  const firstNameSelector = 'div:nth-of-type(1) > label:nth-of-type(1) > input';
  await page.waitForSelector(firstNameSelector);
  await page.click(firstNameSelector, { clickCount: 3 });
  await page.type(firstNameSelector, 'Lerato');

  // Family name
  const familyNameSelector = 'div:nth-of-type(1) > label:nth-of-type(2) > input';
  await page.click(familyNameSelector, { clickCount: 3 });
  await page.type(familyNameSelector, 'Dlamini');

  // Email
  const emailSelector = 'div:nth-of-type(2) > label:nth-of-type(1) > input';
  await page.click(emailSelector, { clickCount: 3 });
  await page.type(emailSelector, 'gareth.pile@leansystems.co.za');

  // Mobile phone
  const mobileSelector = 'div:nth-of-type(2) > label:nth-of-type(2) > input';
  await page.click(mobileSelector, { clickCount: 3 });
  await page.type(mobileSelector, '+27726840479');

  // Password
  const passwordSelector = 'div:nth-of-type(3) > label:nth-of-type(1) > input';
  await page.click(passwordSelector, { clickCount: 3 });
  await page.type(passwordSelector, 'Test@123');

  // Confirm password
  const confirmSelector = 'div:nth-of-type(3) > label:nth-of-type(2) > input';
  await page.click(confirmSelector, { clickCount: 3 });
  await page.type(confirmSelector, 'Test@123');

  // Civil Servant (Guard) radio button
  const civilServantSelector = 'label.border-slate-200 input';
  await page.click(civilServantSelector);

  // ---- Click "Continue to verification" ----
  const buttonSelector = 'button[type="submit"], button';
  await page.waitForSelector(buttonSelector);
  await page.click(buttonSelector);

  // Simple 5-second pause using plain JS instead of page.waitForTimeout
  await new Promise((resolve) => setTimeout(resolve, 5000));

  await browser.close();
})().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
