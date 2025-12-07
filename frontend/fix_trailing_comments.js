
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
    const lines = content.split(/\r?\n/);
    let fileChanged = false;

    const newLines = lines.map((line, index) => {
        let newLine = line;

        // Match: (Code) (Semicolon/Brace/Comma/Colon) (Whitespace+) (Slash) (Space) (Comment)
        // Regex to capture: ([;},:])(\s+)\/(\s+)
        // We replace with: $1$2//$3

        // We want to be careful not to match inside strings, but regex is greedy/simple.
        // Given previous errors, this pattern is the culprit.

        // Also handle Space+Slash+Space if preceding char is not > (JSX close)
        // But let's focus on the separators we know: ; } , : )

        const regex = /([;},:\)])(\s+)\/(\s+)(.*)$/;
        const match = newLine.match(regex);

        if (match) {
            // match[1] = separator (e.g. ;)
            // match[2] = whitespace gap
            // match[3] = whitespace after slash (before comment text, usually 1 space)
            // match[4] = rest (comment text)

            // Check double slash existence to avoid double comments
            if (newLine.includes('//')) {
                // Already has comment? check if the slash is BEFORE the double slash?
                // Example: "code; / comment // nested" -> unlikely.
                // "code; // comment" -> match regex? No, regex expects SINGLE slash.
                // But "/" matches the first slash of "//".
                // Wait: regex looks for /([;},:\)])(\s+)\/(\s+)(.*)$/
                // If line is "; // comment", match[0] is "; // comment"
                // match[1] = ;
                // match[2] = " "
                // match[3] = " " (if comment text has space)

                // If it is "//", then the character AFTER the matched slash is '/'.
                // Let's check that.
                const separator = match[1];
                const gap = match[2];
                const afterSlash = match[3];

                // If the text starting at the slash position starts with "/", it is ALREADY a double slash.
                // newLine content index of substring match?
                // Easier: check if string part after the separator+gap starts with "//"
                // const partToCheck = newLine.substring(newLine.indexOf(separator) + 1 + gap.length);
                // No, indexOf might find earlier separator.
            }

            // Better Regex that excludes double slash:
            // Match slash that is NOT followed by another slash.
            // /([;},:\)])(\s+)\/(?!\/)(.*)$/

            const strictRegex = /([;},:\)])(\s+)\/(?!\/)(.*)$/;
            if (strictRegex.test(newLine)) {
                // EXCEPTION: Division.
                // separator = ')' -> division possible.
                // separator = '}' -> division possible? (block expr / x)
                // separator = ',' -> division disallowed.
                // separator = ';' -> division disallowed.
                // separator = ':' -> division disallowed.

                const m = newLine.match(strictRegex);
                if (m) {
                    const separator = m[1];
                    const gap = m[2];
                    const rest = m[3]; // includes space after slash if any

                    if (separator === ')' || separator === '}') {
                        // Check if 'rest' looks like comment text (Starts with space + Uppercase)
                        // Or matches known bad patterns.
                        // rest content: " comment..."
                        // If it starts with space, we check next char.

                        // Heuristic: If rest starts with digit or lowercase, skip (likely division).
                        // If starts with Uppercase or specific chars, replace.
                        // Or if gap is LARGE (e.g. > 1 space), implies alignment -> Comment.

                        const trimmedRest = rest.trim();
                        if (trimmedRest && /^[A-Z\u0980-\u09FF]/.test(trimmedRest)) { // Uppercase or Bangla
                            // Likely comment
                            newLine = newLine.replace(strictRegex, '$1$2//$3');
                        } else if (gap.length > 1) {
                            // "tabbed" alignment -> comment
                            newLine = newLine.replace(strictRegex, '$1$2//$3');
                        }
                    } else {
                        // separator is ; , : -> Almost certainly comment
                        newLine = newLine.replace(strictRegex, '$1$2//$3');
                    }
                }
            }
        }

        if (newLine !== line) {
            console.log(`Fixing ${file}:${index + 1}:`);
            console.log(`  Old: ${line}`);
            console.log(`  New: ${newLine}`);
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

console.log(`Fixed ${totalCorrections} lines in ${fixedCount} files.`);
