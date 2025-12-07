
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
let totalLines = 0;

files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n'); // Split by \n, handle \r in logic
    let changed = false;

    const newLines = lines.map((line, index) => {
        // We are looking for lines we broke: ") // "
        // We want to revert " // " to " / " if it looks like math.

        // Regex: Look for ") // " followed by whitespace and then alphanumeric (variable/number) or parenthesis.
        // We use a safe heuristic: if it starts with lowercase or number, it's code.
        // If it starts with Uppercase, we assume it's a comment (risk: uppercase constants, but less likely to be divided by directly without space? constants usually UP_CASE).

        const pattern = /\) \/\/ (\s*[a-z0-9_(])/;

        if (pattern.test(line)) {
            // Replace ") // " with ") / "
            // We need to be careful not to replace actual comments if they start with lowercase (though style guide usually caps).
            // But better to break a comment (syntax error 'unknown token' maybe?) than break code logic.
            // Wait, if I revert a comment `) // note` to `) / note`, it becomes `) / note`.
            // ReferenceError: note is not defined. It will cause build error.
            // But right now we have SyntaxError `expected )`.
            // So checking build errors is a way to find remaining issues.

            // Let's rely on the heuristic: most variables are lowercase. numbers are digits.
            // "liquidation..." is lowercase.
            // "5" is digit.

            // Also "Math.PI" (Uppercase M).
            // So `[a-zA-Z0-9]` might be safer if we exclude common comment words?
            // No, comments are English.

            const match = line.match(/\) \/\/ (\s*)(.)/);
            if (match) {
                const char = match[2];
                // If char is lowercase, digit, or '(', or '_' -> Revert
                if (/[a-z0-9_(\$]/.test(char)) {
                    console.log(`Repairing ${file}:${index + 1}:`);
                    console.log(`  Broken: ${line.trim()}`);
                    const repaired = line.replace(') // ', ') / ');
                    console.log(`  Fixed:  ${repaired.trim()}`);
                    changed = true;
                    totalLines++;
                    return repaired;
                }
            }
        }
        return line;
    });

    if (changed) {
        fs.writeFileSync(file, newLines.join('\n'), 'utf8');
        fixedCount++;
    }
});

console.log(`Repaired ${totalLines} lines in ${fixedCount} files.`);
