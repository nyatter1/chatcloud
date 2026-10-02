import { TextSegment, BioFormatting, BioAnimationType } from '../types/bio';

export const BUILT_IN_FONTS = [
  { label: 'Default', value: '' },
  { label: 'Modern', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Classic', value: 'Georgia, serif' },
  { label: 'Pixel', value: '"Courier New", Courier, monospace' },
  { label: 'Mono', value: '"JetBrains Mono", Consolas, monospace' },
  { label: 'Rounded', value: '"Arial Rounded MT Bold", -apple-system, sans-serif' },
  { label: 'Serif', value: '"Times New Roman", Times, serif' },
  { label: 'Bold', value: 'Impact, "Arial Black", sans-serif' },
  { label: 'Handwritten', value: '"Brush Script MT", cursive' },
  { label: 'Display', value: '"Trebuchet MS", sans-serif' },
];

export const ANIMATION_OPTIONS: { label: string; value: BioAnimationType }[] = [
  { label: 'None', value: 'none' },
  { label: 'Pulse', value: 'pulse' },
  { label: 'Glow', value: 'glow' },
  { label: 'Bounce', value: 'bounce' },
  { label: 'Float', value: 'float' },
  { label: 'Shake', value: 'shake' },
  { label: 'Wave', value: 'wave' },
  { label: 'Rainbow', value: 'rainbow' },
  { label: 'Flicker', value: 'flicker' },
  { label: 'Spin', value: 'spin' },
  { label: 'Slide', value: 'slide' },
  { label: 'Type', value: 'type' },
  { label: 'Shimmer', value: 'shimmer' },
];

export const COLOR_PALETTE = [
  '#ffffff', // White
  '#a1a1aa', // Muted Zinc
  '#a855f7', // Purple
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f97316', // Orange
  '#f43f5e', // Rose
  '#ec4899', // Pink
];

export const HIGHLIGHT_PALETTE = [
  '',        // None
  '#581c87', // Deep Purple
  '#1e3a8a', // Deep Blue
  '#064e3b', // Deep Emerald
  '#78350f', // Deep Amber
  '#881337', // Deep Rose
  '#27272a', // Dark Zinc
];

export const GRADIENT_OPTIONS = [
  { label: 'None', value: '' },
  { label: 'Sunset', value: 'linear-gradient(135deg, #f43f5e, #f59e0b)' },
  { label: 'Neon Purple', value: 'linear-gradient(135deg, #a855f7, #ec4899)' },
  { label: 'Ocean Breeze', value: 'linear-gradient(135deg, #06b6d4, #3b82f6)' },
  { label: 'Emerald Glow', value: 'linear-gradient(135deg, #10b981, #06b6d4)' },
  { label: 'Gold Shine', value: 'linear-gradient(135deg, #f59e0b, #fef08a)' },
];

let segmentCounter = 1;
export const generateSegmentId = () => `seg-${Date.now()}-${segmentCounter++}`;

/**
 * Splits existing segments at the given character offsets [start, end]
 * and applies the updated formatting to segments completely within [start, end].
 */
export function splitAndFormatSegments(
  segments: TextSegment[],
  start: number,
  end: number,
  updater: (current: BioFormatting) => BioFormatting
): TextSegment[] {
  if (start >= end) return segments;

  const result: TextSegment[] = [];
  let currentOffset = 0;

  for (const seg of segments) {
    const segLen = seg.text.length;
    const segStart = currentOffset;
    const segEnd = currentOffset + segLen;

    // Case 1: Segment is completely before the selection or after
    if (segEnd <= start || segStart >= end) {
      result.push(seg);
    }
    // Case 2: Segment overlaps with [start, end]
    else {
      const overlapStart = Math.max(segStart, start);
      const overlapEnd = Math.min(segEnd, end);

      const beforeLen = overlapStart - segStart;
      const insideLen = overlapEnd - overlapStart;

      // Slice before overlap
      if (beforeLen > 0) {
        result.push({
          ...seg,
          id: generateSegmentId(),
          text: seg.text.slice(0, beforeLen),
        });
      }

      // Overlapping slice with new formatting
      const insideText = seg.text.slice(beforeLen, beforeLen + insideLen);
      const newFormatting = updater({
        bold: seg.bold,
        italic: seg.italic,
        underline: seg.underline,
        strikethrough: seg.strikethrough,
        color: seg.color,
        highlight: seg.highlight,
        font: seg.font,
        fontSize: seg.fontSize,
        glow: seg.glow ? { ...seg.glow } : undefined,
        animation: seg.animation,
        more: seg.more ? { ...seg.more } : undefined,
      });

      result.push({
        ...newFormatting,
        id: generateSegmentId(),
        text: insideText,
      });

      // Slice after overlap
      const afterStart = beforeLen + insideLen;
      if (afterStart < segLen) {
        result.push({
          ...seg,
          id: generateSegmentId(),
          text: seg.text.slice(afterStart),
        });
      }
    }

    currentOffset = segEnd;
  }

  // Merge adjacent segments that have identical formatting
  return mergeAdjacentSegments(result);
}

/**
 * Merges adjacent segments if their formatting properties are identical
 */
export function mergeAdjacentSegments(segments: TextSegment[]): TextSegment[] {
  if (segments.length <= 1) return segments;

  const merged: TextSegment[] = [];
  let prev = { ...segments[0] };

  for (let i = 1; i < segments.length; i++) {
    const curr = segments[i];
    if (areFormattingEqual(prev, curr)) {
      prev.text += curr.text;
    } else {
      merged.push(prev);
      prev = { ...curr };
    }
  }
  merged.push(prev);
  return merged.filter((s) => s.text.length > 0);
}

function areFormattingEqual(a: BioFormatting, b: BioFormatting): boolean {
  return (
    !!a.bold === !!b.bold &&
    !!a.italic === !!b.italic &&
    !!a.underline === !!b.underline &&
    !!a.strikethrough === !!b.strikethrough &&
    a.color === b.color &&
    a.highlight === b.highlight &&
    a.font === b.font &&
    a.fontSize === b.fontSize &&
    a.animation === b.animation &&
    JSON.stringify(a.glow) === JSON.stringify(b.glow) &&
    JSON.stringify(a.more) === JSON.stringify(b.more)
  );
}

/**
 * Calculate character offset within a container element for the current DOM selection
 */
export function getSelectionCharacterOffsetsWithin(element: HTMLElement): {
  start: number;
  end: number;
  text: string;
} | null {
  try {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return null;

    const range = selection.getRangeAt(0);
    if (!element.contains(range.commonAncestorContainer)) return null;

    const preSelectionRange = range.cloneRange();
    preSelectionRange.selectNodeContents(element);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;

    const selectedText = range.toString();
    if (!selectedText || selectedText.trim().length === 0) return null;

    const end = start + selectedText.length;
    return { start, end, text: selectedText };
  } catch {
    return null;
  }
}
