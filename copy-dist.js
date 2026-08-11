import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== COPY-DIST DIAGNOSTIC ===');
console.log('__dirname:', __dirname);
console.log('process.cwd():', process.cwd());

const distDir = path.join(__dirname, 'dist');

// All Hostinger possible paths including domain-specific
const candidatePaths = [
    path.resolve(__dirname, '..', 'public_html'),
    path.resolve(__dirname, '..', '..', 'public_html'),
    path.resolve(__dirname, '..', '..', '..', 'public_html'),
    path.resolve(__dirname, '..', '..', '..', '..', 'public_html'),
    '/home/u997261111/public_html',
    '/home/u997261111/domains/colimagolf.com/public_html',
    '/var/www/colimagolf.com/public_html',
    '/var/www/html',
];

console.log('Searching for public_html in:');
candidatePaths.forEach(p => console.log(' -', p, '->', fs.existsSync(p) ? 'EXISTS ✓' : 'not found'));

function copyFolderRecursiveSync(from, to) {
    if (!fs.existsSync(to)) {
        fs.mkdirSync(to, { recursive: true });
    }
    fs.readdirSync(from).forEach(element => {
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        const stat = fs.lstatSync(fromPath);
        if (stat.isFile()) {
            fs.copyFileSync(fromPath, toPath);
        } else if (stat.isDirectory()) {
            copyFolderRecursiveSync(fromPath, toPath);
        }
    });
}

let copied = false;
for (const targetPath of candidatePaths) {
    try {
        if (fs.existsSync(targetPath)) {
            console.log(`\nCopying built files from ${distDir} to ${targetPath}...`);
            copyFolderRecursiveSync(distDir, targetPath);
            console.log(`Successfully copied build to ${targetPath}`);
            copied = true;
            break;
        }
    } catch (err) {
        console.warn(`Could not copy to ${targetPath}:`, err.message);
    }
}

if (!copied) {
    console.log('\nNo public_html path found - listing parent directories:');
    let dir = __dirname;
    for (let i = 0; i < 6; i++) {
        dir = path.resolve(dir, '..');
        try {
            const contents = fs.readdirSync(dir);
            console.log(`  ${dir}:`, contents.join(', '));
        } catch(e) {
            console.log(`  ${dir}: (permission denied)`);
        }
    }
}
