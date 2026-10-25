const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');
const app = require('../src/server');

const EDGE_PATH = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const SCREENSHOTS_DIR = path.join(__dirname, '../screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function capture() {
  // Start server locally for capture
  const server = app.listen(3000);
  console.log('Temporary server running on port 3000...');

  console.log('Launching Edge for screenshots...');
  const browser = await puppeteer.launch({
    executablePath: EDGE_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // 1. Screenshot 1: Register page with error messages (PC vision: 1280x800)
  console.log('Capturing: register-errors.png (PC vision)...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.goto('http://localhost:3000/register', { waitUntil: 'networkidle2' });
  await page.click('#registerSubmitBtn');
  await new Promise(r => setTimeout(r, 400));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'register-errors.png') });

  // 2. Screenshot 2: Login page (PC vision: 1280x800)
  console.log('Capturing: login.png (PC vision)...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'login.png') });

  // 3. Screenshot 3: Study tasks list with some to-dos (PC vision: 1280x800 - Light Mode)
  console.log('Capturing: study-tasks-list.png (PC vision)...');
  await page.type('#email', 'sara@mail.com');
  await page.type('#password', 'password123');
  await page.click('#loginSubmitBtn');
  await page.waitForNavigation({ waitUntil: 'networkidle2' });
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'study-tasks-list.png') });

  // 4. Screenshot 4: PC Vision (Desktop 1280x800 with Dark Mode toggled)
  console.log('Capturing: pc-dashboard.png (1280x800 Desktop Dark Mode)...');
  await page.setViewport({ width: 1280, height: 800 });
  await page.click('#themeToggleBtn');
  await new Promise(r => setTimeout(r, 300));
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'pc-dashboard.png') });

  console.log('All screenshots captured successfully in PC vision!');
  await browser.close();
  server.close();
}

capture().catch(err => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
