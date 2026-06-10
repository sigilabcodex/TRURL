import React from 'react';

function parseInlineMarkdown(text) {
  const nodes = [];
  let index = 0;

  while (index < text.length) {
    if (text.startsWith('**', index)) {
      const end = text.indexOf('**', index + 2);
      if (end > index + 2) {
        nodes.push({ type: 'strong', text: text.slice(index + 2, end) });
        index = end + 2;
        continue;
      }
    }

    if (text[index] === '*') {
      const end = text.indexOf('*', index + 1);
      if (end > index + 1) {
        nodes.push({ type: 'em', text: text.slice(index + 1, end) });
        index = end + 1;
        continue;
      }
    }

    const nextBold = text.indexOf('**', index + 1);
    const nextItalic = text.indexOf('*', index + 1);
    const nextMarkers = [nextBold, nextItalic].filter((markerIndex) => markerIndex !== -1);
    const nextIndex = nextMarkers.length ? Math.min(...nextMarkers) : text.length;
    nodes.push({ type: 'text', text: text.slice(index, nextIndex) });
    index = nextIndex;
  }

  return nodes.length > 0 ? nodes : [{ type: 'text', text }];
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

export function parseMarkdownPreview(body) {
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
      blocks.push({ type: 'hr' });
      index += 1;
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        children: parseInlineMarkdown(headingMatch[2]),
      });
      index += 1;
      continue;
    }

    if (trimmed.startsWith('>')) {
      const paragraphs = [];
      while (index < lines.length && lines[index].trim().startsWith('>')) {
        paragraphs.push(parseInlineMarkdown(lines[index].trim().replace(/^>\s?/, '')));
        index += 1;
      }

      blocks.push({ type: 'blockquote', paragraphs });
      continue;
    }

    if (isUnorderedListItem(trimmed)) {
      const items = [];
      while (index < lines.length && isUnorderedListItem(lines[index].trim())) {
        items.push(parseInlineMarkdown(lines[index].trim().replace(/^[-*]\s+/, '')));
        index += 1;
      }

      blocks.push({ type: 'list', items });
      continue;
    }

    const paragraphLines = [];
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

    blocks.push({
      type: 'paragraph',
      children: parseInlineMarkdown(paragraphLines.join(' ')),
    });
  }

  return blocks;
}

function renderInlineNodes(nodes, keyPrefix) {
  return nodes.map((node, index) => {
    if (node.type === 'strong') {
      return React.createElement('strong', { key: `${keyPrefix}-strong-${index}` }, node.text);
    }

    if (node.type === 'em') {
      return React.createElement('em', { key: `${keyPrefix}-em-${index}` }, node.text);
    }

    return node.text;
  });
}

function renderBlock(block, index) {
  if (block.type === 'hr') {
    return React.createElement('hr', { key: `hr-${index}` });
  }

  if (block.type === 'heading') {
    return React.createElement(
      `h${block.level}`,
      { key: `heading-${index}` },
      renderInlineNodes(block.children, `heading-${index}`),
    );
  }

  if (block.type === 'blockquote') {
    return React.createElement(
      'blockquote',
      { key: `quote-${index}` },
      block.paragraphs.map((paragraph, paragraphIndex) => React.createElement(
        'p',
        { key: `quote-${index}-${paragraphIndex}` },
        renderInlineNodes(paragraph, `quote-${index}-${paragraphIndex}`),
      )),
    );
  }

  if (block.type === 'list') {
    return React.createElement(
      'ul',
      { key: `list-${index}` },
      block.items.map((item, itemIndex) => React.createElement(
        'li',
        { key: `list-${index}-${itemIndex}` },
        renderInlineNodes(item, `list-${index}-${itemIndex}`),
      )),
    );
  }

  return React.createElement(
    'p',
    { key: `paragraph-${index}` },
    renderInlineNodes(block.children, `paragraph-${index}`),
  );
}

export function renderMarkdownPreview(body) {
  const blocks = parseMarkdownPreview(body);

  return blocks.length > 0
    ? blocks.map(renderBlock)
    : React.createElement('p', { className: 'preview-empty' }, 'No body text yet.');
}
