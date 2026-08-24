'use strict';

/**
 * Optimizes the large marketing PNGs into web-friendly WebP assets and builds a
 * 1200x630 social/OG cover. Source PNGs stay in place; the app references the
 * lighter .webp variants. Run: node scripts/opt-marketing.cjs
 */
const path = require('path');
const sharp = require('sharp');

const DIR = path.resolve(__dirname, '..', 'public', 'marketing');

async function toWebp(src, out, width) {
  await sharp(path.join(DIR, src))
    .resize({ width, withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(path.join(DIR, out));
  console.log('wrote', out);
}

async function ogCover() {
  await sharp(path.join(DIR, 'sq_hero.png'))
    .resize({ width: 1200, height: 630, fit: 'cover', position: 'centre' })
    .jpeg({ quality: 84 })
    .toFile(path.join(DIR, 'sq_og.jpg'));
  console.log('wrote sq_og.jpg');
}

(async () => {
  await toWebp('sq_hero.png', 'sq_hero.webp', 1400);
  await toWebp('sq_community.png', 'sq_community.webp', 1200);
  await toWebp('sq_brand_motif.png', 'sq_brand_motif.webp', 800);
  await ogCover();
})();
