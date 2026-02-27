export type FormatType = 'bold' | 'italic' | 'underline';

interface SelectionRange {
  start: number;
  end: number;
}

interface FormatResult {
  text: string;
  selection: SelectionRange;
}

const FORMAT_MARKERS: Record<FormatType, string> = {
  bold: '**',
  italic: '*',
  underline: '__',
};

export function toggleSelectionFormat(
  text: string,
  selection: SelectionRange,
  format: FormatType
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

export function detectActiveFormats(
  text: string,
  selection: SelectionRange
): Set<FormatType> {
  const active = new Set<FormatType>();
  const { start, end } = selection;

  if (start === end || !text) return active;

  const selectedText = text.substring(start, end);

  // Check each format
  for (const [format, marker] of Object.entries(FORMAT_MARKERS) as [FormatType, string][]) {
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
