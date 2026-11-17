import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== COPY-DIST ===');
const distDir = path.join(__dirname, 'dist');
console.log('dist exists:', fs.existsSync(distDir));

// Ensure sub-app scripts are copied directly to dist/torneo and dist/oyes
try {
    const torneoDist = path.join(distDir, 'torneo');
    if (!fs.existsSync(torneoDist)) fs.mkdirSync(torneoDist, { recursive: true });
    if (fs.existsSync(path.join(__dirname, 'torneo', 'app.js'))) {
        fs.copyFileSync(path.join(__dirname, 'torneo', 'app.js'), path.join(torneoDist, 'app.js'));
        console.log('Copied torneo/app.js to dist/torneo/app.js');
    }
    if (fs.existsSync(path.join(__dirname, 'torneo', 'style.css'))) {
        fs.copyFileSync(path.join(__dirname, 'torneo', 'style.css'), path.join(torneoDist, 'style.css'));
        console.log('Copied torneo/style.css to dist/torneo/style.css');
    }

    const oyesDist = path.join(distDir, 'oyes');
    if (!fs.existsSync(oyesDist)) fs.mkdirSync(oyesDist, { recursive: true });
    if (fs.existsSync(path.join(__dirname, 'oyes', 'app.js'))) {
        fs.copyFileSync(path.join(__dirname, 'oyes', 'app.js'), path.join(oyesDist, 'app.js'));
        console.log('Copied oyes/app.js to dist/oyes/app.js');
    }

    if (fs.existsSync(path.join(__dirname, 'upload.php'))) {
        fs.copyFileSync(path.join(__dirname, 'upload.php'), path.join(distDir, 'upload.php'));
        console.log('Copied upload.php to dist/upload.php');
    }

    const imagenesSrc = path.join(__dirname, 'imagenes');
    const imagenesDist = path.join(distDir, 'imagenes');
    if (fs.existsSync(imagenesSrc)) {
        const copyImagenesRecursive = (srcDir, dstDir) => {
            if (!fs.existsSync(dstDir)) fs.mkdirSync(dstDir, { recursive: true });
            fs.readdirSync(srcDir).forEach(entry => {
                const srcPath = path.join(srcDir, entry);
                const dstPath = path.join(dstDir, entry);
                try {
                    const stat = fs.lstatSync(srcPath);
                    if (stat.isDirectory()) {
                        copyImagenesRecursive(srcPath, dstPath);
                    } else if (stat.isFile()) {
                        if (!fs.existsSync(dstPath) || stat.size !== fs.statSync(dstPath).size) {
                            fs.copyFileSync(srcPath, dstPath);
                        }
                    }
                } catch (err) {
                    console.warn(`Skipped copying ${entry}:`, err.message);
                }
            });
        };
        copyImagenesRecursive(imagenesSrc, imagenesDist);
        console.log('Copied all files and folders from imagenes/ to dist/imagenes/');
    }
} catch (e) {
    console.error('Error copying sub-apps:', e);
}

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
