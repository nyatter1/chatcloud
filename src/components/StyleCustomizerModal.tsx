import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check, Save } from 'lucide-react';
import { TextStyleConfig, TextFormatMode } from '../types/bio';
import {
  SOLID_COLOR_PRESETS,
  NEON_COLOR_PRESETS,
  GRADIENT_COLOR_PRESETS,
  FONT_PRESETS,
  getTextStyleCSS,
} from '../utils/textStylePresets';

interface StyleCustomizerModalProps {
  isOpen: boolean;
  type: 'username' | 'text';
  initialStyle?: TextStyleConfig | null;
  username: string;
  avatarUrl?: string | null;
  avatarFrame?: string | null;
  onClose: () => void;
  onSave: (style: TextStyleConfig | null) => void;
}

export const StyleCustomizerModal: React.FC<StyleCustomizerModalProps> = ({
  isOpen,
  type,
  initialStyle,
  username,
  onClose,
  onSave,
}) => {
  const isUsernameType = type === 'username';

  // Active color category tab: 'solid' | 'neon' | 'gradient'
  const [activeTab, setActiveTab] = useState<'solid' | 'neon' | 'gradient'>(
    initialStyle?.colorType || 'solid'
  );

  // Selected Color Value & Glow
  const [selectedColor, setSelectedColor] = useState<string>(
    initialStyle?.colorValue || (isUsernameType ? '#FFFFFF' : '#E5E7EB')
  );
  const [selectedGlow, setSelectedGlow] = useState<string | undefined>(
    initialStyle?.glowColor
  );

  // Selected Font
  const [selectedFont, setSelectedFont] = useState<string>(
    initialStyle?.font || 'default'
  );

  // Formatting Mode (For text/message style)
  const [selectedFormat, setSelectedFormat] = useState<TextFormatMode>(
    initialStyle?.format || 'normal'
  );

  // Dropdown open states
  const [isFontDropdownOpen, setIsFontDropdownOpen] = useState(false);
  const [isFormatDropdownOpen, setIsFormatDropdownOpen] = useState(false);

  const fontDropdownRef = useRef<HTMLDivElement>(null);
  const formatDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        fontDropdownRef.current &&
        !fontDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFontDropdownOpen(false);
      }
      if (
        formatDropdownRef.current &&
        !formatDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFormatDropdownOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Active compiled configuration for live preview
  const currentConfig: TextStyleConfig = {
    colorType: activeTab,
    colorValue: selectedColor,
    glowColor: activeTab === 'neon' ? selectedGlow : undefined,
    font: selectedFont,
    format: !isUsernameType ? selectedFormat : undefined,
  };

  const previewStyle = getTextStyleCSS(currentConfig, isUsernameType);

  const handleSelectSolid = (color: string) => {
    setActiveTab('solid');
    setSelectedColor(color);
    setSelectedGlow(undefined);
  };

  const handleSelectNeon = (color: string, glow?: string) => {
    setActiveTab('neon');
    setSelectedColor(color);
    setSelectedGlow(glow);
  };

  const handleSelectGradient = (grad: string) => {
    setActiveTab('gradient');
    setSelectedColor(grad);
    setSelectedGlow(undefined);
  };

  const handleSave = () => {
    const isDefault =
      selectedFont === 'default' &&
      activeTab === 'solid' &&
      (isUsernameType ? selectedColor === '#FFFFFF' : selectedColor === '#E5E7EB') &&
      (!isUsernameType ? selectedFormat === 'normal' : true);

    if (isDefault) {
      onSave(null);
    } else {
      const cleanConfig: TextStyleConfig = {
        colorType: activeTab,
        colorValue: selectedColor,
        font: selectedFont,
      };
      if (activeTab === 'neon' && selectedGlow) {
        cleanConfig.glowColor = selectedGlow;
      }
      if (!isUsernameType && selectedFormat) {
        cleanConfig.format = selectedFormat;
      }
      onSave(cleanConfig);
    }
    onClose();
  };

  const activeFontObj =
    FONT_PRESETS.find((f) => f.id === selectedFont || f.name === selectedFont) ||
    FONT_PRESETS[0];

  const formatLabels: Record<TextFormatMode, string> = {
    normal: 'Normal',
    bold: 'Bold',
    heavy: 'Heavy (Black 900)',
    italic: 'Italic',
    heavy_italic: 'Heavy & Italic',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      {/* Dark backdrop overlay */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Box matching screenshot */}
      <div
        className="relative z-10 w-full max-w-[340px] sm:max-w-[360px] bg-[#1c1d24] border border-[#2b2d38] rounded-xl p-5 shadow-2xl shadow-black flex flex-col text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top-Right Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 text-neutral-400 hover:text-white rounded-xs transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ================================================== */}
        {/* 1. PREVIEW SECTION                                 */}
        {/* ================================================== */}
        <div className="mb-4">
          <div className="text-[11px] font-bold text-neutral-300 uppercase tracking-wide mb-1">
            Preview
          </div>
          <div
            style={previewStyle}
            className="text-base sm:text-lg font-bold truncate select-none leading-tight"
          >
            {isUsernameType ? username || 'AnonX' : 'Hello chat! Welcome to chatlaxy'}
          </div>
        </div>

        {/* ================================================== */}
        {/* 2. TAB SWITCHERS: [ Color ] [ Neon ] [ Gradient ]  */}
        {/* ================================================== */}
        <div className="flex items-center gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('solid');
              if (activeTab !== 'solid') {
                setSelectedColor(SOLID_COLOR_PRESETS[0].value);
                setSelectedGlow(undefined);
              }
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'solid'
                ? 'bg-[#2b2d39] text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Color
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('neon');
              if (activeTab !== 'neon') {
                setSelectedColor(NEON_COLOR_PRESETS[0].value);
                setSelectedGlow(NEON_COLOR_PRESETS[0].glow);
              }
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'neon'
                ? 'bg-[#2b2d39] text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Neon
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('gradient');
              if (activeTab !== 'gradient') {
                setSelectedColor(GRADIENT_COLOR_PRESETS[0].value);
                setSelectedGlow(undefined);
              }
            }}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'gradient'
                ? 'bg-[#2b2d39] text-white shadow-xs'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Gradient
          </button>
        </div>

        {/* ================================================== */}
        {/* 3. COLOR PALETTE (4 rows x 8 cols = 32 SQUARES)   */}
        {/* ================================================== */}
        <div className="grid grid-cols-8 gap-1.5 mb-4">
          {activeTab === 'solid' &&
            SOLID_COLOR_PRESETS.map((c) => {
              const isSelected = selectedColor.toLowerCase() === c.value.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectSolid(c.value)}
                  title={c.name}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xs cursor-pointer border transition-transform hover:scale-105 flex items-center justify-center ${
                    isSelected
                      ? 'border-white ring-2 ring-white/50 scale-105'
                      : 'border-black/30'
                  }`}
                  style={{ backgroundColor: c.value }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-black drop-shadow" />}
                </button>
              );
            })}

          {activeTab === 'neon' &&
            NEON_COLOR_PRESETS.map((c) => {
              const isSelected = selectedColor.toLowerCase() === c.value.toLowerCase();
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectNeon(c.value, c.glow)}
                  title={c.name}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xs cursor-pointer border transition-transform hover:scale-105 flex items-center justify-center ${
                    isSelected
                      ? 'border-white ring-2 ring-white/50 scale-105'
                      : 'border-black/30'
                  }`}
                  style={{
                    backgroundColor: c.value,
                    boxShadow: c.glow,
                  }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-black drop-shadow" />}
                </button>
              );
            })}

          {activeTab === 'gradient' &&
            GRADIENT_COLOR_PRESETS.map((c) => {
              const isSelected = selectedColor === c.value;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectGradient(c.value)}
                  title={c.name}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xs cursor-pointer border transition-transform hover:scale-105 flex items-center justify-center ${
                    isSelected
                      ? 'border-white ring-2 ring-white/50 scale-105'
                      : 'border-white/20'
                  }`}
                  style={{ background: c.value }}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
                </button>
              );
            })}
        </div>

        {/* ================================================== */}
        {/* 4. FONT DROPDOWN SELECTOR                          */}
        {/* ================================================== */}
        <div className="flex flex-col gap-1.5 relative mb-3" ref={fontDropdownRef}>
          <label className="text-xs font-bold text-neutral-300">Font</label>
          <button
            type="button"
            onClick={() => setIsFontDropdownOpen((prev) => !prev)}
            className="w-full bg-[#14151a] border border-[#2b2d39] hover:border-zinc-500 rounded-md px-3 py-2 flex items-center justify-between text-xs text-neutral-200 cursor-pointer transition-colors"
          >
            <span style={{ fontFamily: activeFontObj.fontFamily }} className="text-xs">
              {activeFontObj.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
          </button>

          {/* Floating Dropdown Menu */}
          {isFontDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#181921] border border-[#2b2d39] rounded-md shadow-2xl py-1 max-h-48 overflow-y-auto z-30">
              {FONT_PRESETS.map((f) => {
                const isSelected = selectedFont === f.id || selectedFont === f.name;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setSelectedFont(f.id);
                      setIsFontDropdownOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#2a2d3c] text-white font-semibold'
                        : 'text-neutral-300 hover:bg-[#22242e] hover:text-white'
                    }`}
                  >
                    <span style={{ fontFamily: f.fontFamily }}>{f.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Optional Formatting Dropdown for Text / Message Color */}
        {!isUsernameType && (
          <div className="flex flex-col gap-1.5 relative mb-3" ref={formatDropdownRef}>
            <label className="text-xs font-bold text-neutral-300">Format</label>
            <button
              type="button"
              onClick={() => setIsFormatDropdownOpen((prev) => !prev)}
              className="w-full bg-[#14151a] border border-[#2b2d39] hover:border-zinc-500 rounded-md px-3 py-2 flex items-center justify-between text-xs text-neutral-200 cursor-pointer transition-colors"
            >
              <span className="text-xs">{formatLabels[selectedFormat]}</span>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
            </button>

            {isFormatDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#181921] border border-[#2b2d39] rounded-md shadow-2xl py-1 max-h-40 overflow-y-auto z-30">
                {(
                  [
                    { id: 'normal', label: 'Normal' },
                    { id: 'bold', label: 'Bold' },
                    { id: 'heavy', label: 'Heavy (Black 900)' },
                    { id: 'italic', label: 'Italic' },
                    { id: 'heavy_italic', label: 'Heavy & Italic' },
                  ] as const
                ).map((fmt) => {
                  const isSelected = selectedFormat === fmt.id;
                  return (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => {
                        setSelectedFormat(fmt.id);
                        setIsFormatDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs text-left flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#2a2d3c] text-white font-semibold'
                          : 'text-neutral-300 hover:bg-[#22242e] hover:text-white'
                      }`}
                    >
                      <span>{fmt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================== */}
        {/* 5. SAVE BUTTON AT BOTTOM                           */}
        {/* ================================================== */}
        <div className="mt-2">
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold rounded-md shadow-md flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
        </div>
      </div>
    </div>
  );
};
