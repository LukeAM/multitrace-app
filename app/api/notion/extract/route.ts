import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';
import TurndownService from 'turndown';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // Expand all toggles
    await page.evaluate(() => {
      document.querySelectorAll('div[role="button"]').forEach(btn => {
        if (btn.textContent && btn.textContent.match(/▶|Show/)) {
          (btn as HTMLElement).click();
        }
      });
    });

    // Scroll to the bottom to load all lazy content
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });

    // Wait a bit for content to load (use setTimeout in evaluate context)
    await page.evaluate(() => new Promise<void>(resolve => setTimeout(resolve, 2000)));

    // Extract the HTML of the main content
    const html = await page.$eval('[class*="notion-page-content"], .notion-page-content', el => el.innerHTML);

    // Extract the page title
    const pageTitle = await page.title();

    await browser.close();

    // Convert HTML to Markdown
    const turndownService = new TurndownService();
    const markdownContent = turndownService.turndown(html);
    const markdown = `# ${pageTitle}\n\n${markdownContent}`;

    return NextResponse.json({ markdown });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process Notion page', details: String(err) }, { status: 500 });
  }
} 