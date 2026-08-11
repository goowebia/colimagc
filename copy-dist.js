import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== COPY-DIST ===');
console.log('__dirname:', __dirname);

const distDir = path.join(__dirname, 'dist');
console.log('dist exists:', fs.existsSync(distDir));

// Find the root public_html by traversing up until we find a directory
// that has BOTH hbuilds/ and public_html/ as siblings
function findRootPublicHtml(startDir) {
    let current = startDir;
    for (let i = 0; i < 10; i++) {
        const parent = path.resolve(current, '..');
        if (parent === current) break; // reached filesystem root
        try {
            const siblings = fs.readdirSync(parent);
            if (siblings.includes('hbuilds') && siblings.includes('public_html')) {
                return path.join(parent, 'public_html');
            }
        } catch(e) { /* permission denied, skip */ }
        current = parent;
    }
    return null;
}

const rootPublicHtml = findRootPublicHtml(__dirname);
console.log('Root public_html found at:', rootPublicHtml || 'NOT FOUND');

function copyFolderRecursiveSync(from, to) {
    if (!fs.existsSync(to)) fs.mkdirSync(to, { recursive: true });
    fs.readdirSync(from).forEach(element => {
        const src = path.join(from, element);
        const dst = path.join(to, element);
        if (fs.lstatSync(src).isFile()) {
            fs.copyFileSync(src, dst);
        } else {
            copyFolderRecursiveSync(src, dst);
        }
    });
}

if (rootPublicHtml) {
    try {
        console.log(`Copying dist -> ${rootPublicHtml} ...`);
        copyFolderRecursiveSync(distDir, rootPublicHtml);
        console.log('Done! Files copied to root public_html successfully.');
    } catch (err) {
        console.error('Error copying:', err.message);
    }
} else {
    console.log('Could not find root public_html. Skipping copy.');
}
