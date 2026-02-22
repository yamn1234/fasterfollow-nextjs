const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let originalContent = content;

            if (!content.includes('react-router-dom')) continue;

            let hasRouterImport = false;
            let usedNextNav = new Set();
            let hasLink = false;

            const importRegex = /import\s+\{([^}]+)\}\s+from\s+['"]react-router-dom['"];?/g;

            content = content.replace(importRegex, (match, importsStr) => {
                hasRouterImport = true;
                const imports = importsStr.split(',').map(s => s.trim()).filter(Boolean);

                for (const imp of imports) {
                    if (imp === 'Link' || imp === 'NavLink') {
                        hasLink = true;
                    } else if (imp === 'useNavigate') {
                        usedNextNav.add('useRouter');
                    } else if (imp === 'useLocation') {
                        usedNextNav.add('usePathname');
                    } else if (imp === 'useParams' || imp === 'useSearchParams') {
                        usedNextNav.add(imp);
                    }
                }

                let result = '';
                if (hasLink) {
                    result += `import Link from "next/link";\n`;
                }
                if (usedNextNav.size > 0) {
                    result += `import { ${Array.from(usedNextNav).join(', ')} } from "next/navigation";\n`;
                }
                return result;
            });

            if (hasRouterImport) {
                if (
                    usedNextNav.has('useRouter') || usedNextNav.has('usePathname') || usedNextNav.has('useParams') || usedNextNav.has('useSearchParams')
                ) {
                    if (!content.includes('"use client"') && !content.includes("'use client'")) {
                        content = '"use client";\n\n' + content;
                    }
                }

                // Link 'to' -> 'href'
                content = content.replace(/<Link([^>]+)to=/g, '<Link$1href=');
                content = content.replace(/<NavLink([^>]+)to=/g, '<Link$1href=');
                content = content.replace(/<NavLink/g, '<Link');
                content = content.replace(/<\/NavLink>/g, '</Link>');

                // useNavigate -> useRouter
                content = content.replace(/useNavigate/g, 'useRouter');
                content = content.replace(/const\s+navigate\s*=\s*useRouter\(\);?/g, 'const router = useRouter();');
                content = content.replace(/(?<!\w)navigate\(/g, 'router.push(');
                content = content.replace(/router\.push\(([^,]+),\s*\{\s*replace:\s*true\s*\}\)/g, 'router.replace($1)');

                // useLocation -> usePathname
                content = content.replace(/const\s+location\s*=\s*usePathname\(\);?/g, 'const pathname = usePathname();');
                content = content.replace(/location\.pathname/g, 'pathname');

                if (content.includes('<Navigate ')) {
                    content = content.replace(/<Navigate\s+to=\{?["']([^\"']+)["']\}?[^>]*\/>/g, (match, path) => {
                        return `<Redirect to="${path}" />`;
                    });
                    if (content.includes('<Redirect ')) {
                        content = `import Redirect from "@/components/Redirect";\n` + content;
                    }
                }

                fs.writeFileSync(fullPath, content);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

processDir(path.join(process.cwd(), 'src'));
