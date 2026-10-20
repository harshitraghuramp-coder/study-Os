import React, { useState } from 'react';
import { Check, Copy, Terminal, ExternalLink } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  // Split into blocks: code blocks, tables, math blocks, paragraphs
  const renderBlocks = () => {
    if (!content) return null;

    // Split content by code fences ```
    const codeBlockRegex = /```([a-zA-Z0-9_\-+]*)\n([\s\S]*?)```/g;
    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const textBefore = content.substring(lastIndex, match.index);
      if (textBefore.trim()) {
        elements.push(
          <div key={`text-${lastIndex}`} className="space-y-3">
            {renderNonCodeText(textBefore)}
          </div>
        );
      }

      const lang = match[1] || 'text';
      const code = match[2];
      elements.push(
        <CodeBlock key={`code-${match.index}`} language={lang} code={code} />
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      const textAfter = content.substring(lastIndex);
      if (textAfter.trim()) {
        elements.push(
          <div key={`text-${lastIndex}`} className="space-y-3">
            {renderNonCodeText(textAfter)}
          </div>
        );
      }
    }

    return elements;
  };

  // Render text that is not inside code fences
  const renderNonCodeText = (text: string): React.ReactNode => {
    const lines = text.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Block Math $$...$$ or \[...\]
      if (line.trim().startsWith('$$') && line.trim().endsWith('$$') && line.trim().length > 4) {
        const mathContent = line.trim().slice(2, -2).trim();
        nodes.push(<MathBlock key={`math-${i}`} formula={mathContent} />);
        i++;
        continue;
      }

      // Multi-line block math
      if (line.trim() === '$$' || line.trim() === '\\[') {
        let mathLines: string[] = [];
        i++;
        while (i < lines.length && lines[i].trim() !== '$$' && lines[i].trim() !== '\\]') {
          mathLines.push(lines[i]);
          i++;
        }
        i++; // skip closing $$
        nodes.push(<MathBlock key={`math-${i}`} formula={mathLines.join('\n')} />);
        continue;
      }

      // Markdown Tables
      if (line.includes('|') && i + 1 < lines.length && lines[i + 1].includes('|') && lines[i + 1].includes('-')) {
        const tableLines: string[] = [line, lines[i + 1]];
        i += 2;
        while (i < lines.length && lines[i].includes('|')) {
          tableLines.push(lines[i]);
          i++;
        }
        nodes.push(<TableBlock key={`table-${i}`} lines={tableLines} />);
        continue;
      }

      // Headings
      if (line.startsWith('# ')) {
        nodes.push(
          <h1 key={`h1-${i}`} className="text-lg font-bold text-neutral-100 tracking-tight pt-2 pb-1 border-b border-neutral-800/80">
            {renderInline(line.replace(/^#\s+/, ''))}
          </h1>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        nodes.push(
          <h2 key={`h2-${i}`} className="text-base font-bold text-neutral-100 tracking-tight pt-2 pb-0.5">
            {renderInline(line.replace(/^##\s+/, ''))}
          </h2>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        nodes.push(
          <h3 key={`h3-${i}`} className="text-sm font-semibold text-neutral-200 tracking-tight pt-1.5 pb-0.5">
            {renderInline(line.replace(/^###\s+/, ''))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('#### ')) {
        nodes.push(
          <h4 key={`h4-${i}`} className="text-xs font-semibold text-neutral-300 uppercase tracking-wider pt-1">
            {renderInline(line.replace(/^####\s+/, ''))}
          </h4>
        );
        i++;
        continue;
      }

      // Blockquotes / Callout notes
      if (line.startsWith('>')) {
        const quoteLines: string[] = [];
        while (i < lines.length && lines[i].startsWith('>')) {
          quoteLines.push(lines[i].replace(/^>\s?/, ''));
          i++;
        }
        const fullQuote = quoteLines.join(' ');
        const isTip = fullQuote.toLowerCase().includes('tip:') || fullQuote.toLowerCase().includes('note:');
        const isWarning = fullQuote.toLowerCase().includes('warning:') || fullQuote.toLowerCase().includes('caution:');

        nodes.push(
          <div
            key={`quote-${i}`}
            className={`border-l-2 rounded-r-xl p-3 my-2 text-xs leading-relaxed ${
              isWarning
                ? 'border-amber-500 bg-amber-500/10 text-amber-200'
                : isTip
                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-200'
                : 'border-neutral-700 bg-neutral-900/60 text-neutral-300'
            }`}
          >
            {renderInline(fullQuote)}
          </div>
        );
        continue;
      }

      // Unordered List (- or * or •)
      if (/^[-*•]\s+/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^[-*•]\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^[-*•]\s+/, ''));
          i++;
        }
        nodes.push(
          <ul key={`ul-${i}`} className="space-y-1.5 my-1.5 pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2 text-xs text-neutral-200 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        continue;
      }

      // Ordered List (1. 2. 3.)
      if (/^\d+\.\s+/.test(line)) {
        const listItems: string[] = [];
        while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
          listItems.push(lines[i].replace(/^\d+\.\s+/, ''));
          i++;
        }
        nodes.push(
          <ol key={`ol-${i}`} className="space-y-1.5 my-1.5 pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200 leading-relaxed">
                <span className="text-[11px] font-mono font-bold text-indigo-400 shrink-0 w-4 text-right">
                  {idx + 1}.
                </span>
                <span className="flex-1">{renderInline(item)}</span>
              </li>
            ))}
          </ol>
        );
        continue;
      }

      // Horizontal Divider
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
        nodes.push(<hr key={`hr-${i}`} className="border-neutral-800 my-3" />);
        i++;
        continue;
      }

      // Regular Paragraph
      nodes.push(
        <p key={`p-${i}`} className="text-xs text-neutral-200 leading-relaxed">
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return nodes;
  };

  // Inline formatting: Bold, Italic, Inline Code, Math, Links
  const renderInline = (text: string): React.ReactNode => {
    // Regex for bold **text**, inline code `code`, inline math $math$, links [title](url)
    const tokenRegex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$|\[[^\]]+\]\([^)]+\))/g;
    const parts = text.split(tokenRegex);

    return parts.map((part, index) => {
      if (!part) return null;

      // Bold **text**
      if (part.startsWith('**') && part.endsWith('**') && part.length >= 4) {
        return (
          <strong key={index} className="font-semibold text-neutral-100">
            {part.slice(2, -2)}
          </strong>
        );
      }

      // Italic *text*
      if (part.startsWith('*') && part.endsWith('*') && part.length >= 2) {
        return (
          <em key={index} className="italic text-neutral-300">
            {part.slice(1, -1)}
          </em>
        );
      }

      // Inline Code `code`
      if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
        return (
          <code
            key={index}
            className="px-1.5 py-0.5 mx-0.5 rounded-md bg-neutral-800/80 text-indigo-300 font-mono text-[11px] border border-neutral-700/60"
          >
            {part.slice(1, -1)}
          </code>
        );
      }

      // Inline Math $formula$
      if (part.startsWith('$') && part.endsWith('$') && part.length >= 2) {
        return (
          <span
            key={index}
            className="font-mono text-indigo-300 px-1 py-0.5 bg-indigo-950/40 rounded border border-indigo-800/40 text-[11px]"
          >
            {formatMathString(part.slice(1, -1))}
          </span>
        );
      }

      // Link [title](url)
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={index}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 inline-flex items-center gap-0.5"
          >
            <span>{linkMatch[1]}</span>
            <ExternalLink className="w-2.5 h-2.5 inline" />
          </a>
        );
      }

      return part;
    });
  };

  return <div className={`markdown-content space-y-3 ${className}`}>{renderBlocks()}</div>;
};

// Math Block Component with clean formatting
const MathBlock: React.FC<{ formula: string }> = ({ formula }) => {
  return (
    <div className="my-2.5 p-3 rounded-xl bg-neutral-900/90 border border-indigo-900/40 text-center font-mono text-xs text-indigo-300 overflow-x-auto select-all">
      <div className="inline-block py-1 px-2">{formatMathString(formula)}</div>
    </div>
  );
};

// Converts common LaTeX tokens into pleasant Unicode math notation
function formatMathString(latex: string): string {
  let str = latex;
  str = str.replace(/\\lim_\{([^}]+)\}/g, 'lim($1)');
  str = str.replace(/\\to\s*/g, ' → ');
  str = str.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1)/($2)');
  str = str.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '∑($1 to $2)');
  str = str.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '∫($1 to $2)');
  str = str.replace(/\\int/g, '∫');
  str = str.replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
  str = str.replace(/\\times/g, '×');
  str = str.replace(/\\div/g, '÷');
  str = str.replace(/\\pm/g, '±');
  str = str.replace(/\\infty/g, '∞');
  str = str.replace(/\\leq/g, '≤');
  str = str.replace(/\\geq/g, '≥');
  str = str.replace(/\\neq/g, '≠');
  str = str.replace(/\\approx/g, '≈');
  str = str.replace(/\\alpha/g, 'α');
  str = str.replace(/\\beta/g, 'β');
  str = str.replace(/\\gamma/g, 'γ');
  str = str.replace(/\\delta/g, 'δ');
  str = str.replace(/\\lambda/g, 'λ');
  str = str.replace(/\\pi/g, 'π');
  str = str.replace(/\\theta/g, 'θ');
  str = str.replace(/\\sigma/g, 'σ');
  str = str.replace(/\\Delta/g, 'Δ');
  str = str.replace(/\\cdot/g, '·');
  str = str.replace(/\\quad/g, '  ');
  str = str.replace(/\\,/g, ' ');
  return str;
}

// Code Block with Copy Button and Language Tag
const CodeBlock: React.FC<{ language: string; code: string }> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 text-neutral-200 text-xs shadow-md">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-neutral-900 border-b border-neutral-800/80">
        <div className="flex items-center gap-2 text-neutral-400">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-[11px] uppercase tracking-wider font-semibold text-neutral-300">
            {language || 'code'}
          </span>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors cursor-pointer"
          title="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <pre className="p-4 overflow-x-auto font-mono text-[11.5px] leading-relaxed select-text text-neutral-200 bg-neutral-950/90">
        <code>{code.trim()}</code>
      </pre>
    </div>
  );
};

// Table Block Component
const TableBlock: React.FC<{ lines: string[] }> = ({ lines }) => {
  if (lines.length < 2) return null;

  const headerLine = lines[0];
  const bodyLines = lines.slice(2); // Skip separator line

  const parseCells = (row: string) => {
    return row
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim());
  };

  const headers = parseCells(headerLine);

  return (
    <div className="my-3 overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/60 shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-neutral-800 bg-neutral-900/80">
            {headers.map((h, i) => (
              <th key={i} className="px-3.5 py-2.5 font-semibold text-neutral-200 border-r border-neutral-800/50 last:border-r-0">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800/60">
          {bodyLines.map((line, rowIdx) => {
            const cells = parseCells(line);
            return (
              <tr key={rowIdx} className="hover:bg-neutral-900/30 transition-colors">
                {cells.map((cell, colIdx) => (
                  <td key={colIdx} className="px-3.5 py-2 text-neutral-300 border-r border-neutral-800/50 last:border-r-0">
                    {cell}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
