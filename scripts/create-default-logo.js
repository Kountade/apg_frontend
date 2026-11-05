// scripts/create-default-logo.js
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Logo SVG APG — pictogramme poubelle + "APG"
const svg = `
<svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#16a34a;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#065f46;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="100" fill="url(#grad)"/>
  <g fill="none" stroke="#ffffff" stroke-width="22" stroke-linecap="round" stroke-linejoin="round">
    <path d="M176 176 L336 176 L320 416 L192 416 Z"/>
    <path d="M144 176 L368 176"/>
    <path d="M208 176 L208 128 L304 128 L304 176"/>
    <path d="M256 232 L256 360"/>
    <path d="M216 232 L216 360"/>
    <path d="M296 232 L296 360"/>
  </g>
  <text x="256" y="480" font-size="44" text-anchor="middle" fill="rgba(255,255,255,0.95)" font-family="Arial, sans-serif" font-weight="bold">APG</text>
  <circle cx="256" cy="256" r="240" fill="none" stroke="rgba(255,255,255,0.2)" stroke-width="8"/>
</svg>
`;

// ✅ Génère logo.png dans public/
const outputPath = path.join(__dirname, '..', 'public', 'logo.png');

const publicDir = path.dirname(outputPath);
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('🎨 Création du logo APG...');

sharp(Buffer.from(svg))
  .png({ quality: 95, compressionLevel: 9 })
  .toFile(outputPath)
  .then(() => {
    console.log('✅ Logo créé avec succès !');
    console.log(`📁 Fichier : ${outputPath}`);
    console.log('🔄 Exécutez maintenant : npm run generate-icons');
  })
  .catch(err => {
    console.error('❌ Erreur:', err.message);
  });