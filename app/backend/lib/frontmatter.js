function coerceValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^-?\d+$/.test(value)) return Number(value);
  return value.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
}

export function parseYamlLikeBlock(block) {
  const lines = block.split('\n');
  const output = {};
  let currentListKey = null;

  for (const line of lines) {
    if (!line.trim()) continue;

    const listItemMatch = line.match(/^\s*[-]\s+(.*)$/);
    if (listItemMatch && currentListKey) {
      output[currentListKey].push(coerceValue(listItemMatch[1].trim()));
      continue;
    }

    const kvMatch = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!kvMatch) continue;

    const [, key, rawValue] = kvMatch;
    if (rawValue === '') {
      output[key] = [];
      currentListKey = key;
    } else {
      output[key] = coerceValue(rawValue.trim());
      currentListKey = null;
    }
  }

  return output;
}

export function extractFrontmatter(raw) {
  const frontmatterMatch = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!frontmatterMatch) {
    return { frontmatter: {}, body: raw };
  }

  const frontmatter = parseYamlLikeBlock(frontmatterMatch[1]);
  const body = raw.slice(frontmatterMatch[0].length);
  return { frontmatter, body };
}

export function getRawFrontmatterBlock(raw) {
  const frontmatterMatch = raw.match(/^---\n[\s\S]*?\n---\n?/);
  return frontmatterMatch ? frontmatterMatch[0] : '';
}
