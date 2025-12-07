import React, { useRef, useEffect } from 'react';

const pythonKeywords = [
    'def', 'return', 'import', 'from', 'class', 'if', 'else', 'elif', 'for', 'while', 'in', 'and', 'or', 'not', 'is', 'None', 'True', 'False', 'with', 'as', 'try', 'except', 'finally', 'raise', 'assert', 'del', 'global', 'nonlocal', 'lambda', 'pass', 'yield'
];

const highlightSyntax = (code: string) => {
    return code
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') // HTML escape
        .replace(/(#.*$)/gm, '<span class="token-comment">$1</span>') // Comments
        .replace(/('.*?'|".*?")/g, '<span class="token-string">$1</span>') // Strings
        .replace(new RegExp(`\\b(${pythonKeywords.join('|')})\\b`, 'g'), '<span class="token-keyword">$1</span>') // Keywords
        .replace(/\b(\d+\.?\d*)\b/g, '<span class="token-number">$1</span>') // Numbers
        .replace(/([a-zA-Z_]\w*)\s*(?=\()/g, '<span class="token-function">$1</span>'); // Function names before parentheses
};


interface CodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    language?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    // Fix: Specified the correct ref type 'HTMLPreElement' for the <pre> tag.
    const preRef = useRef<HTMLPreElement>(null);

    const syncScroll = () => {
        if (textareaRef.current && preRef.current) {
            preRef.current.scrollTop = textareaRef.current.scrollTop;
            preRef.current.scrollLeft = textareaRef.current.scrollLeft;
        }
    };

    useEffect(() => {
        syncScroll();
    }, [value]);

    // Add a newline to prevent last line from being cut off and for better scrolling
    const highlightedCode = highlightSyntax(value) + '\n';

    return (
        <div className="relative h-full w-full">
            <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onScroll={syncScroll}
                className="absolute inset-0 z-10 w-full h-full bg-transparent text-transparent caret-white font-mono text-sm p-4 border-0 rounded-md resize-none outline-none leading-relaxed tracking-wide"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
            />
            <pre
                ref={preRef}
                aria-hidden="true"
                className="absolute inset-0 w-full h-full bg-gray-900 text-gray-200 font-mono text-sm p-4 rounded-md border border-brand-border-dark resize-none overflow-auto pointer-events-none leading-relaxed tracking-wide"
            >
                <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
            </pre>
        </div>
    );
};

export default CodeEditor;
