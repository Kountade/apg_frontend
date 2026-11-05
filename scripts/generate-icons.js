// scripts/generate-icons.js
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 72, 76, 96, 120, 128, 144, 152, 180, 192, 384, 512];

// ✅ Source : public/logo.png
const sourceImage = path.join(__dirname, '..', 'public', 'logo.png');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(sourceImage)) {
  console.error('❌ public/logo.png non trouvé !');
  console.log(`📁 Attendu à : ${sourceImage}`);
  console.log('📝 Exécutez d\'abord : npm run create-logo');
  process.exit(1);
}

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('🎨 Génération des icônes APG...');
console.log(`📁 Source : ${sourceImage}`);

const generateIcons = async () => {
  try {
    const image = sharp(sourceImage);
    const metadata = await image.metadata();
    console.log(`📐 Image source: ${metadata.width}x${metadata.height}`);

    for (const size of sizes) {
      await image
        .clone()
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png({ quality: 90, compressionLevel: 9 })
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      console.log(`✅ icon-${size}x${size}.png`);
    }

    // apple-touch-icon.png (180x180)
    await image
      .clone()
      .resize(180, 180)
      .png({ quality: 90 })
      .toFile(path.join(publicDir, 'apple-touch-icon.png'));
    console.log('✅ apple-touch-icon.png (180x180)');

    // og-image.png (1200x630) — fond vert APG
    await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 4,
        background: { r: 22, g: 163, b: 74, alpha: 1 } // #16a34a
      }
    })
      .composite([
        {
          input: await sharp(sourceImage)
            .resize(400, 400, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer(),
          top: 115,
          left: 400
        }
      ])
      .png()
      .toFile(path.join(publicDir, 'og-image.png'));
    console.log('✅ og-image.png (1200x630)');

    console.log('\n✨ Génération terminée !');
    console.log(`📁 Icônes → ${iconsDir}`);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
};

generateIcons();