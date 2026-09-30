const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '..', 'public');

async function convertSvgToPng(svgName, pngName, width, height) {
  const svgPath = path.join(publicDir, svgName);
  const pngPath = path.join(publicDir, pngName);
  
  const svgBuffer = fs.readFileSync(svgPath);
  
  await sharp(svgBuffer)
    .resize(width, height)
    .png()
    .toFile(pngPath);
  
  console.log(`Created ${pngName} (${width}x${height})`);
}

async function main() {
  try {
    await convertSvgToPng('icon-192.svg', 'icon-192.png', 192, 192);
    await convertSvgToPng('icon-512.svg', 'icon-512.png', 512, 512);
    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();