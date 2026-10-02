import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Palette,
  Highlighter,
  Type,
  Sparkles,
  Flame,
  Sliders,
  Upload,
  RotateCcw,
  ChevronDown,
  Edit3,
  Check,
} from 'lucide-react';
import { TextSegment, BioFormatting, BioAnimationType, BioFontSize } from '../types/bio';
import {
  BUILT_IN_FONTS,
  ANIMATION_OPTIONS,
  COLOR_PALETTE,
  HIGHLIGHT_PALETTE,
  GRADIENT_OPTIONS,
  splitAndFormatSegments,
  getSelectionCharacterOffsetsWithin,
} from '../utils/bioUtils';

interface BioEditorProps {
  segments: TextSegment[];
  onChange: (segments: TextSegment[]) => void;
}

export const BioEditor: React.FC<BioEditorProps> = ({ segments, onChange }) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Text editing toggle state
  const [isEditingText, setIsEditingText] = useState(false);
  const [rawText, setRawText] = useState(() => segments.map((s) => s.text).join(''));

  // Sync rawText when segments change externally
  useEffect(() => {
    setRawText(segments.map((s) => s.text).join(''));
  }, [segments]);

  // Selection tracking
  const [selectedRange, setSelectedRange] = useState<{
    start: number;
    end: number;
    text: string;
  } | null>(null);

  const [toolbarPosition, setToolbarPosition] = useState<{
    top: number;
    left: number;
  } | null>(null);

  // Popover menus state
  const [activePopover, setActivePopover] = useState<
    'color' | 'highlight' | 'font' | 'size' | 'glow' | 'animation' | 'more' | null
  >(null);

  // Custom fonts list
  const [customFonts, setCustomFonts] = useState<{ label: string; value: string }[]>([]);
  const [fontUploadError, setFontUploadError] = useState<string | null>(null);

  // Custom color input state
  const [customHexColor, setCustomHexColor] = useState('#8B5CF6');
  const [customHighlightColor, setCustomHighlightColor] = useState('#581c87');
  const [customGlowColor, setCustomGlowColor] = useState('#a855f7');

  // Calculate selection within the editor container
  const updateSelection = useCallback(() => {
    try {
      if (!editorRef.current) return;
      const offsets = getSelectionCharacterOffsetsWithin(editorRef.current);

      if (offsets && offsets.start < offsets.end && offsets.text.trim().length > 0) {
        setSelectedRange(offsets);

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const editorRect = editorRef.current.getBoundingClientRect();

          const left = Math.max(10, rect.left - editorRect.left + rect.width / 2);
          const top = Math.max(-50, rect.top - editorRect.top - 46);

          setToolbarPosition({ top, left });
        }
      } else {
        setSelectedRange(null);
        setToolbarPosition(null);
        setActivePopover(null);
      }
    } catch {
      setSelectedRange(null);
      setToolbarPosition(null);
      setActivePopover(null);
    }
  }, []);

  // Close floating toolbar if clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      try {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        const isToolbar = target.closest('.bio-toolbar');
        const isInsideEditor = editorRef.current && editorRef.current.contains(target);

        if (!isToolbar && !isInsideEditor) {
          setSelectedRange(null);
          setToolbarPosition(null);
          setActivePopover(null);
        }
      } catch {
        // Safe fallback
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
    };
  }, []);

  // Handle editing raw text
  const handleRawTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setRawText(newText);

    if (!newText.trim()) {
      onChange([{ id: 'seg-1', text: '' }]);
      return;
    }

    if (segments.length <= 1) {
      onChange([{ ...(segments[0] || {}), id: 'seg-1', text: newText }]);
    } else {
      // Retain base segment
      onChange([{ id: 'seg-1', text: newText }]);
    }
  };

  // Apply formatting updater to the selected range
  const applyFormatting = (updater: (prev: BioFormatting) => BioFormatting) => {
    if (!selectedRange) return;
    const updated = splitAndFormatSegments(
      segments,
      selectedRange.start,
      selectedRange.end,
      updater
    );
    onChange(updated);
  };

  // Font upload handler (.ttf)
  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFontUploadError(null);

    // Validate TTF format
    const isTTF =
      file.name.toLowerCase().endsWith('.ttf') ||
      file.type === 'font/ttf' ||
      file.type === 'application/x-font-ttf';

    if (!isTTF) {
      setFontUploadError('Please select a valid .ttf font file.');
      return;
    }

    try {
      if (typeof window !== 'undefined' && 'FontFace' in window && 'fonts' in document) {
        const cleanFontName = 'Custom_' + file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_');
        const arrayBuffer = await file.arrayBuffer();
        const fontFace = new FontFace(cleanFontName, arrayBuffer);
        await fontFace.load();
        document.fonts.add(fontFace);

        const newFontEntry = { label: file.name.replace(/\.[^/.]+$/, ''), value: `"${cleanFontName}", sans-serif` };
        setCustomFonts((prev) => [...prev, newFontEntry]);

        applyFormatting((f) => ({ ...f, font: newFontEntry.value }));
        setActivePopover(null);
      } else {
        setFontUploadError('Custom font loading is not supported in this browser.');
      }
    } catch {
      setFontUploadError('Failed to load font file. Please verify it is a valid TTF.');
    }
  };

  const getFontSizeStyle = (size?: BioFontSize) => {
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

  // Prevent button mousedown from clearing the selection
  const preventBlur = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className="flex flex-col gap-2 w-full text-left relative">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-neutral-300">
          Bio
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsEditingText((prev) => !prev);
              setSelectedRange(null);
              setToolbarPosition(null);
            }}
            className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 py-0.5 px-1.5 rounded bg-[#202228] border border-[#2e303a] transition-colors"
          >
            {isEditingText ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span>Done Editing</span>
              </>
            ) : (
              <>
                <Edit3 className="w-3 h-3 text-zinc-400" />
                <span>Edit Text</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-neutral-500 hidden sm:inline">
            Highlight words to style
          </span>
        </div>
      </div>

      {/* Editor Box */}
      <div className="relative w-full">
        {isEditingText ? (
          <textarea
            value={rawText}
            onChange={handleRawTextChange}
            placeholder="Write something about yourself..."
            className="w-full min-h-[110px] max-h-[220px] px-3.5 py-3 text-sm bg-[#16171a] border border-zinc-500 rounded-md text-neutral-100 placeholder:text-neutral-500 outline-none leading-relaxed transition-colors resize-y"
          />
        ) : (
          <div
            ref={editorRef}
            tabIndex={0}
            onMouseUp={() => setTimeout(updateSelection, 10)}
            onKeyUp={() => setTimeout(updateSelection, 10)}
            onTouchEnd={() => setTimeout(updateSelection, 10)}
            className="w-full min-h-[110px] max-h-[220px] overflow-y-auto px-3.5 py-3 text-sm bg-[#16171a] border border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400 rounded-md text-neutral-100 outline-none leading-relaxed transition-colors whitespace-pre-wrap break-words cursor-text select-text"
            style={{ minHeight: '110px' }}
          >
            {segments.some((s) => s.text.trim().length > 0) ? (
              segments.map((seg) => {
                const hasGlow = seg.glow?.enabled && seg.glow.color;
                const glowShadow = hasGlow
                  ? `0 0 6px ${seg.glow?.color}, 0 0 14px ${seg.glow?.color}`
                  : undefined;

                const combinedShadow = [glowShadow, seg.more?.textShadow]
                  .filter(Boolean)
                  .join(', ');

                const style: React.CSSProperties = {
                  fontFamily: seg.font || undefined,
                  fontSize: getFontSizeStyle(seg.fontSize),
                  backgroundColor: seg.highlight || undefined,
                  letterSpacing: seg.more?.letterSpacing || undefined,
                  opacity: seg.more?.opacity !== undefined ? seg.more.opacity : undefined,
                  textTransform: seg.more?.textTransform || undefined,
                  filter: seg.more?.blur ? `blur(${seg.more.blur})` : undefined,
                  textDecorationStyle:
                    seg.more?.underlineStyle || seg.more?.strikethroughStyle || undefined,
                  WebkitTextStroke: seg.more?.stroke || undefined,
                };

                if (combinedShadow) {
                  style.textShadow = combinedShadow;
                }

                if (seg.more?.gradientText) {
                  style.backgroundImage = seg.more.gradientText;
                  style.WebkitBackgroundClip = 'text';
                  style.WebkitTextFillColor = 'transparent';
                  style.display = 'inline-block';
                } else if (seg.color) {
                  style.color = seg.color;
                }

                const classNames = [
                  seg.bold ? 'font-bold' : '',
                  seg.italic ? 'italic' : '',
                  seg.underline ? 'underline' : '',
                  seg.strikethrough ? 'line-through' : '',
                  seg.animation && seg.animation !== 'none'
                    ? `anim-${seg.animation}`
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <span key={seg.id} style={style} className={classNames}>
                    {seg.text}
                  </span>
                );
              })
            ) : (
              <span className="text-neutral-500 italic select-none">
                Write something about yourself... (Click &ldquo;Edit Text&rdquo; to type)
              </span>
            )}
          </div>
        )}

        {/* Floating Formatting Toolbar */}
        {!isEditingText && toolbarPosition && selectedRange && (
          <div
            onMouseDown={preventBlur}
            style={{
              top: `${toolbarPosition.top}px`,
              left: `${toolbarPosition.left}px`,
              transform: 'translateX(-50%)',
            }}
            className="bio-toolbar absolute z-50 flex items-center gap-0.5 p-1 bg-[#1e2026] border border-[#373944] rounded-md shadow-2xl shadow-black/80 animate-in fade-in duration-150"
          >
            {/* Bold */}
            <button
              type="button"
              onClick={() => applyFormatting((f) => ({ ...f, bold: !f.bold }))}
              title="Bold"
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-[#2b2d38] rounded text-xs transition-colors"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => applyFormatting((f) => ({ ...f, italic: !f.italic }))}
              title="Italic"
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-[#2b2d38] rounded text-xs transition-colors"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>

            {/* Underline */}
            <button
              type="button"
              onClick={() => applyFormatting((f) => ({ ...f, underline: !f.underline }))}
              title="Underline"
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-[#2b2d38] rounded text-xs transition-colors"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => applyFormatting((f) => ({ ...f, strikethrough: !f.strikethrough }))}
              title="Strikethrough"
              className="p-1.5 text-neutral-300 hover:text-white hover:bg-[#2b2d38] rounded text-xs transition-colors"
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </button>

            <div className="w-[1px] h-4 bg-[#323440] mx-0.5" />

            {/* Text Color Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopover((prev) => (prev === 'color' ? null : 'color'))
                }
                title="Text Color"
                className={`p-1.5 rounded text-xs transition-colors flex items-center gap-1 ${
                  activePopover === 'color'
                    ? 'bg-[#2b2d38] text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-[#2b2d38]'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
              </button>

              {activePopover === 'color' && (
                <div className="absolute top-full left-0 mt-2 p-2.5 bg-[#1a1b20] border border-[#343642] rounded-md shadow-2xl z-50 w-52 flex flex-col gap-2">
                  <span className="text-[11px] font-medium text-neutral-400">Preset Colors</span>
                  <div className="grid grid-cols-6 gap-1.5">
                    {COLOR_PALETTE.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          applyFormatting((f) => ({ ...f, color: c, more: { ...f.more, gradientText: undefined } }));
                          setActivePopover(null);
                        }}
                        style={{ backgroundColor: c }}
                        className="w-5 h-5 rounded-full border border-black/40 hover:scale-110 transition-transform"
                      />
                    ))}
                  </div>

                  <span className="text-[11px] font-medium text-neutral-400 mt-1">Custom Hex</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={customHexColor}
                      onChange={(e) => setCustomHexColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <input
                      type="text"
                      value={customHexColor}
                      onChange={(e) => setCustomHexColor(e.target.value)}
                      className="flex-1 px-2 py-1 text-xs bg-[#121316] border border-[#2d2f38] rounded text-white outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        applyFormatting((f) => ({ ...f, color: customHexColor, more: { ...f.more, gradientText: undefined } }));
                        setActivePopover(null);
                      }}
                      className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-[11px] rounded text-white"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Highlight Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopover((prev) => (prev === 'highlight' ? null : 'highlight'))
                }
                title="Highlight Color"
                className={`p-1.5 rounded text-xs transition-colors ${
                  activePopover === 'highlight'
                    ? 'bg-[#2b2d38] text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-[#2b2d38]'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5" />
              </button>

              {activePopover === 'highlight' && (
                <div className="absolute top-full left-0 mt-2 p-2.5 bg-[#1a1b20] border border-[#343642] rounded-md shadow-2xl z-50 w-48 flex flex-col gap-2">
                  <span className="text-[11px] font-medium text-neutral-400">Highlight Color</span>
                  <div className="grid grid-cols-4 gap-1.5">
                    {HIGHLIGHT_PALETTE.map((h, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          applyFormatting((f) => ({ ...f, highlight: h || undefined }));
                          setActivePopover(null);
                        }}
                        style={{ backgroundColor: h || '#27272a' }}
                        title={h ? h : 'None'}
                        className="w-6 h-6 rounded border border-white/10 hover:scale-105 transition-transform flex items-center justify-center text-[10px] text-white"
                      >
                        {!h && '✕'}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <input
                      type="color"
                      value={customHighlightColor}
                      onChange={(e) => setCustomHighlightColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        applyFormatting((f) => ({ ...f, highlight: customHighlightColor }));
                        setActivePopover(null);
                      }}
                      className="flex-1 py-1 bg-zinc-700 hover:bg-zinc-600 text-[11px] rounded text-white"
                    >
                      Apply Custom
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Font Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopover((prev) => (prev === 'font' ? null : 'font'))
                }
                title="Font"
                className={`p-1.5 rounded text-xs transition-colors flex items-center gap-0.5 ${
                  activePopover === 'font'
                    ? 'bg-[#2b2d38] text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-[#2b2d38]'
                }`}
              >
                <Type className="w-3.5 h-3.5" />
                <ChevronDown className="w-2.5 h-2.5 text-neutral-400" />
              </button>

              {activePopover === 'font' && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-[#1a1b20] border border-[#343642] rounded-md shadow-2xl z-50 w-52 flex flex-col gap-1 max-h-60 overflow-y-auto">
                  <span className="text-[11px] font-medium text-neutral-400 px-2 py-1">
                    Built-in Fonts
                  </span>
                  {BUILT_IN_FONTS.map((font) => (
                    <button
                      key={font.label}
                      type="button"
                      onClick={() => {
                        applyFormatting((f) => ({ ...f, font: font.value }));
                        setActivePopover(null);
                      }}
                      style={{ fontFamily: font.value || undefined }}
                      className="w-full text-left px-2.5 py-1.5 text-xs text-neutral-200 hover:bg-[#272932] rounded transition-colors"
                    >
                      {font.label}
                    </button>
                  ))}

                  {customFonts.length > 0 && (
                    <>
                      <div className="w-full h-[1px] bg-[#2d2f3a] my-1" />
                      <span className="text-[11px] font-medium text-purple-300 px-2 py-1">
                        Uploaded Fonts (.TTF)
                      </span>
                      {customFonts.map((cf) => (
                        <button
                          key={cf.label}
                          type="button"
                          onClick={() => {
                            applyFormatting((f) => ({ ...f, font: cf.value }));
                            setActivePopover(null);
                          }}
                          style={{ fontFamily: cf.value }}
                          className="w-full text-left px-2.5 py-1.5 text-xs text-purple-200 hover:bg-[#272932] rounded transition-colors"
                        >
                          {cf.label}
                        </button>
                      ))}
                    </>
                  )}

                  <div className="w-full h-[1px] bg-[#2d2f3a] my-1" />
                  {/* Upload TTF button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-neutral-300 hover:text-white hover:bg-[#272932] rounded transition-colors"
                  >
                    <Upload className="w-3 h-3 text-neutral-400" />
                    <span>Upload .TTF Font</span>
                  </button>
                  {fontUploadError && (
                    <span className="text-[10px] text-red-400 px-2 mt-1">
                      {fontUploadError}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Size Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopover((prev) => (prev === 'size' ? null : 'size'))
                }
                title="Font Size"
                className={`p-1.5 rounded text-xs transition-colors flex items-center gap-0.5 ${
                  activePopover === 'size'
                    ? 'bg-[#2b2d38] text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-[#2b2d38]'
                }`}
              >
                <span className="text-[10px] font-bold tracking-tighter">Aa</span>
                <ChevronDown className="w-2.5 h-2.5 text-neutral-400" />
              </button>

              {activePopover === 'size' && (
                <div className="absolute top-full left-0 mt-2 p-2 bg-[#1a1b20] border border-[#343642] rounded-md shadow-2xl z-50 w-36 flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-neutral-400 px-2 py-0.5">
                    Font Size
                  </span>
                  {(['small', 'normal', 'large', 'huge'] as BioFontSize[]).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        applyFormatting((f) => ({ ...f, fontSize: sz }));
                        setActivePopover(null);
                      }}
                      className="w-full text-left capitalize px-2.5 py-1 text-xs text-neutral-200 hover:bg-[#272932] rounded transition-colors"
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Glow Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopover((prev) => (prev === 'glow' ? null : 'glow'))
                }
                title="Text Glow Effect"
                className={`p-1.5 rounded text-xs transition-colors ${
                  activePopover === 'glow'
                    ? 'bg-[#2b2d38] text-amber-300'
                    : 'text-neutral-300 hover:text-white hover:bg-[#2b2d38]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>

              {activePopover === 'glow' && (
                <div className="absolute top-full left-0 mt-2 p-2.5 bg-[#1a1b20] border border-[#343642] rounded-md shadow-2xl z-50 w-48 flex flex-col gap-2">
                  <span className="text-[11px] font-medium text-neutral-400">Glow Effect</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        applyFormatting((f) => ({
                          ...f,
                          glow: { enabled: true, color: customGlowColor },
                        }));
                      }}
                      className="flex-1 py-1 bg-purple-700/80 hover:bg-purple-600 text-white text-xs rounded transition-colors"
                    >
                      Glow ON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        applyFormatting((f) => ({ ...f, glow: undefined }));
                        setActivePopover(null);
                      }}
                      className="py-1 px-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs rounded transition-colors"
                    >
                      OFF
                    </button>
                  </div>
                  <span className="text-[11px] font-medium text-neutral-400 mt-1">Glow Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={customGlowColor}
                      onChange={(e) => {
                        setCustomGlowColor(e.target.value);
                        applyFormatting((f) => ({
                          ...f,
                          glow: { enabled: true, color: e.target.value },
                        }));
                      }}
                      className="w-7 h-7 rounded cursor-pointer bg-transparent border-0 p-0"
                    />
                    <span className="text-xs text-neutral-300">{customGlowColor}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Animation Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopover((prev) => (prev === 'animation' ? null : 'animation'))
                }
                title="Text Animation"
                className={`p-1.5 rounded text-xs transition-colors flex items-center gap-0.5 ${
                  activePopover === 'animation'
                    ? 'bg-[#2b2d38] text-cyan-300'
                    : 'text-neutral-300 hover:text-white hover:bg-[#2b2d38]'
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
                <ChevronDown className="w-2.5 h-2.5 text-neutral-400" />
              </button>

              {activePopover === 'animation' && (
                <div className="absolute top-full left-0 mt-2 p-1.5 bg-[#1a1b20] border border-[#343642] rounded-md shadow-2xl z-50 w-44 flex flex-col gap-0.5 max-h-56 overflow-y-auto">
                  <span className="text-[11px] font-medium text-neutral-400 px-2 py-1">
                    Text Animation
                  </span>
                  {ANIMATION_OPTIONS.map((anim) => (
                    <button
                      key={anim.value}
                      type="button"
                      onClick={() => {
                        applyFormatting((f) => ({ ...f, animation: anim.value }));
                        setActivePopover(null);
                      }}
                      className="w-full text-left px-2.5 py-1 text-xs text-neutral-200 hover:bg-[#272932] rounded transition-colors flex items-center justify-between"
                    >
                      <span>{anim.label}</span>
                      {anim.value !== 'none' && (
                        <span className={`anim-${anim.value} text-[10px] text-cyan-400 font-mono`}>
                          Aa
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* More Effects Popover */}
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setActivePopover((prev) => (prev === 'more' ? null : 'more'))
                }
                title="More Effects"
                className={`p-1.5 rounded text-xs transition-colors ${
                  activePopover === 'more'
                    ? 'bg-[#2b2d38] text-white'
                    : 'text-neutral-300 hover:text-white hover:bg-[#2b2d38]'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
              </button>

              {activePopover === 'more' && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-[#1a1b20] border border-[#343642] rounded-md shadow-2xl z-50 w-56 flex flex-col gap-2.5 max-h-72 overflow-y-auto">
                  <span className="text-xs font-semibold text-neutral-200">
                    Advanced Effects
                  </span>

                  {/* Gradient Text */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-neutral-400">Gradient Text</span>
                    <div className="grid grid-cols-2 gap-1">
                      {GRADIENT_OPTIONS.map((g) => (
                        <button
                          key={g.label}
                          type="button"
                          onClick={() => {
                            applyFormatting((f) => ({
                              ...f,
                              more: { ...f.more, gradientText: g.value || undefined },
                            }));
                          }}
                          className="px-2 py-1 text-[10px] bg-[#24262e] hover:bg-[#2f323d] text-neutral-200 rounded truncate transition-colors text-left"
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Letter Spacing */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-neutral-400">Letter Spacing</span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: 'Norm', val: undefined },
                        { label: 'Wide', val: '0.08em' },
                        { label: 'Extra', val: '0.2em' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() =>
                            applyFormatting((f) => ({
                              ...f,
                              more: { ...f.more, letterSpacing: item.val },
                            }))
                          }
                          className="flex-1 py-1 text-[10px] bg-[#24262e] hover:bg-[#2f323d] text-neutral-200 rounded"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Transform */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-neutral-400">Transform</span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: 'None', val: 'none' },
                        { label: 'UPPER', val: 'uppercase' },
                        { label: 'lower', val: 'lowercase' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() =>
                            applyFormatting((f) => ({
                              ...f,
                              more: {
                                ...f.more,
                                textTransform: item.val as 'none' | 'uppercase' | 'lowercase' | 'capitalize',
                              },
                            }))
                          }
                          className="flex-1 py-1 text-[10px] bg-[#24262e] hover:bg-[#2f323d] text-neutral-200 rounded"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Outline / Stroke */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-neutral-400">Outline / Stroke</span>
                    <div className="flex items-center gap-1">
                      {[
                        { label: 'None', val: undefined },
                        { label: 'White', val: '1px #ffffff' },
                        { label: 'Purple', val: '1px #a855f7' },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() =>
                            applyFormatting((f) => ({
                              ...f,
                              more: { ...f.more, stroke: item.val },
                            }))
                          }
                          className="flex-1 py-1 text-[10px] bg-[#24262e] hover:bg-[#2f323d] text-neutral-200 rounded"
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Underline Style */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-neutral-400">Underline Style</span>
                    <div className="flex items-center gap-1">
                      {(['solid', 'wavy', 'dashed', 'dotted'] as const).map((style) => (
                        <button
                          key={style}
                          type="button"
                          onClick={() =>
                            applyFormatting((f) => ({
                              ...f,
                              underline: true,
                              more: { ...f.more, underlineStyle: style },
                            }))
                          }
                          className="flex-1 py-1 text-[10px] bg-[#24262e] hover:bg-[#2f323d] text-neutral-200 rounded capitalize"
                        >
                          {style}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clear formatting for selection */}
                  <div className="pt-2 border-t border-[#2e303b]">
                    <button
                      type="button"
                      onClick={() => {
                        applyFormatting(() => ({}));
                        setActivePopover(null);
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-neutral-300 hover:text-red-300 bg-[#24262e] hover:bg-[#2f2b30] rounded transition-colors"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Selected Styling</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input for custom TTF upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".ttf,font/ttf,application/x-font-ttf"
        onChange={handleFontUpload}
        className="hidden"
      />
    </div>
  );
};
