import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distDir = path.join(__dirname, 'dist');

// Candidate locations for public_html in Hostinger environment
const candidatePaths = [
    path.resolve(__dirname, '..', 'public_html'),
    path.resolve(__dirname, '..', '..', 'public_html'),
    path.resolve(__dirname, '..', '..', '..', 'public_html'),
    path.resolve(__dirname, '..', '..', '..', '..', 'public_html'),
    '/home/u997261111/public_html'
];

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

for (const targetPath of candidatePaths) {
    try {
        if (fs.existsSync(targetPath)) {
            console.log(`Copying built files from ${distDir} to ${targetPath}...`);
            copyFolderRecursiveSync(distDir, targetPath);
            console.log(`Successfully copied build to ${targetPath}`);
            break;
        }
    } catch (err) {
        console.warn(`Could not copy to ${targetPath}:`, err.message);
    }
}
