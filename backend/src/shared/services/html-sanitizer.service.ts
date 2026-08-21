import { Injectable } from '@nestjs/common';

type SanitizeUrlOptions = {
  allowRelative?: boolean;
  allowedProtocols?: string[];
};

const BLOCKED_ELEMENTS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'option',
  'svg',
  'math',
  'meta',
  'link',
  'base',
  'frame',
  'frameset',
  'applet',
];

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'hr',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

@Injectable()
export class HtmlSanitizerService {
  sanitizeUrl(rawUrl: unknown, options: SanitizeUrlOptions = {}): string | null {
    if (typeof rawUrl !== 'string') return null;
    const trimmed = rawUrl.trim().replace(/[\u0000-\u001f\u007f\s]+/g, '');
    if (!trimmed) return null;

    const allowedProtocols = options.allowedProtocols || ['http:', 'https:', 'mailto:', 'tel:'];
    if (options.allowRelative && (trimmed.startsWith('/') || trimmed.startsWith('#'))) {
      return trimmed;
    }

    try {
      const parsed = new URL(trimmed);
      return allowedProtocols.includes(parsed.protocol) ? parsed.toString() : null;
    } catch {
      return null;
    }
  }

  sanitizeHtml(input: unknown): string {
    if (typeof input !== 'string' || !input) return '';

    let html = input;
    html = html.replace(/<!--[\s\S]*?-->/g, '');

    for (const tag of BLOCKED_ELEMENTS) {
      const elementPattern = new RegExp(`<${tag}\\b[\\s\\S]*?<\\/${tag}>`, 'gi');
      const selfClosingPattern = new RegExp(`<${tag}\\b[^>]*\\/?>`, 'gi');
      html = html.replace(elementPattern, '').replace(selfClosingPattern, '');
    }

    return html.replace(/<\/?([a-zA-Z0-9:-]+)([^>]*)>/g, (match, rawTag, rawAttrs = '') => {
      const tag = String(rawTag).toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return '';
      if (match.startsWith('</')) return `</${tag}>`;
      if (tag === 'br' || tag === 'hr') return `<${tag}>`;

      const attrs = this.sanitizeAttributes(tag, rawAttrs);
      return attrs ? `<${tag} ${attrs}>` : `<${tag}>`;
    });
  }

  private sanitizeAttributes(tag: string, rawAttrs: string): string {
    const attrs: string[] = [];
    const attrPattern = /([a-zA-Z0-9:-]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
    let match: RegExpExecArray | null;

    while ((match = attrPattern.exec(rawAttrs)) !== null) {
      const name = match[1].toLowerCase();
      const rawValue = match[3] ?? match[4] ?? match[5] ?? '';
      const value = this.escapeAttribute(rawValue);
      if (!name || name.startsWith('on') || ['style', 'srcdoc', 'xmlns', 'formaction'].includes(name)) continue;

      if (tag === 'a' && name === 'href') {
        const safeUrl = this.sanitizeUrl(rawValue, { allowRelative: false });
        if (safeUrl) attrs.push(`href="${this.escapeAttribute(safeUrl)}"`);
        continue;
      }

      if (tag === 'a' && name === 'target' && value === '_blank') {
        attrs.push('target="_blank"', 'rel="noopener noreferrer"');
        continue;
      }

      if (tag === 'img' && name === 'src') {
        const safeUrl = this.sanitizeUrl(rawValue, { allowRelative: true, allowedProtocols: ['http:', 'https:'] });
        if (safeUrl) attrs.push(`src="${this.escapeAttribute(safeUrl)}"`);
        continue;
      }

      if (tag === 'img' && ['alt', 'title'].includes(name)) {
        attrs.push(`${name}="${value}"`);
        continue;
      }

      if (['td', 'th'].includes(tag) && ['colspan', 'rowspan'].includes(name) && /^\d{1,2}$/.test(value)) {
        attrs.push(`${name}="${value}"`);
        continue;
      }

      if (tag === 'img' && ['width', 'height'].includes(name) && /^\d{1,4}$/.test(value)) {
        attrs.push(`${name}="${value}"`);
      }
    }

    return Array.from(new Set(attrs)).join(' ');
  }

  private escapeAttribute(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}
