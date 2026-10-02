import React from 'react';
import { TextSegment } from '../types/bio';

interface BioRendererProps {
  segments: TextSegment[];
  className?: string;
  emptyPlaceholder?: string;
}

export const BioRenderer: React.FC<BioRendererProps> = ({
  segments,
  className = '',
  emptyPlaceholder = 'No bio provided.',
}) => {
  const hasText = segments.some((s) => s.text.length > 0);

  if (!hasText) {
    return (
      <span className={`text-neutral-500 italic text-sm ${className}`}>
        {emptyPlaceholder}
      </span>
    );
  }

  const getFontSizeStyle = (size?: string) => {
    switch (size) {
      case 'small':
        return '0.82em';
      case 'normal':
        return '1em';
      case 'large':
        return '1.25em';
      case 'huge':
        return '1.55em';
      default:
        return size || '1em';
    }
  };

  return (
    <div className={`leading-relaxed whitespace-pre-wrap break-words ${className}`}>
      {segments.map((segment) => {
        if (!segment.text) return null;

        const hasGlow = segment.glow?.enabled && segment.glow.color;
        const glowShadow = hasGlow
          ? `0 0 6px ${segment.glow?.color}, 0 0 14px ${segment.glow?.color}`
          : undefined;

        const combinedShadow = [glowShadow, segment.more?.textShadow]
          .filter(Boolean)
          .join(', ');

        const style: React.CSSProperties = {
          fontFamily: segment.font || undefined,
          fontSize: getFontSizeStyle(segment.fontSize),
          backgroundColor: segment.highlight || undefined,
          letterSpacing: segment.more?.letterSpacing || undefined,
          opacity: segment.more?.opacity !== undefined ? segment.more.opacity : undefined,
          textTransform: segment.more?.textTransform || undefined,
          filter: segment.more?.blur ? `blur(${segment.more.blur})` : undefined,
          textDecorationStyle:
            segment.more?.underlineStyle || segment.more?.strikethroughStyle || undefined,
          WebkitTextStroke: segment.more?.stroke || undefined,
        };

        if (combinedShadow) {
          style.textShadow = combinedShadow;
        }

        if (segment.more?.gradientText) {
          style.backgroundImage = segment.more.gradientText;
          style.WebkitBackgroundClip = 'text';
          style.WebkitTextFillColor = 'transparent';
          style.display = 'inline-block';
        } else if (segment.color) {
          style.color = segment.color;
        }

        const classNames = [
          segment.bold ? 'font-bold' : '',
          segment.italic ? 'italic' : '',
          segment.underline ? 'underline' : '',
          segment.strikethrough ? 'line-through' : '',
          segment.animation && segment.animation !== 'none'
            ? `anim-${segment.animation}`
            : '',
        ]
          .filter(Boolean)
          .join(' ');

        return (
          <span key={segment.id} style={style} className={classNames}>
            {segment.text}
          </span>
        );
      })}
    </div>
  );
};
