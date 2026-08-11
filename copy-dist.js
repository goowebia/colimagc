import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const HOME = process.env.HOME || '';

console.log('=== COPY-DIST ===');
console.log('__dirname:', __dirname);
console.log('HOME:', HOME);
console.log('cwd:', process.cwd());

const distDir = path.join(__dirname, 'dist');

// Hostinger Linux shared hosting: /home/USERNAME/public_html
const candidatePaths = [
    HOME ? path.join(HOME, 'public_html') : null,
    HOME ? path.join(HOME, 'domains', 'colimagolf.com', 'public_html') : null,
    '/home/u997261111/public_html',
    '/home/u997261111/domains/colimagolf.com/public_html',
    path.resolve(__dirname, '..', '..', '..', 'public_html'),
    path.resolve(__dirname, '..', '..', 'public_html'),
    path.resolve(__dirname, '..', 'public_html'),
].filter(Boolean);

candidatePaths.forEach(p => {
    const exists = fs.existsSync(p);
    console.log(`  ${exists ? '✓' : '✗'} ${p}`);
});

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

let copied = false;
for (const targetPath of candidatePaths) {
    try {
        if (fs.existsSync(targetPath)) {
            console.log(`\nCopying dist -> ${targetPath}`);
            copyFolderRecursiveSync(distDir, targetPath);
            console.log('Done!');
            copied = true;
            break;
        }
    } catch (err) {
        console.warn(`Error copying to ${targetPath}:`, err.message);
    }
}

if (!copied) {
    console.log('\n! No public_html found. Writing diagnostic to file...');
    // Write a file so we can see the logs via File Manager
    fs.writeFileSync(
        path.join(__dirname, 'HOSTINGER_PATHS.txt'),
        `HOME=${HOME}\n__dirname=${__dirname}\ncwd=${process.cwd()}\n\nDirectory listing:\n` +
        candidatePaths.map(p => `${p}: ${fs.existsSync(p) ? 'EXISTS' : 'NOT FOUND'}`).join('\n')
    );
    console.log('Wrote HOSTINGER_PATHS.txt to', __dirname);
}
