/**
 * Post-build optimization script
 * Runs after `npm run build` to optimize Vercel deployment
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '../dist');

console.log('🔧 Running post-build optimization...');

// 1. Add cache headers metadata (optional)
const cacheHeaders = {
  'dist/**/*.{js,css}': 'public, max-age=31536000, immutable',
  'dist/**/*.html': 'public, max-age=0, must-revalidate',
  'dist/**/*.{jpg,jpeg,png,gif,svg}': 'public, max-age=86400'
};

// 2. Verify build output
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Build directory not found!');
  process.exit(1);
}

const files = fs.readdirSync(DIST_DIR);
console.log(`✅ Build successful: ${files.length} items in dist/`);

// 3. Log build size
const getSize = (filePath) => {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2); // KB
};

const indexPath = path.join(DIST_DIR, 'index.html');
if (fs.existsSync(indexPath)) {
  const size = getSize(indexPath);
  console.log(`✅ index.html: ${size} KB`);
}

console.log('✅ Post-build complete!');