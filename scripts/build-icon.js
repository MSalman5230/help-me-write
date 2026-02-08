/**
 * Build a multi-size .ico from the largest PNG in src-tauri/icons.
 * Run: node scripts/build-icon.js
 * Requires: npm install sharp sharp-ico --save-dev
 */
import sharp from 'sharp';
import ico from 'sharp-ico';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'src-tauri', 'icons');
const inputPng = join(iconsDir, '450x450.png');  // use largest for best quality
const outputIco = join(iconsDir, 'icon.ico');

const sharpInstance = sharp(inputPng);
ico
  .sharpsToIco([sharpInstance], outputIco, {
    sizes: [256, 128, 64, 48, 32, 16],  // 16, 32 = tray; others = window/taskbar
    resizeOptions: {},
  })
  .then((info) => {
    console.log('Created', outputIco, info);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
