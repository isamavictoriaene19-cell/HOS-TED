import React from 'react';

/**
 * Formats Tessy Ai replies immediately into clean bold, italic, and structured typography
 * while completely hiding raw markdown symbols like #, *, **, __, or `.
 */
export function normalizeHostedBrandText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\bHOS\s*\|\s*TED\b/gi, 'HOS|TED')
    .replace(/\bhosted\b/gi, 'HOS|TED');
}

export function renderFormattedTessyReply(content: string): React.ReactNode {
  if (!content) return null;

  const lines = normalizeHostedBrandText(content).split('\n');

  const formatInline = (text: string, lineKey: string): React.ReactNode[] => {
    // Clean any backticks or stray triple asterisks
    const normalized = text.replace(/`/g, '');

    // Match **bold**, *italic*, or __bold__
    const tokenRegex = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_)/g;
    const parts = normalized.split(tokenRegex);

    return parts.map((part, idx) => {
      const key = `${lineKey}-${idx}`;
      if (
        (part.startsWith('**') && part.endsWith('**') && part.length > 4) ||
        (part.startsWith('__') && part.endsWith('__') && part.length > 4)
      ) {
        const inner = part.slice(2, -2).replace(/[*#_]/g, '');
        return (
          <strong key={key} className="font-bold text-amber-300">
            {inner}
          </strong>
        );
      }
      if (
        (part.startsWith('*') && part.endsWith('*') && part.length > 2) ||
        (part.startsWith('_') && part.endsWith('_') && part.length > 2)
      ) {
        const inner = part.slice(1, -1).replace(/[*#_]/g, '');
        return (
          <em key={key} className="italic text-amber-100">
            {inner}
          </em>
        );
      }
      // Strip any unmatched stray * or # symbols so they are never shown raw
      const cleanPlain = part.replace(/[*#]/g, '');
      return <React.Fragment key={key}>{cleanPlain}</React.Fragment>;
    });
  };

  return (
    <div className="space-y-1.5">
      {lines.map((rawLine, lineIdx) => {
        const trimmed = rawLine.trim();
        if (!trimmed) {
          return <div key={`spacer-${lineIdx}`} className="h-1.5" />;
        }

        // Heading lines starting with #, ##, ###
        if (/^#{1,6}\s+/.test(trimmed)) {
          const headingText = trimmed.replace(/^#{1,6}\s+/, '');
          return (
            <div
              key={`h-${lineIdx}`}
              className="font-serif font-bold text-amber-300 text-sm sm:text-base pt-1"
            >
              {formatInline(headingText, `h-${lineIdx}`)}
            </div>
          );
        }

        // Bullet points starting with *, -, or •
        if (/^([*\-•])\s+/.test(trimmed)) {
          const bulletText = trimmed.replace(/^([*\-•])\s+/, '');
          return (
            <div key={`li-${lineIdx}`} className="flex items-start gap-2 pl-1">
              <span className="text-amber-400 font-bold select-none">•</span>
              <span className="flex-1">{formatInline(bulletText, `li-${lineIdx}`)}</span>
            </div>
          );
        }

        return (
          <div key={`p-${lineIdx}`} className="leading-relaxed">
            {formatInline(rawLine, `p-${lineIdx}`)}
          </div>
        );
      })}
    </div>
  );
}
