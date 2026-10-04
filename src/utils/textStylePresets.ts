import { TextStyleConfig, TextFormatMode } from '../types/bio';

export interface ColorPreset {
  id: string;
  name: string;
  value: string;
  glow?: string;
}

export interface FontPreset {
  id: string;
  name: string;
  fontFamily: string;
}

// 32 Solid Colors (4 rows x 8 cols) matching the screenshot palette
export const SOLID_COLOR_PRESETS: ColorPreset[] = [
  // Row 1
  { id: 'c1', name: 'Red', value: '#FF3B30' },
  { id: 'c2', name: 'Orange Red', value: '#FF6B35' },
  { id: 'c3', name: 'Orange', value: '#FF9500' },
  { id: 'c4', name: 'Golden Yellow', value: '#FFCC00' },
  { id: 'c5', name: 'Lime Yellow', value: '#CDDC39' },
  { id: 'c6', name: 'Light Green', value: '#8BC34A' },
  { id: 'c7', name: 'Green', value: '#4CAF50' },
  { id: 'c8', name: 'Olive Green', value: '#7CB342' },
  // Row 2
  { id: 'c9', name: 'Deep Green', value: '#008000' },
  { id: 'c10', name: 'Bright Lime', value: '#00E676' },
  { id: 'c11', name: 'Emerald', value: '#00C853' },
  { id: 'c12', name: 'Cyan', value: '#00E5FF' },
  { id: 'c13', name: 'Bright Blue', value: '#00B0FF' },
  { id: 'c14', name: 'Sky Blue', value: '#0091EA' },
  { id: 'c15', name: 'Royal Blue', value: '#2979FF' },
  { id: 'c16', name: 'Teal Blue', value: '#00838F' },
  // Row 3
  { id: 'c17', name: 'Navy Blue', value: '#0D47A1' },
  { id: 'c18', name: 'Indigo', value: '#651FFF' },
  { id: 'c19', name: 'Purple', value: '#7C4DFF' },
  { id: 'c20', name: 'Violet', value: '#AA00FF' },
  { id: 'c21', name: 'Magenta', value: '#E040FB' },
  { id: 'c22', name: 'Hot Pink', value: '#FF4081' },
  { id: 'c23', name: 'Pink Red', value: '#FF1744' },
  { id: 'c24', name: 'Coral Red', value: '#FF5252' },
  // Row 4
  { id: 'c25', name: 'Dark Brown', value: '#4E342E' },
  { id: 'c26', name: 'Brown', value: '#6D4C41' },
  { id: 'c27', name: 'Warm Taupe', value: '#8D6E63' },
  { id: 'c28', name: 'Tan Sand', value: '#BCAAA4' },
  { id: 'c29', name: 'Silver Grey', value: '#9E9E9E' },
  { id: 'c30', name: 'Blue Grey', value: '#78909C' },
  { id: 'c31', name: 'Steel Slate', value: '#546E7A' },
  { id: 'c32', name: 'Dark Slate', value: '#37474F' },
];

// 32 Neon Colors (4 rows x 8 cols) with luminous text-shadow glow
export const NEON_COLOR_PRESETS: ColorPreset[] = [
  // Row 1
  { id: 'n1', name: 'Neon Red', value: '#FF0055', glow: '0 0 10px #FF0055, 0 0 20px #FF0055' },
  { id: 'n2', name: 'Neon Flame', value: '#FF4500', glow: '0 0 10px #FF4500, 0 0 20px #FF4500' },
  { id: 'n3', name: 'Neon Orange', value: '#FF6B00', glow: '0 0 10px #FF6B00, 0 0 20px #FF6B00' },
  { id: 'n4', name: 'Neon Gold', value: '#FFE600', glow: '0 0 10px #FFE600, 0 0 20px #FFE600' },
  { id: 'n5', name: 'Neon Yellow', value: '#FFFF00', glow: '0 0 10px #FFFF00, 0 0 20px #FFFF00' },
  { id: 'n6', name: 'Neon Lime', value: '#76FF03', glow: '0 0 10px #76FF03, 0 0 20px #76FF03' },
  { id: 'n7', name: 'Neon Toxic', value: '#39FF14', glow: '0 0 10px #39FF14, 0 0 20px #39FF14' },
  { id: 'n8', name: 'Neon Forest', value: '#00E676', glow: '0 0 10px #00E676, 0 0 20px #00E676' },
  // Row 2
  { id: 'n9', name: 'Neon Emerald', value: '#00FF88', glow: '0 0 10px #00FF88, 0 0 20px #00FF88' },
  { id: 'n10', name: 'Neon Mint', value: '#00FFC4', glow: '0 0 10px #00FFC4, 0 0 20px #00FFC4' },
  { id: 'n11', name: 'Neon Turquoise', value: '#00FFFF', glow: '0 0 10px #00FFFF, 0 0 20px #00FFFF' },
  { id: 'n12', name: 'Neon Cyan', value: '#00E5FF', glow: '0 0 10px #00E5FF, 0 0 20px #00E5FF' },
  { id: 'n13', name: 'Neon Sky', value: '#00B0FF', glow: '0 0 10px #00B0FF, 0 0 20px #00B0FF' },
  { id: 'n14', name: 'Neon Blue', value: '#2979FF', glow: '0 0 10px #2979FF, 0 0 20px #2979FF' },
  { id: 'n15', name: 'Neon Electric', value: '#3D5AFE', glow: '0 0 10px #3D5AFE, 0 0 20px #3D5AFE' },
  { id: 'n16', name: 'Neon Deep Blue', value: '#651FFF', glow: '0 0 10px #651FFF, 0 0 20px #651FFF' },
  // Row 3
  { id: 'n17', name: 'Neon Indigo', value: '#7C4DFF', glow: '0 0 10px #7C4DFF, 0 0 20px #7C4DFF' },
  { id: 'n18', name: 'Neon Violet', value: '#9D00FF', glow: '0 0 10px #9D00FF, 0 0 20px #9D00FF' },
  { id: 'n19', name: 'Neon Purple', value: '#BF00FF', glow: '0 0 10px #BF00FF, 0 0 20px #BF00FF' },
  { id: 'n20', name: 'Neon Fuchsia', value: '#FF00D4', glow: '0 0 10px #FF00D4, 0 0 20px #FF00D4' },
  { id: 'n21', name: 'Neon Magenta', value: '#FF007F', glow: '0 0 10px #FF007F, 0 0 20px #FF007F' },
  { id: 'n22', name: 'Neon Pink', value: '#FF4081', glow: '0 0 10px #FF4081, 0 0 20px #FF4081' },
  { id: 'n23', name: 'Neon Coral', value: '#FF5252', glow: '0 0 10px #FF5252, 0 0 20px #FF5252' },
  { id: 'n24', name: 'Neon Blood', value: '#FF0844', glow: '0 0 10px #FF0844, 0 0 20px #FF0844' },
  // Row 4
  { id: 'n25', name: 'Neon Sunburst', value: '#FFAE00', glow: '0 0 10px #FFAE00, 0 0 20px #FFAE00' },
  { id: 'n26', name: 'Neon Amber', value: '#FFD600', glow: '0 0 10px #FFD600, 0 0 20px #FFD600' },
  { id: 'n27', name: 'Neon Lavender', value: '#E0AFFF', glow: '0 0 10px #E0AFFF, 0 0 20px #E0AFFF' },
  { id: 'n28', name: 'Neon Lilac', value: '#D1C4E9', glow: '0 0 10px #D1C4E9, 0 0 20px #D1C4E9' },
  { id: 'n29', name: 'Neon Ice', value: '#7DF9FF', glow: '0 0 10px #7DF9FF, 0 0 20px #7DF9FF' },
  { id: 'n30', name: 'Neon Frost', value: '#E0F7FA', glow: '0 0 10px #E0F7FA, 0 0 20px #E0F7FA' },
  { id: 'n31', name: 'Neon Starlight', value: '#FFFFFF', glow: '0 0 10px #FFFFFF, 0 0 20px #80D8FF' },
  { id: 'n32', name: 'Neon Moonlight', value: '#ECEFF1', glow: '0 0 10px #ECEFF1, 0 0 20px #90CAF9' },
];

// 32 Gradient Presets (4 rows x 8 cols)
export const GRADIENT_COLOR_PRESETS: ColorPreset[] = [
  // Row 1
  { id: 'g1', name: 'Fire', value: 'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)' },
  { id: 'g2', name: 'Sunset', value: 'linear-gradient(135deg, #FF512F 0%, #F09819 100%)' },
  { id: 'g3', name: 'Sunrise', value: 'linear-gradient(135deg, #F857A6 0%, #FF5858 100%)' },
  { id: 'g4', name: 'Gold Rush', value: 'linear-gradient(135deg, #FFE000 0%, #799F0C 100%)' },
  { id: 'g5', name: 'Citrus', value: 'linear-gradient(135deg, #FDFC47 0%, #24FE41 100%)' },
  { id: 'g6', name: 'Neon Green', value: 'linear-gradient(135deg, #00FF87 0%, #60EFFF 100%)' },
  { id: 'g7', name: 'Emerald', value: 'linear-gradient(135deg, #0BA360 0%, #3CBA92 100%)' },
  { id: 'g8', name: 'Forest', value: 'linear-gradient(135deg, #134E5E 0%, #71B280 100%)' },
  // Row 2
  { id: 'g9', name: 'Aqua', value: 'linear-gradient(135deg, #00C6FF 0%, #0072FF 100%)' },
  { id: 'g10', name: 'Ocean', value: 'linear-gradient(135deg, #4E54C8 0%, #8F94FB 100%)' },
  { id: 'g11', name: 'Electric', value: 'linear-gradient(135deg, #00F2FE 0%, #4FACFE 100%)' },
  { id: 'g12', name: 'Deep Sea', value: 'linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)' },
  { id: 'g13', name: 'Cyberpunk', value: 'linear-gradient(135deg, #FF007F 0%, #7928CA 100%)' },
  { id: 'g14', name: 'Nebula', value: 'linear-gradient(135deg, #8A2387 0%, #E94057 50%, #F27121 100%)' },
  { id: 'g15', name: 'Hyper', value: 'linear-gradient(135deg, #12C2E9 0%, #C471ED 50%, #F64F59 100%)' },
  { id: 'g16', name: 'Ultra Violet', value: 'linear-gradient(135deg, #654EA3 0%, #EAAFC8 100%)' },
  // Row 3
  { id: 'g17', name: 'Amethyst', value: 'linear-gradient(135deg, #9B51E0 0%, #3498DB 100%)' },
  { id: 'g18', name: 'Purple Bliss', value: 'linear-gradient(135deg, #360033 0%, #0B8793 100%)' },
  { id: 'g19', name: 'Pink Sugar', value: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)' },
  { id: 'g20', name: 'Flamingo', value: 'linear-gradient(135deg, #FF758C 0%, #FF7EB3 100%)' },
  { id: 'g21', name: 'Blood Moon', value: 'linear-gradient(135deg, #ED213A 0%, #93291E 100%)' },
  { id: 'g22', name: 'Dark Phoenix', value: 'linear-gradient(135deg, #F83600 0%, #F9D423 100%)' },
  { id: 'g23', name: 'Autumn', value: 'linear-gradient(135deg, #DAD299 0%, #B0DAB9 100%)' },
  { id: 'g24', name: 'Desert', value: 'linear-gradient(135deg, #F37335 0%, #FDC830 100%)' },
  // Row 4
  { id: 'g25', name: 'Espresso', value: 'linear-gradient(135deg, #3E2723 0%, #8D6E63 100%)' },
  { id: 'g26', name: 'Mocha', value: 'linear-gradient(135deg, #5D4037 0%, #D7CCC8 100%)' },
  { id: 'g27', name: 'Titanium', value: 'linear-gradient(135deg, #434343 0%, #000000 100%)' },
  { id: 'g28', name: 'Silver Glow', value: 'linear-gradient(135deg, #E0E0E0 0%, #F5F5F5 100%)' },
  { id: 'g29', name: 'Cool Slate', value: 'linear-gradient(135deg, #606C88 0%, #3F4C6B 100%)' },
  { id: 'g30', name: 'Cosmic Sky', value: 'linear-gradient(135deg, #1F1C2C 0%, #928DAB 100%)' },
  { id: 'g31', name: 'Pure Gold', value: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 25%, #B38728 50%, #FBF5B7 75%, #AA771C 100%)' },
  { id: 'g32', name: 'Rainbow', value: 'linear-gradient(135deg, #FF0000 0%, #FF7F00 17%, #FFFF00 33%, #00FF00 50%, #0000FF 67%, #4B0082 83%, #9400D3 100%)' },
];

// Fonts matching exact dropdown list from screenshot and standard library
export const FONT_PRESETS: FontPreset[] = [
  { id: 'default', name: 'Normal', fontFamily: 'inherit' },
  { id: 'sansita', name: 'Sansita', fontFamily: "'Sansita', sans-serif" },
  { id: 'comfortaa', name: 'Comfortaa', fontFamily: "'Comfortaa', cursive" },
  { id: 'charm', name: 'Charm', fontFamily: "'Charm', cursive" },
  { id: 'lobster-two', name: 'Lobster Two', fontFamily: "'Lobster Two', cursive" },
  { id: 'pacifico', name: 'Pacifico', fontFamily: "'Pacifico', cursive" },
  { id: 'titan', name: 'Titan One', fontFamily: "'Titan One', cursive" },
  { id: 'fredoka', name: 'Fredoka', fontFamily: "'Fredoka', sans-serif" },
  { id: 'orbitron', name: 'Orbitron', fontFamily: "'Orbitron', sans-serif" },
  { id: 'caveat', name: 'Caveat', fontFamily: "'Caveat', cursive" },
  { id: 'bangers', name: 'Bangers', fontFamily: "'Bangers', cursive" },
  { id: 'permanent-marker', name: 'Permanent Marker', fontFamily: "'Permanent Marker', cursive" },
  { id: 'righteous', name: 'Righteous', fontFamily: "'Righteous', cursive" },
  { id: 'playfair', name: 'Playfair Display', fontFamily: "'Playfair Display', serif" },
  { id: 'cinzel', name: 'Cinzel', fontFamily: "'Cinzel', serif" },
  { id: 'space-mono', name: 'Space Mono', fontFamily: "'Space Mono', monospace" },
  { id: 'chakra', name: 'Chakra Petch', fontFamily: "'Chakra Petch', sans-serif" },
  { id: 'creepster', name: 'Creepster', fontFamily: "'Creepster', cursive" },
  { id: 'comic-neue', name: 'Comic Neue', fontFamily: "'Comic Neue', cursive" },
  { id: 'montserrat', name: 'Montserrat', fontFamily: "'Montserrat', sans-serif" },
  { id: 'poppins', name: 'Poppins', fontFamily: "'Poppins', sans-serif" },
  { id: 'exo2', name: 'Exo 2', fontFamily: "'Exo 2', sans-serif" },
  { id: 'press-start', name: 'Press Start 2P', fontFamily: "'Press Start 2P', monospace" },
];

/**
 * Computes React CSSProperties for text styling
 */
export function getTextStyleCSS(
  style?: TextStyleConfig | null,
  isUsername = false
): React.CSSProperties {
  if (!style) return {};

  const css: React.CSSProperties = {};

  // Font family
  if (style.font && style.font !== 'inherit' && style.font !== 'default' && style.font !== 'Normal') {
    const matched = FONT_PRESETS.find((f) => f.id === style.font || f.name === style.font || f.fontFamily === style.font);
    css.fontFamily = matched ? matched.fontFamily : style.font;
  }

  // Format mode: bold, heavy, italic, heavy_italic
  if (style.format) {
    switch (style.format) {
      case 'bold':
        css.fontWeight = 700;
        break;
      case 'heavy':
        css.fontWeight = 900;
        break;
      case 'italic':
        css.fontStyle = 'italic';
        break;
      case 'heavy_italic':
        css.fontWeight = 900;
        css.fontStyle = 'italic';
        break;
      case 'normal':
      default:
        if (!isUsername) css.fontWeight = 400;
        break;
    }
  }

  // Color / Gradient / Neon
  if (style.colorType === 'gradient' && style.colorValue) {
    css.background = style.colorValue;
    css.WebkitBackgroundClip = 'text';
    css.backgroundClip = 'text';
    css.WebkitTextFillColor = 'transparent';
    css.color = 'transparent';
    css.display = 'inline-block';
  } else if (style.colorType === 'neon' && style.colorValue) {
    css.color = style.colorValue;
    // Pure text-shadow with no box glow, focused on text glyphs
    css.textShadow = style.glowColor || `0 0 4px ${style.colorValue}, 0 0 10px ${style.colorValue}`;
  } else if (style.colorValue) {
    css.color = style.colorValue;
  }

  return css;
}
