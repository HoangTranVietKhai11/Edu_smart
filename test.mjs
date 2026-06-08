import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log(`CONSOLE: [${msg.type()}] ${msg.text()}`));
  page.on('pageerror', err => console.log(`PAGE ERROR: ${err.message}`));
  page.on('requestfailed', request => console.log(`REQUEST FAILED: ${request.url()} - ${request.failure().errorText}`));

  console.log('Navigating...');
  await page.goto('https://edusmart-frontend-0ybr.onrender.com/login', { waitUntil: 'networkidle' });

  const rootHtml = await page.evaluate(() => document.querySelector('#root').innerHTML);
  console.log('ROOT HTML LENGTH:', rootHtml.length);
  
  await browser.close();
})();
