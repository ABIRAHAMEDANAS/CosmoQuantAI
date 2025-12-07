
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
    // We use replace with regex directly on content if safe, or line by line.
    // Line by line is safer for logging.

    const lines = content.split(/\r?\n/);
    let fileChanged = false;

    const newLines = lines.map((line, index) => {
        let newLine = line;

        // Patterns to fix:
        // ", / " -> ", // "
        // "{ / " -> "{ // "
        // "[ / " -> "[ // "
        // ": / " -> ": // "

        // We look for these literals.
        const patterns = [
            { search: ', / ', replace: ', // ' },
            { search: '{ / ', replace: '{ // ' },
            { search: '[ / ', replace: '[ // ' },
            { search: ': / ', replace: ': // ' }
        ];

        let lineModified = false;

        patterns.forEach(p => {
            if (newLine.includes(p.search)) {
                // Heuristic: check if inside string?
                // Basic check: count quotes? Too complex.
                // Assuming low risk of "text , / text" in strings in this codebase.
                // The space after delimiter matches the coding style of the errors seen.

                // Replace ALL occurrences in line
                const parts = newLine.split(p.search);
                if (parts.length > 1) {
                    newLine = parts.join(p.replace);
                    lineModified = true;
                }
            }
        });

        if (lineModified) {
            console.log(`Fixing ${file}:${index + 1}:`);
            console.log(`  Old: ${line.trim()}`);
            console.log(`  New: ${newLine.trim()}`);
            fileChanged = true;
            totalCorrections++;
        }

        return newLine;
    });

    if (fileChanged) {
        fs.writeFileSync(file, newLines.join('\n'), 'utf8');
        fixedCount++;
    }
});

console.log(`Fixed ${totalCorrections} patterns in ${fixedCount} files.`);
