const fs = require('fs');
const path = require('path');

const cwd = process.cwd();

// Update .env
const envPath = path.join(cwd, '.env');
if (fs.existsSync(envPath)) {
    let env = fs.readFileSync(envPath, 'utf8');
    env = env.replace(/VITE_/g, 'NEXT_PUBLIC_');
    fs.writeFileSync(envPath, env);
    console.log('Updated .env');
}

// Update source files
function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes('import.meta.env')) {
                content = content.replace(/import\.meta\.env\.VITE_/g, 'process.env.NEXT_PUBLIC_');
                // fallback in case they use import.meta.env without VITE_
                content = content.replace(/import\.meta\.env\./g, 'process.env.');
                fs.writeFileSync(fullPath, content);
                console.log(`Updated env references in ${fullPath}`);
            }
        }
    }
}

// Ensure the `vitest` config or any other places that use Vite envs are updated
processDir(path.join(cwd, 'src'));
processDir(path.join(cwd, 'supabase')); // Sometimes supabase functions use it
