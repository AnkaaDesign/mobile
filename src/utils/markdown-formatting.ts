export type FormatType = 'bold' | 'italic' | 'underline' | 'color';

interface SelectionRange {
  start: number;
  end: number;
}

interface FormatResult {
  text: string;
  selection: SelectionRange;
}

type InlineFormatType = Exclude<FormatType, 'color'>;

const FORMAT_MARKERS: Record<InlineFormatType, string> = {
  bold: '**',
  italic: '*',
  underline: '__',
};

export function toggleSelectionFormat(
  text: string,
  selection: SelectionRange,
  format: InlineFormatType
): FormatResult {
  const marker = FORMAT_MARKERS[format];
  const { start, end } = selection;

  if (start === end) {
    // No selection — insert markers with cursor between them
    const before = text.substring(0, start);
    const after = text.substring(start);
    const newText = `${before}${marker}${marker}${after}`;
    return {
      text: newText,
      selection: { start: start + marker.length, end: start + marker.length },
    };
  }

  const selectedText = text.substring(start, end);

  // Check if already wrapped
  const beforeStart = start - marker.length;
  const afterEnd = end + marker.length;

  if (
    beforeStart >= 0 &&
    afterEnd <= text.length &&
    text.substring(beforeStart, start) === marker &&
    text.substring(end, afterEnd) === marker
  ) {
    // Remove markers
    const newText = text.substring(0, beforeStart) + selectedText + text.substring(afterEnd);
    return {
      text: newText,
      selection: { start: beforeStart, end: beforeStart + selectedText.length },
    };
  }

  // Check if selected text itself starts/ends with markers
  if (selectedText.startsWith(marker) && selectedText.endsWith(marker) && selectedText.length > marker.length * 2) {
    const unwrapped = selectedText.substring(marker.length, selectedText.length - marker.length);
    const newText = text.substring(0, start) + unwrapped + text.substring(end);
    return {
      text: newText,
      selection: { start, end: start + unwrapped.length },
    };
  }

  // Add markers
  const newText = text.substring(0, start) + marker + selectedText + marker + text.substring(end);
  return {
    text: newText,
    selection: { start: start + marker.length, end: end + marker.length },
  };
}

export function insertLink(
  text: string,
  selection: SelectionRange,
  url: string
): FormatResult {
  const { start, end } = selection;
  const selectedText = text.substring(start, end) || 'link';
  const linkMarkdown = `[${selectedText}](${url})`;

  const newText = text.substring(0, start) + linkMarkdown + text.substring(end);

  return {
    text: newText,
    selection: {
      start: start + linkMarkdown.length,
      end: start + linkMarkdown.length,
    },
  };
}

/**
 * Apply color format `{c:#hex}text{/c}` to a selection.
 */
export function applyColorFormat(
  text: string,
  selection: SelectionRange,
  color: string
): FormatResult {
  const { start, end } = selection;
  const openTag = `{c:${color}}`;
  const closeTag = `{/c}`;

  if (start === end) {
    // No selection — insert markers with cursor between them
    const before = text.substring(0, start);
    const after = text.substring(start);
    const newText = `${before}${openTag}${closeTag}${after}`;
    return {
      text: newText,
      selection: { start: start + openTag.length, end: start + openTag.length },
    };
  }

  const selectedText = text.substring(start, end);
  const newText = text.substring(0, start) + openTag + selectedText + closeTag + text.substring(end);
  return {
    text: newText,
    selection: { start: start + openTag.length, end: end + openTag.length },
  };
}

/**
 * Remove color format from around the current selection/cursor.
 */
export function removeColorFormat(
  text: string,
  selection: SelectionRange
): FormatResult {
  const { start, end } = selection;

  // Find a {c:#hex} opening tag before or at selection
  const beforeText = text.substring(0, end);
  const openTagMatch = beforeText.match(/\{c:#[0-9a-fA-F]{3,8}\}(?=[^{]*$)/);

  if (!openTagMatch || openTagMatch.index === undefined) {
    return { text, selection };
  }

  const openTagStart = openTagMatch.index;
  const openTagEnd = openTagStart + openTagMatch[0].length;

  // Find closing {/c} after the open tag
  const afterOpen = text.substring(openTagEnd);
  const closeTagIndex = afterOpen.indexOf('{/c}');

  if (closeTagIndex === -1) {
    return { text, selection };
  }

  const closeTagStart = openTagEnd + closeTagIndex;
  const closeTagEnd = closeTagStart + '{/c}'.length;

  const innerText = text.substring(openTagEnd, closeTagStart);
  const newText = text.substring(0, openTagStart) + innerText + text.substring(closeTagEnd);

  const shift = openTagMatch[0].length;
  return {
    text: newText,
    selection: {
      start: Math.max(openTagStart, start - shift),
      end: Math.max(openTagStart, end - shift),
    },
  };
}

/**
 * Detect the color applied at the current selection position.
 * Returns the hex color string (e.g. "#ff0000") or null.
 */
export function detectColorAtSelection(
  text: string,
  selection: SelectionRange
): string | null {
  const { start, end } = selection;
  const beforeText = text.substring(0, end);
  const openTagMatch = beforeText.match(/\{c:(#[0-9a-fA-F]{3,8})\}(?=[^{]*$)/);

  if (!openTagMatch || openTagMatch.index === undefined) {
    return null;
  }

  const openTagEnd = openTagMatch.index + openTagMatch[0].length;
  const afterOpen = text.substring(openTagEnd);
  const closeTagIndex = afterOpen.indexOf('{/c}');

  if (closeTagIndex === -1) {
    return null;
  }

  const closeTagStart = openTagEnd + closeTagIndex;

  // Check if selection is within the color span
  if (start >= openTagMatch.index && end <= closeTagStart) {
    return openTagMatch[1];
  }

  return null;
}

export function detectActiveFormats(
  text: string,
  selection: SelectionRange
): Set<FormatType> {
  const active = new Set<FormatType>();
  const { start, end } = selection;

  if (start === end || !text) return active;

  const selectedText = text.substring(start, end);

  // Check each format
  for (const [format, marker] of Object.entries(FORMAT_MARKERS) as [InlineFormatType, string][]) {
    // Check if selected text is wrapped by markers
    const beforeStart = start - marker.length;
    const afterEnd = end + marker.length;

    if (
      beforeStart >= 0 &&
      afterEnd <= text.length &&
      text.substring(beforeStart, start) === marker &&
      text.substring(end, afterEnd) === marker
    ) {
      active.add(format);
      continue;
    }

    // Check if selected text itself contains markers
    if (selectedText.startsWith(marker) && selectedText.endsWith(marker)) {
      active.add(format);
    }
  }

  return active;
}
