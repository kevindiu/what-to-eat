const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const indexHtmlPath = path.join(rootDir, 'index.html');
const swPath = path.join(rootDir, 'sw.js');

const version = `v${Date.now()}`;

console.log(`Bumping version to ${version}...`);

// Update index.html
try {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    // Regex to match ?v=...
    const versionRegex = /(\?v=)[^"']+/g;
    indexHtml = indexHtml.replace(versionRegex, `$1${version}`);
    fs.writeFileSync(indexHtmlPath, indexHtml);
    console.log('Updated index.html');
} catch (e) {
    console.error('Error updating index.html:', e);
}

// Update sw.js
try {
    let swJs = fs.readFileSync(swPath, 'utf8');
    // Regex to match CACHE_NAME = '...'
    const cacheRegex = /(const CACHE_NAME = ')[^']+(';)/;
    swJs = swJs.replace(cacheRegex, `$1what-to-eat-${version}$2`);
    fs.writeFileSync(swPath, swJs);
    console.log('Updated sw.js');
} catch (e) {
    console.error('Error updating sw.js:', e);
}

console.log('Build complete.');
