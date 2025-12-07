
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAllFiles(dirPath, arrayOfFiles) {
    const files = fs.readdirSync(dirPath);
    arrayOfFiles = arrayOfFiles || [];
    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        if (fs.statSync(fullPath).isDirectory()) {
            arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
        } else {
            if (file.endsWith('.ts') || file.endsWith('.tsx')) {
                arrayOfFiles.push(fullPath);
            }
        }
    });
    return arrayOfFiles;
}

const files = getAllFiles('./src', []);
let fixedCount = 0;
let totalCorrections = 0;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    let newContent = content;
    let fileChanged = false;

    // 1. Fix imports: ../../constants -> @/constants
    // Also ../../constants/index -> @/constants

    if (newContent.includes('../../constants')) {
        newContent = newContent.replace(/\.\.\/\.\.\/constants/g, '@/constants');
        fileChanged = true;
        totalCorrections++;
    }
    if (newContent.includes('../constants')) {
        // Need to be careful with context, but generally @/constants is safer if it resolves to src/constants
        // But ../constants might be legitimate relative if file is deep.
        // However, all previous errors showed ../../constants.
        // Let's stick to ../../constants for now, or specific known patterns.
        // Actually, let's fix the specific one we know.
    }

    // 2. Fix broken Tailwind classes and hyphenated words
    // Pattern: " - " -> "-" inside strings?
    // Hard to distinguish from math.
    // But "items - center" is definitely wrong.
    // "text - xs", "font - mono"
    // Let's regex replace common Tailwind patterns with spaces.

    const tailwindFixes = [
        { regex: /items - center/g, replace: 'items-center' },
        { regex: /mx - (\d+)/g, replace: 'mx-$1' },
        { regex: /my - (\d+)/g, replace: 'my-$1' },
        { regex: /px - (\d+)/g, replace: 'px-$1' },
        { regex: /py - (\d+)/g, replace: 'py-$1' },
        { regex: /p - (\d+)/g, replace: 'p-$1' },
        { regex: /m - (\d+)/g, replace: 'm-$1' },
        { regex: /mt - (\d+)/g, replace: 'mt-$1' },
        { regex: /mb - (\d+)/g, replace: 'mb-$1' },
        { regex: /ml - (\d+)/g, replace: 'ml-$1' },
        { regex: /mr - (\d+)/g, replace: 'mr-$1' },
        { regex: /text - ([a-z]+)/g, replace: 'text-$1' }, // text-xs, text-white
        { regex: /bg - ([a-z]+)/g, replace: 'bg-$1' },
        { regex: /border - ([a-z]+)/g, replace: 'border-$1' },
        { regex: /rounded - ([a-z]+)/g, replace: 'rounded-$1' }, // rounded-lg
        { regex: /font - ([a-z]+)/g, replace: 'font-$1' }, // font-mono
        { regex: /transition - ([a-z]+)/g, replace: 'transition-$1' }, // transition-opacity
        { regex: /backdrop - blur - ([a-z]+)/g, replace: 'backdrop-blur-$1' },

        // Opacity Fixes: " // " -> "/" inside class strings
        // "white // 10" -> "white/10"
        // "black // 20" -> "black/20"
        // "emerald-500 // 20" -> "emerald-500/20"
        // regex: /([a-z0-9]) \/\/ (\d+)/g -> "$1/$2"
        // Also handling space variants: "white / 10" -> "white/10"

        { regex: /([a-z0-9]) \/\/ (\d+)/g, replace: '$1/$2' },
        { regex: /([a-z0-9]) \/ (\d+)/g, replace: '$1/$2' },

        // Remove spaces inside color definitions if any
        // "rgba( ... )"
    ];

    tailwindFixes.forEach(fix => {
        if (fix.regex.test(newContent)) {
            newContent = newContent.replace(fix.regex, fix.replace);
            fileChanged = true;
            totalCorrections++;
        }
    });

    if (fileChanged) {
        fs.writeFileSync(file, newContent, 'utf8');
        fixedCount++;
        console.log(`Fixed ${file}`);
    }
});

console.log(`Fixed ${totalCorrections} patterns in ${fixedCount} files.`);
