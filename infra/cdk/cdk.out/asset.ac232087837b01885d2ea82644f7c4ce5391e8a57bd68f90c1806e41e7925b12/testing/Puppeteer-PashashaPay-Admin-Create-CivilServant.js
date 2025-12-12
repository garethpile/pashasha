const puppeteer = require('puppeteer'); // v23.0.0 or later

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const timeout = 5000;
  page.setDefaultTimeout(timeout);

  {
    const targetPage = page;
    await targetPage.setViewport({
      width: 1512,
      height: 945,
    });
  }
  {
    const targetPage = page;
    await targetPage.goto('https://main.d2vxflzymkt19g.amplifyapp.com/login');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Username or email)'),
      targetPage.locator('label:nth-of-type(1) > input'),
      targetPage.locator('::-p-xpath(/html/body/main/form/label[1]/input)'),
      targetPage.locator(':scope >>> label:nth-of-type(1) > input'),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 231,
          y: 26,
        },
      });
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Username or email)'),
      targetPage.locator('label:nth-of-type(1) > input'),
      targetPage.locator('::-p-xpath(/html/body/main/form/label[1]/input)'),
      targetPage.locator(':scope >>> label:nth-of-type(1) > input'),
    ])
      .setTimeout(timeout)
      .fill('gareth@m360.co.za');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Password)'),
      targetPage.locator('label:nth-of-type(2) > input'),
      targetPage.locator('::-p-xpath(/html/body/main/form/label[2]/input)'),
      targetPage.locator(':scope >>> label:nth-of-type(2) > input'),
    ])
      .setTimeout(timeout)
      .fill('Test@123');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Sign in)'),
      targetPage.locator('form > button'),
      targetPage.locator('::-p-xpath(/html/body/main/form/button)'),
      targetPage.locator(':scope >>> form > button'),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 205,
          y: 34,
        },
      });
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(＋ Add civil servant)'),
      targetPage.locator('div.justify-end > button'),
      targetPage.locator('::-p-xpath(/html/body/main/section/div/div[1]/button)'),
      targetPage.locator(':scope >>> div.justify-end > button'),
      targetPage.locator('::-p-text(＋ Add civil servant)'),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 56.859375,
          y: 25,
        },
      });
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(First name)'),
      targetPage.locator('div:nth-of-type(1) > label:nth-of-type(1) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[1]/label[1]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(1) > label:nth-of-type(1) > input'),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 189,
          y: 31.5,
        },
      });
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(First name)'),
      targetPage.locator('div:nth-of-type(1) > label:nth-of-type(1) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[1]/label[1]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(1) > label:nth-of-type(1) > input'),
    ])
      .setTimeout(timeout)
      .fill('S');
  }
  {
    const targetPage = page;
    await targetPage.keyboard.up('s');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(First name)'),
      targetPage.locator('div:nth-of-type(1) > label:nth-of-type(1) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[1]/label[1]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(1) > label:nth-of-type(1) > input'),
    ])
      .setTimeout(timeout)
      .fill('Senzo');
  }
  {
    const targetPage = page;
    await targetPage.keyboard.down('Tab');
  }
  {
    const targetPage = page;
    await targetPage.keyboard.up('Tab');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('div:nth-of-type(1) > label:nth-of-type(2) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[1]/label[2]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(1) > label:nth-of-type(2) > input'),
    ])
      .setTimeout(timeout)
      .fill('M');
  }
  {
    const targetPage = page;
    await targetPage.keyboard.up('m');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('div:nth-of-type(1) > label:nth-of-type(2) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[1]/label[2]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(1) > label:nth-of-type(2) > input'),
    ])
      .setTimeout(timeout)
      .fill('Mtetwa');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Email)'),
      targetPage.locator('div.fixed form > label > input'),
      targetPage.locator('::-p-xpath(/html/body/main/section/div/div[3]/div/form/label/input)'),
      targetPage.locator(':scope >>> div.fixed form > label > input'),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 59,
          y: 22.5,
        },
      });
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Email)'),
      targetPage.locator('div.fixed form > label > input'),
      targetPage.locator('::-p-xpath(/html/body/main/section/div/div[3]/div/form/label/input)'),
      targetPage.locator(':scope >>> div.fixed form > label > input'),
    ])
      .setTimeout(timeout)
      .fill('gareth.pile@leansystems.co.za');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Phone)'),
      targetPage.locator('div:nth-of-type(2) > label:nth-of-type(1) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[2]/label[1]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(2) > label:nth-of-type(1) > input'),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 52,
          y: 16.5,
        },
      });
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Phone)'),
      targetPage.locator('div:nth-of-type(2) > label:nth-of-type(1) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[2]/label[1]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(2) > label:nth-of-type(1) > input'),
    ])
      .setTimeout(timeout)
      .fill('+27726840479');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Primary site / address)'),
      targetPage.locator('div:nth-of-type(2) > label:nth-of-type(2) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[2]/label[2]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(2) > label:nth-of-type(2) > input'),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 58,
          y: 33.5,
        },
      });
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Primary site / address)'),
      targetPage.locator('div:nth-of-type(2) > label:nth-of-type(2) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[2]/label[2]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(2) > label:nth-of-type(2) > input'),
    ])
      .setTimeout(timeout)
      .fill('10 Lee R');
  }
  {
    const targetPage = page;
    await targetPage.keyboard.up('r');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Primary site / address)'),
      targetPage.locator('div:nth-of-type(2) > label:nth-of-type(2) > input'),
      targetPage.locator(
        '::-p-xpath(/html/body/main/section/div/div[3]/div/form/div[2]/label[2]/input)'
      ),
      targetPage.locator(':scope >>> div:nth-of-type(2) > label:nth-of-type(2) > input'),
    ])
      .setTimeout(timeout)
      .fill('10 Lee Road');
  }
  {
    const targetPage = page;
    await puppeteer.Locator.race([
      targetPage.locator('::-p-aria(Create civil servant[role=\\"button\\"])'),
      targetPage.locator('div.fixed form > button'),
      targetPage.locator('::-p-xpath(/html/body/main/section/div/div[3]/div/form/button)'),
      targetPage.locator(':scope >>> div.fixed form > button'),
    ])
      .setTimeout(timeout)
      .click({
        offset: {
          x: 117,
          y: 24.5,
        },
      });
  }

  await browser.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
