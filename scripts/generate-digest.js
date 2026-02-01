import fs from 'fs';
import path from 'path';
import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'ai-daily-brief-bot/1.0 (+https://github.com/Hemilt0n/ai-daily-brief)'
  }
});
const sourcesPath = path.join(process.cwd(), 'sources.json');
const { sources } = JSON.parse(fs.readFileSync(sourcesPath, 'utf8'));

const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
const dateStr = `${yyyy}-${mm}-${dd}`;

const docsDir = path.join(process.cwd(), 'docs');
const dailyDir = path.join(docsDir, 'daily');
fs.mkdirSync(dailyDir, { recursive: true });

function escapeHtml(str = '') {
  return str.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function brief(text = '') {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.slice(0, 200);
}

async function fetchFeed(src) {
  try {
    const feed = await parser.parseURL(src.url);
    const items = (feed.items || []).slice(0, src.limit || 5).map(it => ({
      title: it.title || 'Untitled',
      link: it.link || '',
      date: it.pubDate || it.isoDate || '',
      summary: brief(it.contentSnippet || it.summary || it.content || '')
    }));
    return { name: src.name, items };
  } catch (e) {
    return { name: src.name, items: [], error: e.message };
  }
}

const sections = [];
for (const src of sources) {
  // eslint-disable-next-line no-await-in-loop
  const data = await fetchFeed(src);
  sections.push(data);
}

// Markdown output
let md = `# AI Daily Brief (${dateStr})\n\n`;
for (const sec of sections) {
  md += `## ${sec.name}\n\n`;
  if (sec.error) {
    md += `- (Fetch error: ${sec.error})\n\n`;
    continue;
  }
  if (sec.items.length === 0) {
    md += `- (No items)\n\n`;
    continue;
  }
  for (const item of sec.items) {
    md += `- [${item.title}](${item.link})`;
    if (item.summary) md += ` — ${item.summary}`;
    md += `\n`;
  }
  md += `\n`;
}

const mdPath = path.join(dailyDir, `${dateStr}.md`);
fs.writeFileSync(mdPath, md, 'utf8');

// HTML output
let html = `<!doctype html><html><head><meta charset="utf-8" />\n`;
html += `<title>AI Daily Brief ${dateStr}</title>`;
html += `<style>body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial;margin:32px;line-height:1.6;}h1,h2{margin-top:1.2em;}.item{margin:8px 0;}.meta{color:#666;font-size:.9em;}</style>`;
html += `</head><body>`;
html += `<h1>AI Daily Brief (${dateStr})</h1>`;
for (const sec of sections) {
  html += `<h2>${escapeHtml(sec.name)}</h2>`;
  if (sec.error) {
    html += `<div class="item">Fetch error: ${escapeHtml(sec.error)}</div>`;
    continue;
  }
  if (sec.items.length === 0) {
    html += `<div class="item">No items</div>`;
    continue;
  }
  for (const item of sec.items) {
    html += `<div class="item"><a href="${escapeHtml(item.link)}" target="_blank" rel="noreferrer">${escapeHtml(item.title)}</a>`;
    if (item.summary) html += `<div class="meta">${escapeHtml(item.summary)}</div>`;
    html += `</div>`;
  }
}
html += `</body></html>`;

fs.writeFileSync(path.join(docsDir, 'index.html'), html, 'utf8');

console.log(`Generated digest for ${dateStr}`);
