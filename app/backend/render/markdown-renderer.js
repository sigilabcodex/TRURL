import MarkdownIt from 'markdown-it';

const markdown = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: false,
  breaks: false,
});

export function renderMarkdownBody(body) {
  return markdown.render(body);
}
