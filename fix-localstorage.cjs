const fs = require('fs');
const path = require('path');

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            const orig = content;

            if (content.includes('localStorage')) {
                content = content.replace(/localStorage\.getItem\(/g, "(typeof window !== 'undefined' ? window.localStorage : null)?.getItem(");
                content = content.replace(/localStorage\.setItem\(/g, "(typeof window !== 'undefined' ? window.localStorage : null)?.setItem(");
                content = content.replace(/localStorage\.removeItem\(/g, "(typeof window !== 'undefined' ? window.localStorage : null)?.removeItem(");
                content = content.replace(/localStorage\.clear\(/g, "(typeof window !== 'undefined' ? window.localStorage : null)?.clear(");
                content = content.replace(/storage:\s*localStorage/g, "storage: typeof window !== 'undefined' ? window.localStorage : undefined");
            }
            if (orig !== content) {
                fs.writeFileSync(fullPath, content);
                console.log(`Patched ${fullPath}`);
            }
        }
    }
}
processDir(path.join(__dirname, 'src'));
