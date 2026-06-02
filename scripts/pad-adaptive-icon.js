const sharp = require('sharp');
const path = require('path');

const CANVAS = 1024;
const LOGO_SIZE = Math.round(CANVAS * 0.48); // 48% → ~491px — fits inside all launcher masks
const OFFSET = Math.round((CANVAS - LOGO_SIZE) / 2); // centered padding

const input  = path.resolve(__dirname, '../assets/logo_transparent.png');
const output = path.resolve(__dirname, '../assets/adaptive-icon.png');

sharp(input)
  .resize(LOGO_SIZE, LOGO_SIZE, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .extend({
    top:    OFFSET,
    bottom: OFFSET,
    left:   OFFSET,
    right:  OFFSET,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .toFile(output)
  .then(() => console.log(`✅ adaptive-icon.png updated — logo at 60% with ${OFFSET}px transparent padding`))
  .catch(err => { console.error('❌ Failed:', err.message); process.exit(1); });
