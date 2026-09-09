// 轻量 Markdown 解析器：将 AI 输出转换为结构化块，供 MarkdownView 渲染。
// 目标：在小程序端稳定展示 headings / 段落 / 列表 / 引用 / 代码 / 分隔线，
// 无需 rich-text、避免 XSS、体积可控。

export type InlineNode =
  | { type: 'text'; content: string }
  | { type: 'bold'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'code'; content: string }
  | { type: 'strikethrough'; content: string }
  | { type: 'br' };

export type ListItem = { inline: InlineNode[] };

export type TableCell = { inline: InlineNode[]; align?: 'left' | 'center' | 'right' };
export type TableRow = TableCell[];
export type TableBlock = {
  type: 'table';
  header: TableRow;
  rows: TableRow[];
};

export type Block =
  | { type: 'heading'; level: 1 | 2 | 3 | 4 | 5 | 6; inline: InlineNode[] }
  | { type: 'paragraph'; inline: InlineNode[] }
  | { type: 'ul'; items: ListItem[] }
  | { type: 'ol'; items: ListItem[]; start: number }
  | { type: 'quote'; inline: InlineNode[] }
  | { type: 'code'; lang?: string; code: string }
  | TableBlock
  | { type: 'hr' };

/**
 * 解析行内格式：粗体、斜体、行内代码、删除线、换行。
 * 采用单遍正则 + 栈式扫描，避免嵌套错乱。
 */
export function parseInline(input: string): InlineNode[] {
  const nodes: InlineNode[] = [];
  let buf = '';
  let i = 0;
  const s = input;

  const flushText = () => {
    if (buf) {
      nodes.push({ type: 'text', content: buf });
      buf = '';
    }
  };

  while (i < s.length) {
    const ch = s[i];
    const two = s.slice(i, i + 2);
    const three = s.slice(i, i + 3);

    // 行内代码优先，内部其他标记原样输出
    if (ch === '`') {
      const end = s.indexOf('`', i + 1);
      if (end !== -1) {
        flushText();
        nodes.push({ type: 'code', content: s.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    // 粗体：**text** 或 __text__
    if ((two === '**' || two === '__') && s[i + 2] !== undefined && s[i + 2] !== ' ') {
      const close = s.indexOf(two, i + 2);
      if (close !== -1 && close > i + 2) {
        flushText();
        // 内部允许再递归解析（简单嵌套：粗体内可含行内代码）
        nodes.push({ type: 'bold', content: s.slice(i + 2, close) });
        i = close + 2;
        continue;
      }
    }

    // 删除线：~~text~~
    if (two === '~~') {
      const close = s.indexOf('~~', i + 2);
      if (close !== -1 && close > i + 2) {
        flushText();
        nodes.push({ type: 'strikethrough', content: s.slice(i + 2, close) });
        i = close + 2;
        continue;
      }
    }

    // 斜体：*text* 或 _text_（避免匹配到 ** 或 __ 已经处理的情况）
    if (ch === '*' && two !== '**' && s[i + 1] !== undefined && s[i + 1] !== ' ') {
      const close = s.indexOf('*', i + 1);
      if (close !== -1 && close > i + 1 && s.slice(close + 1, close + 2) !== '*') {
        flushText();
        nodes.push({ type: 'italic', content: s.slice(i + 1, close) });
        i = close + 1;
        continue;
      }
    }
    if (ch === '_' && two !== '__' && s[i + 1] !== undefined && s[i + 1] !== ' ') {
      const close = s.indexOf('_', i + 1);
      if (close !== -1 && close > i + 1 && s.slice(close + 1, close + 2) !== '_') {
        flushText();
        nodes.push({ type: 'italic', content: s.slice(i + 1, close) });
        i = close + 1;
        continue;
      }
    }

    // 三个以上 * 视为分隔线（在块级层面已处理，此处兜底）
    if (ch === '*' && /^(\*\s*){3,}$/.test(s.slice(i).split('\n')[0])) {
      break;
    }

    buf += ch;
    i++;
  }

  flushText();
  return nodes;
}

/**
 * 判断行是否是水平分隔线（- / * / _ 三连及以上）
 */
function isHr(line: string): boolean {
  const t = line.trim();
  if (!t) return false;
  return /^(\*{3,}|-{3,}|_{3,})$/.test(t);
}

/**
 * 判断行是否是列表项开头，返回 {ordered, indent, content}
 */
function matchListItem(line: string): { ordered: boolean; marker: string; indent: number; content: string; start: number } | null {
  // 有序列表：1.  或 1)  或 1. 
  const ol = line.match(/^(\s*)(\d+)[.)]\s+(.+)$/);
  if (ol) return { ordered: true, marker: ol[2] + '.', indent: ol[1].length, content: ol[3], start: parseInt(ol[2], 10) };

  // 无序列表：- / * / +
  const ul = line.match(/^(\s*)([-*+])\s+(.+)$/);
  if (ul) return { ordered: false, marker: ul[2], indent: ul[1].length, content: ul[3], start: 0 };

  return null;
}

/**
 * 判断行是否是表格行（以 | 开头和结尾）
 */
function isTableRow(line: string): boolean {
  const t = line.trim();
  return t.startsWith('|') && t.endsWith('|') && t.length > 1;
}

/**
 * 解析对齐标记：:--- 左对齐, ---: 右对齐, :---: 居中, --- 默认左对齐
 */
function parseAlign(marker: string): 'left' | 'center' | 'right' | undefined {
  const t = marker.trim();
  const hasLeft = t.startsWith(':');
  const hasRight = t.endsWith(':');
  if (hasLeft && hasRight) return 'center';
  if (hasRight) return 'right';
  if (hasLeft) return 'left';
  return undefined;
}

/**
 * 判断是否是分隔行（包含 --- 的行）
 */
function isSeparatorRow(line: string): boolean {
  const t = line.trim();
  if (!t.startsWith('|')) return false;
  const cells = t.split('|').slice(1, -1).map(c => c.trim());
  return cells.length > 0 && cells.every(c => /^:?-+:?$/.test(c));
}

/**
 * 解析表格行，返回单元格数组
 */
function parseTableRow(line: string, aligns?: ('left' | 'center' | 'right' | undefined)[]): TableRow {
  const t = line.trim();
  // 去掉首尾的 |
  const content = t.startsWith('|') ? t.slice(1) : t;
  const content2 = content.endsWith('|') ? content.slice(0, -1) : content;
  const cells = content2.split('|').map(c => c.trim());
  return cells.map((cell, idx) => ({
    inline: parseInline(cell),
    align: aligns ? aligns[idx] : undefined
  }));
}


/**
 * 解析主入口。
 */
export function parseMarkdown(src: string): Block[] {
  if (!src) return [];
  // 统一换行
  const text = src.replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const blocks: Block[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 空行
    if (!line.trim()) {
      i++;
      continue;
    }

    // 代码块 ```
    if (/^```/.test(line)) {
      const lang = line.replace(/^```/, '').trim();
      const buf: string[] = [];
      i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) {
        buf.push(lines[i]);
        i++;
      }
      i++; // 跳过结尾 ```
      blocks.push({ type: 'code', lang: lang || undefined, code: buf.join('\n') });
      continue;
    }

    // 水平分隔线
    if (isHr(line)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // 标题
    const h = line.match(/^(#{1,6})\s+(.+)$/);
    if (h) {
      const level = Math.min(6, h[1].length) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: 'heading', level, inline: parseInline(h[2]) });
      i++;
      continue;
    }

    // 引用
    if (/^\s*>\s?/.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && /^\s*>\s?/.test(lines[i])) {
        buf.push(lines[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      blocks.push({ type: 'quote', inline: parseInline(buf.join(' ')) });
      continue;
    }

    // 列表
    const first = matchListItem(line);
    if (first) {
      const items: ListItem[] = [];
      const ordered = first.ordered;
      const start = ordered ? first.start : 0;
      const baseIndent = first.indent;
      items.push({ inline: parseInline(first.content) });
      i++;
      while (i < lines.length) {
        const cur = lines[i];
        if (!cur.trim()) {
          // 空行：如果下一行还是同类型列表项，则续接
          const next = lines[i + 1];
          if (next && matchListItem(next) && matchListItem(next)?.ordered === ordered) {
            i++;
            continue;
          }
          break;
        }
        const m = matchListItem(cur);
        if (m && m.ordered === ordered && m.indent <= baseIndent + 1) {
          items.push({ inline: parseInline(m.content) });
          i++;
          continue;
        }
        // 续写：属于上一个列表项的换行内容
        if (m && m.ordered === ordered) {
          // 缩进更深的子列表也合并进上一项
          const prev = items[items.length - 1].inline
            .map(n => ('content' in n ? n.content : ''))
            .join(' ');
          items[items.length - 1].inline = parseInline(prev + ' ' + m.content);
          i++;
          continue;
        }
        break;
      }
      blocks.push(ordered ? { type: 'ol', items, start } : { type: 'ul', items });
      continue;
    }

    // 表格
    if (isTableRow(line)) {
      // 收集所有连续的表格行
      const tableLines: string[] = [line];
      i++;
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }

      // 如果至少有两行，且第二行是分隔行，则解析为表格
      if (tableLines.length >= 2 && isSeparatorRow(tableLines[1])) {
        const aligns = tableLines[1].split('|').slice(1, -1).map(c => parseAlign(c.trim()));
        const header = parseTableRow(tableLines[0], aligns);
        const rows = tableLines.slice(2).map(row => parseTableRow(row, aligns));
        blocks.push({ type: 'table', header, rows });
        continue;
      }
      // 否则视为段落（非标准表格）
      i = i - tableLines.length;
      blocks.push({ type: 'paragraph', inline: parseInline(tableLines.join(' ')) });
      continue;
    }

    // 段落：连续非空行合并（保留换行用于 pre-wrap 展示）
    {
      const buf: string[] = [line];
      i++;
      while (i < lines.length) {
        const cur = lines[i];
        if (!cur.trim()) break;
        if (/^#{1,6}\s/.test(cur)) break;
        if (isHr(cur)) break;
        if (/^```/.test(cur)) break;
        if (/^\s*>\s?/.test(cur)) break;
        if (matchListItem(cur)) break;
        if (isTableRow(cur)) break;
        buf.push(cur);
        i++;
      }
      // 段落内部保留换行，转为 br 节点
      const inline: InlineNode[] = [];
      const parts = buf.join('\n').split('\n');
      parts.forEach((p, idx) => {
        inline.push(...parseInline(p));
        if (idx < parts.length - 1) inline.push({ type: 'br' });
      });
      blocks.push({ type: 'paragraph', inline });
    }
  }

  return blocks;
}
