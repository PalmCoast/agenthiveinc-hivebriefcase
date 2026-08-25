'use strict';

/**
 * Generates the SideQuest PWA icon set from an on-brand SVG (navy square,
 * cyan pixel heart, purple map pin) using headless Chrome — no paid service.
 * These are faithful placeholders; drop the real brand PNGs at the same paths
 * (public/icon-512.png, icon-192.png, apple-touch-icon.png) to replace them.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PUB = path.resolve(__dirname, '..', 'public');

// 8-bit heart bitmap (1 = filled).
const HEART = [
  [0, 1, 1, 0, 1, 1, 0],
  [1, 1, 1, 1, 1, 1, 1],
  [1, 1, 1, 1, 1, 1, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0],
];

function iconSvg(size, { bg = true } = {}) {
  const S = size;
  const cell = S * 0.092;
  const gridW = 7 * cell;
  const gridH = 6 * cell;
  const ox = (S - gridW) / 2;
  const oy = S * 0.2;
  let cells = '';
  HEART.forEach((row, r) =>
    row.forEach((v, c) => {
      if (v) {
        const x = ox + c * cell;
        const y = oy + r * cell;
        cells += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${(cell + 0.6).toFixed(1)}" height="${(cell + 0.6).toFixed(1)}" fill="#22D3EE"/>`;
      }
    })
  );
  const cx = S / 2;
  const pinTop = oy + 1.6 * cell;
  const pinR = cell * 1.15;
  const pin = `
    <path d="M ${cx} ${(pinTop + pinR * 2.4).toFixed(1)}
             C ${(cx - pinR).toFixed(1)} ${(pinTop + pinR).toFixed(1)}, ${(cx - pinR).toFixed(1)} ${pinTop.toFixed(1)}, ${cx} ${pinTop.toFixed(1)}
             C ${(cx + pinR).toFixed(1)} ${pinTop.toFixed(1)}, ${(cx + pinR).toFixed(1)} ${(pinTop + pinR).toFixed(1)}, ${cx} ${(pinTop + pinR * 2.4).toFixed(1)} Z"
          fill="#A855F7"/>
    <circle cx="${cx}" cy="${(pinTop + pinR * 0.75).toFixed(1)}" r="${(pinR * 0.42).toFixed(1)}" fill="#0B1120"/>`;
  const bgRect = bg ? `<rect width="${S}" height="${S}" rx="${(S * 0.22).toFixed(0)}" fill="#0B1120"/>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${S} ${S}" width="${S}" height="${S}">${bgRect}${cells}${pin}</svg>`;
}

function render(svgPath, outPath, size) {
  try {
    execFileSync('timeout', [
      '20', 'google-chrome', '--headless=new', '--no-sandbox',
      `--user-data-dir=/tmp/sqicon-${size}`, '--hide-scrollbars',
      '--force-device-scale-factor=1', `--screenshot=${outPath}`,
      `--window-size=${size},${size}`, `file://${svgPath}`,
      '--default-background-color=00000000',
    ], { stdio: 'ignore' });
  } catch { /* timeout kill expected after screenshot is written */ }
  if (!fs.existsSync(outPath)) throw new Error(`icon render failed: ${outPath}`);
}

function main() {
  fs.mkdirSync(PUB, { recursive: true });
  // Master scalable icon (also used as favicon).
  fs.writeFileSync(path.join(PUB, 'icon.svg'), iconSvg(512));
  const sizes = [
    [512, 'icon-512.png'],
    [192, 'icon-192.png'],
    [180, 'apple-touch-icon.png'],
  ];
  for (const [size, name] of sizes) {
    const tmp = path.join('/tmp', `sq-icon-${size}.html`);
    fs.writeFileSync(tmp, iconSvg(size));
    render(tmp, path.join(PUB, name), size);
    console.log('generated', name);
  }
}

if (require.main === module) main();
module.exports = { main };
