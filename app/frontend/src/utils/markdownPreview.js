import React from 'react';

function parseInlineMarkdown(text, keyPrefix) {
  const nodes = [];
  let index = 0;
  let nodeIndex = 0;

  while (index < text.length) {
    if (text.startsWith('**', index)) {
      const end = text.indexOf('**', index + 2);
      if (end > index + 2) {
        nodes.push(React.createElement(
          'strong',
          { key: `${keyPrefix}-strong-${nodeIndex}` },
          text.slice(index + 2, end),
        ));
        index = end + 2;
        nodeIndex += 1;
        continue;
      }
    }

    if (text[index] === '*') {
      const end = text.indexOf('*', index + 1);
      if (end > index + 1) {
        nodes.push(React.createElement(
          'em',
          { key: `${keyPrefix}-em-${nodeIndex}` },
          text.slice(index + 1, end),
        ));
        index = end + 1;
        nodeIndex += 1;
        continue;
      }
    }

    const nextBold = text.indexOf('**', index + 1);
    const nextItalic = text.indexOf('*', index + 1);
    const nextMarkers = [nextBold, nextItalic].filter((markerIndex) => markerIndex !== -1);
    const nextIndex = nextMarkers.length ? Math.min(...nextMarkers) : text.length;
    nodes.push(text.slice(index, nextIndex));
    index = nextIndex;
  }

  return nodes.length > 0 ? nodes : text;
}

function isHeading(trimmed) {
  return /^(#{1,3})\s+(.+)$/.test(trimmed);
}

function isHorizontalRule(trimmed) {
  return /^(-{3,}|\*{3,}|_{3,})$/.test(trimmed);
}

function isUnorderedListItem(trimmed) {
  return /^[-*]\s+/.test(trimmed);
}

export function renderMarkdownPreview(body) {
  const blocks = [];
  const lines = body.replace(/\r\n?/g, '\n').split('\n');
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    if (isHorizontalRule(trimmed)) {
      blocks.push(React.createElement('hr', { key: `hr-${index}` }));
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const HeadingTag = `h${headingMatch[1].length}`;
      blocks.push(React.createElement(
        HeadingTag,
        { key: `heading-${index}` },
        parseInlineMarkdown(headingMatch[2], `heading-${index}`),
      ));
      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const quoteLines = [];
      const startIndex = index;
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        quoteLines.push(lines[index].trim().replace(/^>\s?/, ''));
        index += 1;
      }

      blocks.push(React.createElement(
        'blockquote',
        { key: `quote-${startIndex}` },
        quoteLines.map((quoteLine, quoteIndex) => React.createElement(
          'p',
          { key: `quote-${startIndex}-${quoteIndex}` },
          parseInlineMarkdown(quoteLine, `quote-${startIndex}-${quoteIndex}`),
        )),
      ));
      continue;
    }

    if (isUnorderedListItem(trimmed)) {
      const items = [];
      const startIndex = index;
      while (index < lines.length && isUnorderedListItem(lines[index].trim())) {
        items.push(lines[index].trim().replace(/^[-*]\s+/, ''));
        index += 1;
      }

      blocks.push(React.createElement(
        'ul',
        { key: `list-${startIndex}` },
        items.map((item, itemIndex) => React.createElement(
          'li',
          { key: `list-${startIndex}-${itemIndex}` },
          parseInlineMarkdown(item, `list-${startIndex}-${itemIndex}`),
        )),
      ));
      continue;
    }

    const paragraphLines = [];
    const startIndex = index;
    while (
      index < lines.length
      && lines[index].trim()
      && !isHeading(lines[index].trim())
      && !lines[index].trim().startsWith('>')
      && !isUnorderedListItem(lines[index].trim())
      && !isHorizontalRule(lines[index].trim())
    ) {
      paragraphLines.push(lines[index].trim());
      index += 1;
    }

    blocks.push(React.createElement(
      'p',
      { key: `paragraph-${startIndex}` },
      parseInlineMarkdown(paragraphLines.join(' '), `paragraph-${startIndex}`),
    ));
  }

  return blocks.length > 0
    ? blocks
    : React.createElement('p', { className: 'preview-empty' }, 'No body text yet.');
}
