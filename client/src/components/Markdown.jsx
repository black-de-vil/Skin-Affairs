import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Lightweight markdown — code fences, bold, italic, inline code,    */
/*  links, headings and simple lists. No external dependency, no raw  */
/*  HTML. Shared by ChatBox and Message so assistant replies render   */
/*  the same way everywhere (the model answers in markdown).          */
/* ------------------------------------------------------------------ */

const CopyIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
    <path d="M5 15V5a2 2 0 0 1 2-2h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const splitCodeBlocks = (content) => {
  const regex = /```(\w+)?\n?([\s\S]*?)```/g;
  const blocks = [];
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      blocks.push({ type: 'text', value: content.slice(lastIndex, match.index) });
    }
    blocks.push({ type: 'code', lang: match[1] || '', value: match[2].replace(/\n$/, '') });
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < content.length) {
    blocks.push({ type: 'text', value: content.slice(lastIndex) });
  }
  return blocks;
};

const parseInline = (text, keyBase) => {
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|\*[^*\n]+\*|\[[^\]]+\]\([^)]+\))/g;
  return text
    .split(pattern)
    .filter((part) => part !== undefined && part !== '')
    .map((part, i) => {
      const key = `${keyBase}-${i}`;
      if (/^`[^`]+`$/.test(part)) {
        return (
          <code
            key={key}
            className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 text-[0.85em] font-mono"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={key} className="font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (/^\*[^*]+\*$/.test(part)) {
        return <em key={key}>{part.slice(1, -1)}</em>;
      }
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={key}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 decoration-current/40 hover:decoration-current"
          >
            {linkMatch[1]}
          </a>
        );
      }
      return part;
    });
};

const isListParagraph = (lines) => lines.length > 0 && lines.every((l) => /^\s*([-*]|\d+\.)\s+/.test(l));

const renderParagraph = (text, key) => {
  const lines = text.split('\n').filter((l) => l.trim() !== '');

  if (isListParagraph(lines)) {
    const ordered = /^\s*\d+\.\s+/.test(lines[0]);
    const items = lines.map((l) => l.replace(/^\s*([-*]|\d+\.)\s+/, ''));
    const ListTag = ordered ? 'ol' : 'ul';
    return (
      <ListTag key={key} className={`pl-5 space-y-1 ${ordered ? 'list-decimal' : 'list-disc'}`}>
        {items.map((item, i) => (
          <li key={`${key}-li-${i}`} className="text-sm leading-relaxed">
            {parseInline(item, `${key}-li-${i}`)}
          </li>
        ))}
      </ListTag>
    );
  }

  // Markdown headings — the model uses them to structure longer answers
  const heading = lines.length === 1 && lines[0].match(/^(#{1,4})\s+(.*)$/);
  if (heading) {
    const level = heading[1].length;
    return (
      <p key={key} className={`font-semibold ${level <= 2 ? 'text-[15px]' : 'text-sm'} leading-snug`}>
        {parseInline(heading[2], key)}
      </p>
    );
  }

  return (
    <p key={key} className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {parseInline(text, key)}
    </p>
  );
};

export const CodeBlock = ({ lang, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — silently ignore */
    }
  };

  return (
    <div className="rounded-lg overflow-hidden border border-slate-700/60 bg-slate-900 not-prose">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 text-[11px] text-slate-400">
        <span className="font-mono">{lang || 'text'}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-slate-200 transition-colors"
        >
          {copied ? <CheckIcon className="w-3.5 h-3.5" /> : <CopyIcon className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="px-3 py-2.5 overflow-x-auto text-[13px] leading-relaxed text-slate-100 font-mono">
        <code>{value}</code>
      </pre>
    </div>
  );
};

/**
 * Renders a markdown string. Memoised because a long chat re-renders on
 * every keystroke in the composer, and re-parsing every answer each time
 * is what makes a long conversation feel sluggish.
 */
const Markdown = React.memo(({ content }) => {
  const blocks = splitCodeBlocks(content || '');
  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        if (block.type === 'code') {
          return <CodeBlock key={i} lang={block.lang} value={block.value} />;
        }
        return block.value
          .split(/\n{2,}/)
          .filter((p) => p.trim() !== '')
          .map((p, j) => renderParagraph(p, `${i}-${j}`));
      })}
    </div>
  );
});

Markdown.displayName = 'Markdown';

export default Markdown;
