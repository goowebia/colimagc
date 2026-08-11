import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== COPY-DIST ===');
console.log('__dirname:', __dirname);

const distDir = path.join(__dirname, 'dist');

// hbuilds/current/nodejs/ -> hbuilds/current/public_html/
const targetPath = path.resolve(__dirname, '..', 'public_html');
console.log('Target:', targetPath);
console.log('Target exists:', fs.existsSync(targetPath));
console.log('dist exists:', fs.existsSync(distDir));

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

try {
    console.log(`\nCopying dist -> ${targetPath} ...`);
    copyFolderRecursiveSync(distDir, targetPath);
    console.log('Done! Files copied to public_html successfully.');
} catch (err) {
    console.error('Error:', err.message);
}
