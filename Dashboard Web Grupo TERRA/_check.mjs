import { chromium } from 'playwright';

const errors = [];
const pageErrors = [];
const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => pageErrors.push(String(e)));

const res = await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
console.log('HTTP status:', res.status());
console.log('Titulo:', await page.title());
console.log('Hero visible:', await page.locator('#carga').isVisible());
console.log('Sidebar nav visible:', await page.locator('.side').isVisible());
console.log('Errores de consola:', errors);
console.log('Excepciones JS:', pageErrors);
await page.screenshot({ path: 'C:/Users/WILSON~1/AppData/Local/Temp/claude/c--Users-Wilson-Gallegos-OneDrive---AGROTA-CIA--LTDA-Documentos-GitHub/ee0b7167-f1fe-4659-9f8e-4c626fd92d3c/scratchpad/dashboard-check.png', fullPage: false });
await browser.close();
