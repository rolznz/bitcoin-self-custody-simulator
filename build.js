#!/usr/bin/env node
// Builds the single self-contained index.html from the files in src/.
//   node build.js           write index.html
//   node build.js --check   exit 1 if index.html is out of date
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, 'src');
const out = path.join(__dirname, 'index.html');
const read = (file) => fs.readFileSync(path.join(src, file), 'utf8');

// Embed each font and image that the CSS refers to as a data URI.
const mime = { woff2: 'font/woff2', png: 'image/png', webp: 'image/webp' };
const data = (asset, ext) => `data:${mime[ext]};base64,${fs.readFileSync(path.join(src, asset)).toString('base64')}`;
const css = (file) =>
  read(file).replace(/url\(((?:fonts|img)\/[\w-]+\.(woff2|png))\)/g, (_, asset, ext) => `url(${data(asset, ext)})`);
// Scripts name their pictures as quoted paths, such as 'img/head-hal.webp'.
const js = (file) =>
  read(file).replace(/'(img\/[\w-]+\.(png|webp))'/g, (_, asset, ext) => `'${data(asset, ext)}'`);

const html = read('index.html')
  .replace(/<link rel="stylesheet" href="([^"]+)">\n/g, (_, file) => `<style>\n${css(file)}</style>\n`)
  .replace(/<script src="([^"]+)"><\/script>\n/g, (_, file) => `<script>\n${js(file)}</script>\n`)
  // Neighbouring scripts become one block.
  .replaceAll('</script>\n<script>\n', '');

if (process.argv.includes('--check')) {
  if (!fs.existsSync(out) || fs.readFileSync(out, 'utf8') !== html) {
    console.error('index.html is out of date. Run: node build.js');
    process.exit(1);
  }
  console.log('index.html is up to date.');
} else {
  fs.writeFileSync(out, html);
  console.log(`Wrote index.html (${Math.round(Buffer.byteLength(html) / 1024)} KB).`);
}
