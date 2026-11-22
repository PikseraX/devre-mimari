const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const postcss = require('postcss');
const tailwind = require('tailwindcss');
const root = path.resolve(__dirname, '..');

async function main() {
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const i18nJs = fs.readFileSync(path.join(root, 'i18n.js'), 'utf8');
  const { css } = await postcss([tailwind({
    content: [
      { raw: html, extension: 'html' },
      { raw: i18nJs, extension: 'js' },
    ],
  })]).process('@tailwind base; @tailwind components; @tailwind utilities;', { from: undefined });
  let fonts = '';
  for (const [name, weights] of [['inter', [400, 600, 700, 800, 900]], ['jetbrains-mono', [600, 700, 800]]]) {
    const dir = path.dirname(require.resolve(`@fontsource/${name}/package.json`));
    for (const weight of weights) for (const subset of ['latin', 'latin-ext']) {
      fonts += fs.readFileSync(path.join(dir, `${subset}-${weight}.css`), 'utf8')
        .replace(/,\s*url\([^)]+\.woff\) format\('woff'\)/g, '')
        .replace(/url\(([^)]+)\)/g, (_, url) => {
        const file = path.resolve(dir, url.replace(/['"]/g, ''));
        return `url(data:font/woff2;base64,${fs.readFileSync(file).toString('base64')})`;
      });
    }
  }
  html = html.replace(/\s*<script src="https:\/\/cdn.tailwindcss.com"><\/script>/, '')
    .replace(/\s*<link href="https:\/\/fonts.googleapis.com[^>]+>/, '')
    .replace('<style>', `<style>${fonts}\n${css}</style>\n    <style>`)
    .replace(/<script src="\.\/i18n\.js"><\/script>/, () => `<script>${i18nJs}</script>`);
  for (const match of html.matchAll(/<script>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
  if (/<(?:script|link)[^>]+(?:src|href)="https?:/i.test(html)) throw new Error('External runtime dependency remains');
  fs.mkdirSync(path.join(root, 'generated'), { recursive: true });
  fs.writeFileSync(path.join(root, 'generated/game-html.js'), `// Generated from index.html; do not edit.\nexport default ${JSON.stringify(html)};\n`);
  console.log(`Offline game prepared (${Math.round(Buffer.byteLength(html) / 1024)} KB).`);
}
main().catch(error => { console.error(error); process.exit(1); });
