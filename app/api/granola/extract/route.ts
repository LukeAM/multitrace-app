import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
const execAsync = promisify(exec);
import { JSDOM } from 'jsdom';

function htmlToMarkdown(elements: Element[]): string {
  let md = '';
  for (const el of elements) {
    switch (el.tagName) {
      case 'H1':
        md += `# ${el.textContent}\n\n`;
        break;
      case 'H2':
        md += `## ${el.textContent}\n\n`;
        break;
      case 'H3':
        md += `### ${el.textContent}\n\n`;
        break;
      case 'H4':
        md += `#### ${el.textContent}\n\n`;
        break;
      case 'UL':
        md += Array.from(el.children).map(li => `- ${li.textContent}`).join('\n') + '\n\n';
        break;
      case 'OL':
        md += Array.from(el.children).map((li, i) => `${i + 1}. ${li.textContent}`).join('\n') + '\n\n';
        break;
      case 'LI':
        break;
      case 'P':
        md += `${el.textContent}\n\n`;
        break;
      case 'HR':
        md += `---\n`;
        break;
      case 'A':
        md += `[${el.textContent}](${el.getAttribute('href')})`;
        break;
      default:
        md += htmlToMarkdown(Array.from(el.children));
    }
  }
  return md;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    // Use curl to fetch the HTML
    const { stdout } = await execAsync(`curl -L --compressed ${JSON.stringify(url)}`);
    const html = stdout;
    const dom = new JSDOM(html);
    const doc = dom.window.document;

    const title = doc.querySelector('title')?.textContent?.trim() || 'Granola Artifact';
    const summary = doc.querySelector('meta[name="description"]')?.getAttribute('content')?.trim() || '';

    // 1. Find all <script> tags with self.__next_f.push([1,"
    const scripts = Array.from(doc.querySelectorAll('script'));
    let extractedHtml = '';
    for (const script of scripts) {
      const text = script.textContent || '';
      const match = text.match(/self\.__next_f\.push\(\[1,\"([\s\S]*?)\"\]\)/);
      if (match && match[1]) {
        // Unescape HTML entities (\u003c, etc)
        let htmlStr = match[1]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\u003c/g, '<')
          .replace(/\\u003e/g, '>')
          .replace(/\\u0026/g, '&');
        extractedHtml += htmlStr + '\n';
      }
    }

    let main = '';
    if (extractedHtml.trim()) {
      // Parse the extracted HTML
      const contentDom = new JSDOM(`<div>${extractedHtml}</div>`);
      const contentDoc = contentDom.window.document;
      const blocks = Array.from(contentDoc.querySelectorAll('h1, h2, h3, h4, ul, ol, p, hr'));
      main = htmlToMarkdown(blocks).trim();
    }

    // Fallback to previous logic if nothing found
    if (!main) {
      let container = doc.querySelector('main') || doc.body;
      const blocks = Array.from(container.querySelectorAll('h1, h2, h3, h4, ul, ol, p, hr'));
      const contentBlocks = blocks.filter(el => {
        let parent = el.parentElement;
        while (parent) {
          if (parent.classList.contains('animate-spin') || parent.classList.contains('hide-scrollbar')) {
            return false;
          }
          parent = parent.parentElement;
        }
        return true;
      });
      main = htmlToMarkdown(contentBlocks).trim();
    }

    const markdown = `# ${title}\n\n${summary ? `> ${summary}\n\n` : ''}${main}`;

    return NextResponse.json({ markdown });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to fetch Granola content' }, { status: 500 });
  }
}
