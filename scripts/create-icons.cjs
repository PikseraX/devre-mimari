const sharp = require('sharp');
const fs = require('node:fs');
const path = require('node:path');
const dir = path.resolve(__dirname, '../assets');
fs.mkdirSync(dir, { recursive: true });
function svg(adaptive) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
    ${adaptive ? '' : '<rect width="1024" height="1024" fill="#060a12"/>'}
    <g fill="none" stroke="#38bdf8" stroke-width="24" stroke-linecap="round" stroke-linejoin="round">
      <rect x="302" y="302" width="420" height="420" rx="80" fill="#0f172a"/>
      <path d="M382 302v-70m130 70v-70m130 70v-70M382 722v70m130-70v70m130-70v70M302 382h-70m70 130h-70m70 130h-70M722 382h70m-70 130h70m-70 130h70"/>
    </g>
    <path d="M540 350L398 535h105l-25 139 154-207H520z" fill="#fbbf24"/>
  </svg>`;
}
Promise.all([
  sharp(Buffer.from(svg(false))).png().toFile(path.join(dir, 'icon.png')),
  sharp(Buffer.from(svg(true))).png().toFile(path.join(dir, 'adaptive-icon.png')),
]).catch(error => { console.error(error); process.exit(1); });
