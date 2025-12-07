
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
let fixedFiles = 0;
let totalCorrections = 0;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    let fileChanged = false;

    const newLines = lines.map((line, index) => {
        let newLine = line;

        // 1. Check for full line comments (already detected, but running again ensures completeness)
        const trimmed = line.trim();
        if (trimmed.startsWith('/') &&
            !trimmed.startsWith('//') &&
            !trimmed.startsWith('/*') &&
            !trimmed.startsWith('/>') &&
            !trimmed.startsWith('/ >')) {

            const match = line.match(/^(\s*)\/(.*)$/);
            if (match) {
                const indentation = match[1];
                const rest = match[2];
                if (rest.startsWith(' ')) {
                    newLine = `${indentation}//${rest}`;
                }
            }
        }

        // 2. Check for inline comments
        // Pattern: "; / ", "} / ", ") / "
        // We replace " / " with " // " in these specific contexts

        const inlinePatterns = ['; / ', '} / ', ') / '];
        let replaced = false;

        for (const pattern of inlinePatterns) {
            if (newLine.includes(pattern)) {
                // Check if it's already double slash (unlikely if we look for "; / ")
                // But avoid replacing if it's in a string? Hard to tell without parsing.
                // Assuming standard code.
                // If we find "; / ", replace with "; // "
                // The pattern includes the space after slash, so we replace "/" with "//" effectively

                // We use replace to target the specific occurrence
                // Note: pattern is literal string
                // We want to replace " / " within that pattern with " // "
                // e.g. "; / " -> "; // "
                const replacement = pattern.replace(' / ', ' // ');
                if (newLine.includes(pattern) && !newLine.includes(replacement)) {
                    // Check if it's followed by "/>" (closing tag)? No, pattern has space.
                    newLine = newLine.replace(pattern, replacement);
                    replaced = true;
                }
            }
        }

        // Also catch "const x = ...; / comment" where semi-colon might be missing?
        // But usually there's a semi-colon.
        // What about `const duration = 1500; / Total ...`

        if (newLine !== line) {
            console.log(`Fixing ${file}:${index + 1}:`);
            console.log(`  Old: ${line.trim()}`);
            console.log(`  New: ${newLine.trim()}`);
            fileChanged = true;
            totalCorrections++;
            return newLine;
        }

        return line;
    });

    if (fileChanged) {
        fs.writeFileSync(file, newLines.join('\n'), 'utf8');
        fixedFiles++;
    }
});

console.log(`Fixed ${totalCorrections} lines in ${fixedFiles} files.`);
