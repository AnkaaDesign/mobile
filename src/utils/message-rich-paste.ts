/**
 * Rich Paste → Message Blocks (mobile)
 *
 * Mobile counterpart of web's `src/utils/message-rich-paste.ts`. It produces the
 * EXACT same ContentBlock output (same block types, same fontSize tokens, same
 * inline markdown markers, same header/footer decorator variants) so a message
 * pasted on mobile renders identically to one pasted on web.
 *
 * The only platform difference is the HTML reader: React Native has no
 * `DOMParser`, so we use a small self-contained tokenizer (no deps) that applies
 * the same walking rules as the web DOM walk. Inline formatting is encoded with
 * the shared markers (see utils/markdown-formatting.ts):
 *   **bold**  *italic*  __underline__  [text](url)
 *
 * Text color is deliberately NOT carried over: pasted content nests colored
 * spans, which would emit nested {c:..} markers the flat parser cannot handle.
 */

import type { ContentBlock, DecoratorVariant } from '@/components/administration/message/form/editor/types';

// ─── id generation ────────────────────────────────────────────────────────────
let seq = 0;
function blockId(): string {
  return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${seq++}`;
}

// ─── block factories ──────────────────────────────────────────────────────────
function paragraph(content: string): ContentBlock {
  return { id: blockId(), type: 'paragraph', content, fontSize: 'base', fontWeight: 'normal' };
}
function heading(type: 'heading1' | 'heading2', content: string): ContentBlock {
  return type === 'heading1'
    ? { id: blockId(), type, content, fontSize: '2xl', fontWeight: 'bold' }
    : { id: blockId(), type, content, fontSize: 'xl', fontWeight: 'semibold' };
}
function quote(content: string): ContentBlock {
  return { id: blockId(), type: 'quote', content, fontSize: 'lg', fontWeight: 'normal' };
}
function list(items: string[], ordered: boolean): ContentBlock {
  return { id: blockId(), type: 'list', items, ordered };
}
function divider(): ContentBlock {
  return { id: blockId(), type: 'divider' };
}
function spacer(height: 'sm' | 'md' | 'lg' | 'xl' = 'sm'): ContentBlock {
  return { id: blockId(), type: 'spacer', height };
}

// ─── minimal HTML tokenizer (no DOM) ──────────────────────────────────────────
type MNode =
  | { t: 'text'; v: string }
  | { t: 'el'; tag: string; style: string; href?: string; children: MNode[] };

const VOID_TAGS = new Set([
  'br', 'img', 'hr', 'input', 'meta', 'link', 'col', 'area', 'base', 'source', 'wbr', 'embed',
]);

// Named HTML entities common in pasted (esp. Portuguese Word/Docs) content.
// Web gets these for free via DOMParser; the mobile tokenizer must decode them.
const NAMED_ENTITIES: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã', auml: 'ä', aring: 'å', aelig: 'æ',
  ccedil: 'ç', egrave: 'è', eacute: 'é', ecirc: 'ê', euml: 'ë',
  igrave: 'ì', iacute: 'í', icirc: 'î', iuml: 'ï', ntilde: 'ñ',
  ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ', ouml: 'ö', oslash: 'ø',
  ugrave: 'ù', uacute: 'ú', ucirc: 'û', uuml: 'ü', yacute: 'ý', yuml: 'ÿ',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã', Auml: 'Ä',
  Ccedil: 'Ç', Egrave: 'È', Eacute: 'É', Ecirc: 'Ê', Euml: 'Ë',
  Igrave: 'Ì', Iacute: 'Í', Icirc: 'Î', Iuml: 'Ï', Ntilde: 'Ñ',
  Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ', Ouml: 'Ö',
  Ugrave: 'Ù', Uacute: 'Ú', Ucirc: 'Û', Uuml: 'Ü',
  mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”',
  laquo: '«', raquo: '»', middot: '·', bull: '•', deg: '°', ordm: 'º', ordf: 'ª',
  copy: '©', reg: '®', trade: '™', euro: '€', pound: '£', cent: '¢', sect: '§',
  times: '×', divide: '÷',
};

function decodeEntities(s: string): string {
  if (s.indexOf('&') === -1) return s;
  return s
    .replace(/&#(\d+);/g, (_, d) => {
      try { return String.fromCodePoint(parseInt(d, 10)); } catch { return ''; }
    })
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => {
      try { return String.fromCodePoint(parseInt(h, 16)); } catch { return ''; }
    })
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name) =>
      NAMED_ENTITIES[name] !== undefined ? NAMED_ENTITIES[name] : m,
    );
}

function attrOf(attrs: string, name: string): string {
  const re = new RegExp(`${name}\\s*=\\s*"([^"]*)"|${name}\\s*=\\s*'([^']*)'`, 'i');
  const m = attrs.match(re);
  return m ? (m[1] ?? m[2] ?? '') : '';
}

function parseHtml(html: string): MNode[] {
  const s = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!doctype[^>]*>/gi, '')
    .replace(/<(script|style|head|title)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\/?(html|body|meta|link)[^>]*>/gi, '');

  const root: Extract<MNode, { t: 'el' }> = { t: 'el', tag: 'root', style: '', children: [] };
  const stack: Array<Extract<MNode, { t: 'el' }>> = [root];
  const push = (n: MNode) => stack[stack.length - 1].children.push(n);

  const tagRe = /<\/?([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)\/?>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(s)) !== null) {
    if (m.index > last) {
      const text = decodeEntities(s.slice(last, m.index));
      if (text) push({ t: 'text', v: text });
    }
    last = m.index + m[0].length;
    const raw = m[0];
    const tag = m[1].toLowerCase();
    const isClose = raw.startsWith('</');
    const selfClose = raw.endsWith('/>') || VOID_TAGS.has(tag);

    if (isClose) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) { stack.length = i; break; }
      }
    } else {
      const attrs = m[2] || '';
      const el: Extract<MNode, { t: 'el' }> = {
        t: 'el',
        tag,
        style: attrOf(attrs, 'style'),
        href: tag === 'a' ? attrOf(attrs, 'href') : undefined,
        children: [],
      };
      push(el);
      if (!selfClose) stack.push(el);
    }
  }
  if (last < s.length) {
    const text = decodeEntities(s.slice(last));
    if (text) push({ t: 'text', v: text });
  }
  return root.children;
}

// ─── inline style detection ───────────────────────────────────────────────────
function styleProp(style: string, prop: string): string {
  const m = style.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
  return m ? m[1].trim().toLowerCase() : '';
}
// Considers BOTH tag and inline style. An explicit style override wins over the
// tag — crucial for Google Docs, which wraps the whole paste in
// <b style="font-weight:normal"> (tag-only detection would bold everything).
function isBoldEl(tag: string, style: string): boolean {
  const fw = styleProp(style, 'font-weight');
  const n = parseInt(fw, 10);
  if (fw === 'normal' || (!Number.isNaN(n) && n < 600)) return false;
  if (tag === 'b' || tag === 'strong') return true;
  return fw === 'bold' || fw === 'bolder' || (!Number.isNaN(n) && n >= 600);
}
function isItalicEl(tag: string, style: string): boolean {
  const fs = styleProp(style, 'font-style');
  if (fs === 'normal') return false;
  return tag === 'i' || tag === 'em' || fs.includes('italic');
}
function isUnderlineEl(tag: string, style: string): boolean {
  const td = `${styleProp(style, 'text-decoration')} ${styleProp(style, 'text-decoration-line')}`;
  if (td.includes('underline')) return true;
  return tag === 'u' && !td.includes('none');
}

// ─── inline serialization (MNode → markdown string) ───────────────────────────
interface ActiveFormats {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

function serializeInline(node: MNode, active: ActiveFormats = {}): string {
  if (node.t === 'text') {
    return node.v.replace(/\s+/g, ' ');
  }
  const { tag, style } = node;
  if (tag === 'br') return '\n';

  const elBold = isBoldEl(tag, style);
  const elItalic = isItalicEl(tag, style);
  const elUnderline = isUnderlineEl(tag, style);

  const childActive: ActiveFormats = {
    bold: active.bold || elBold,
    italic: active.italic || elItalic,
    underline: active.underline || elUnderline,
  };

  let inner = node.children.map((c) => serializeInline(c, childActive)).join('');
  if (!inner.trim()) return inner;

  if (tag === 'a' && node.href) inner = `[${inner}](${node.href})`;
  if (elUnderline && !active.underline) inner = `__${inner}__`;
  if (elItalic && !active.italic) inner = `*${inner}*`;
  if (elBold && !active.bold) inner = `**${inner}**`;
  return inner;
}

function cleanInline(s: string): string {
  return s
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─── block-level walk ─────────────────────────────────────────────────────────
const BLOCK_TAGS = new Set([
  'p', 'div', 'section', 'article', 'header', 'footer', 'figure', 'main',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'blockquote', 'table', 'pre', 'hr',
]);

function isBlockEl(node: MNode): node is Extract<MNode, { t: 'el' }> {
  return node.t === 'el' && BLOCK_TAGS.has(node.tag);
}
function hasBlockChild(node: Extract<MNode, { t: 'el' }>): boolean {
  return node.children.some((c) => c.t === 'el' && BLOCK_TAGS.has(c.tag));
}

function listItems(node: Extract<MNode, { t: 'el' }>, ordered: boolean): ContentBlock {
  const items = node.children
    .filter((c): c is Extract<MNode, { t: 'el' }> => c.t === 'el' && c.tag === 'li')
    .map((li) => cleanInline(serializeInline(li)).replace(/\n+/g, ' '))
    .filter(Boolean);
  return list(items.length ? items : [''], ordered);
}

function tableToParagraphs(node: Extract<MNode, { t: 'el' }>, out: ContentBlock[]): void {
  const rows: Array<Extract<MNode, { t: 'el' }>> = [];
  const collectRows = (n: Extract<MNode, { t: 'el' }>) => {
    for (const c of n.children) {
      if (c.t !== 'el') continue;
      if (c.tag === 'tr') rows.push(c);
      else collectRows(c);
    }
  };
  collectRows(node);
  for (const tr of rows) {
    const cells = tr.children
      .filter((c): c is Extract<MNode, { t: 'el' }> => c.t === 'el' && (c.tag === 'td' || c.tag === 'th'))
      .map((c) => cleanInline(serializeInline(c)).replace(/\n+/g, ' '))
      .filter(Boolean);
    if (cells.length) out.push(paragraph(cells.join('   ')));
  }
}

function walk(nodes: MNode[], out: ContentBlock[]): void {
  let buf = '';
  const flush = () => {
    const text = cleanInline(buf);
    buf = '';
    if (text) out.push(paragraph(text));
  };

  for (const node of nodes) {
    if (node.t === 'text') {
      if (node.v.trim()) buf += node.v.replace(/\s+/g, ' ');
      continue;
    }
    const tag = node.tag;
    if (tag === 'br') { buf += '\n'; continue; }
    if (!isBlockEl(node)) {
      // Inline element — but Google Docs wraps block <p>/<ul> inside an outer
      // inline <b>; descend so that nested structure isn't flattened into one line.
      if (hasBlockChild(node)) { flush(); walk(node.children, out); }
      else { buf += serializeInline(node); }
      continue;
    }

    flush(); // a block element ends the current inline run

    switch (tag) {
      case 'h1': {
        const c = cleanInline(serializeInline(node)).replace(/\n+/g, ' ');
        if (c) out.push(heading('heading1', c));
        break;
      }
      case 'h2': case 'h3': case 'h4': case 'h5': case 'h6': {
        const c = cleanInline(serializeInline(node)).replace(/\n+/g, ' ');
        if (c) out.push(heading('heading2', c));
        break;
      }
      case 'ul': out.push(listItems(node, false)); break;
      case 'ol': out.push(listItems(node, true)); break;
      case 'blockquote': {
        const c = cleanInline(serializeInline(node));
        if (c) out.push(quote(c));
        break;
      }
      case 'hr': out.push(divider()); break;
      case 'pre': {
        const c = cleanInline(serializeInline(node));
        if (c) out.push(paragraph(c));
        break;
      }
      case 'table': tableToParagraphs(node, out); break;
      default: {
        if (hasBlockChild(node)) {
          walk(node.children, out);
        } else {
          const c = cleanInline(serializeInline(node));
          if (c) out.push(paragraph(c)); // skip empty / whitespace-only blocks
        }
      }
    }
  }
  flush();
}

function tidy(blocks: ContentBlock[]): ContentBlock[] {
  const collapsed: ContentBlock[] = [];
  for (const b of blocks) {
    if (b.type === 'spacer' && collapsed[collapsed.length - 1]?.type === 'spacer') continue;
    collapsed.push(b);
  }
  while (collapsed[0]?.type === 'spacer') collapsed.shift();
  while (collapsed[collapsed.length - 1]?.type === 'spacer') collapsed.pop();
  return collapsed;
}

/** Convert pasted HTML into content blocks. */
export function htmlToContentBlocks(html: string): ContentBlock[] {
  if (!html || !html.trim()) return [];
  const out: ContentBlock[] = [];
  walk(parseHtml(html), out);
  return tidy(out);
}

/** Convert pasted plain text into content blocks (paragraphs + simple lists). */
export function plainTextToContentBlocks(text: string): ContentBlock[] {
  if (!text || !text.trim()) return [];
  const paras = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split(/\n{2,}/);
  const out: ContentBlock[] = [];
  for (const raw of paras) {
    const para = raw.replace(/[ \t]+$/gm, '');
    if (!para.trim()) continue;
    const lines = para.split('\n').filter((l) => l.trim().length > 0);
    const allBullets = lines.length > 0 && lines.every((l) => /^\s*[-*•]\s+/.test(l));
    const allNumbered = lines.length > 0 && lines.every((l) => /^\s*\d+[.)]\s+/.test(l));
    if (lines.length > 1 && allBullets) {
      out.push(list(lines.map((l) => l.replace(/^\s*[-*•]\s+/, '')), false));
    } else if (lines.length > 1 && allNumbered) {
      out.push(list(lines.map((l) => l.replace(/^\s*\d+[.)]\s+/, '')), true));
    } else {
      out.push(paragraph(para.trim()));
    }
  }
  return out;
}

/**
 * Convert clipboard data (HTML preferred, plain-text fallback) into content
 * blocks. Returns [] when there is nothing usable.
 */
export function clipboardToContentBlocks(input: { html?: string; text?: string }): ContentBlock[] {
  const html = (input.html || '').trim();
  const fromHtml = html.includes('<') ? htmlToContentBlocks(html) : [];
  if (fromHtml.length) return fromHtml;
  return plainTextToContentBlocks(input.text || '');
}

// ─── document assembly ────────────────────────────────────────────────────────
const HEADER_VARIANT: DecoratorVariant = 'header-logo';
const FOOTER_VARIANT: DecoratorVariant = 'footer-wave-dark';

function isHeaderDecorator(b?: ContentBlock): boolean {
  return !!b && b.type === 'decorator' && (b as any).variant?.startsWith('header-');
}
function isFooterDecorator(b?: ContentBlock): boolean {
  return !!b && b.type === 'decorator' && (b as any).variant?.startsWith('footer-');
}

/**
 * Wrap pasted content blocks into a complete document: company logo header at
 * the top and a wave footer at the bottom — like the examples have. Reuses
 * existing header/footer decorators in `existing` instead of duplicating.
 */
export function buildSimpleDocument(content: ContentBlock[], existing: ContentBlock[] = []): ContentBlock[] {
  const middle = content.length ? content : [paragraph('')];
  const header: ContentBlock[] = isHeaderDecorator(existing[0])
    ? []
    : [{ id: blockId(), type: 'decorator', variant: HEADER_VARIANT }, spacer('sm')];
  const footer: ContentBlock[] = isFooterDecorator(existing[existing.length - 1])
    ? []
    : [{ id: blockId(), type: 'decorator', variant: FOOTER_VARIANT }];
  return [...header, ...middle, ...footer];
}
