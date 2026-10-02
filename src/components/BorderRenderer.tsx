import React from 'react';

interface BorderRendererProps {
  borderId: string;
  className?: string;
}

export const BorderRenderer: React.FC<BorderRendererProps> = ({
  borderId,
  className = '',
}) => {
  const cleanId = borderId?.toLowerCase().trim() || '';

  return (
    <div className={`absolute -inset-[18%] pointer-events-none z-10 flex items-center justify-center ${className}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFE066" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          <linearGradient id="purple-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E879F9" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#6B21A8" />
          </linearGradient>

          <linearGradient id="frost-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5F3FC" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>

          <linearGradient id="inferno-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="40%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>

          <linearGradient id="cyber-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="50%" stopColor="#818CF8" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>

          <linearGradient id="rose-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBCFE8" />
            <stop offset="50%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#DB2777" />
          </linearGradient>

          <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#CBD5E1" />
            <stop offset="100%" stopColor="#64748B" />
          </linearGradient>

          <linearGradient id="toxic-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A3E635" />
            <stop offset="50%" stopColor="#84CC16" />
            <stop offset="100%" stopColor="#4D7C0F" />
          </linearGradient>

          {/* Glow Filters */}
          <filter id="glow-gold" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-purple" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <filter id="glow-red" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* ========================================================= */}
        {/* BORDER RENDER SWITCH                                      */}
        {/* ========================================================= */}

        {/* 1. Shadow Thorn */}
        {cleanId === 'shadow-thorn' && (
          <g filter="url(#glow-purple)">
            <circle cx="50" cy="50" r="41" stroke="#8B5CF6" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="44" stroke="#4C1D95" strokeWidth="1" strokeDasharray="4 2" />
            {/* Spikes / Thorns */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
              <polygon
                key={ang}
                points="50,6 47,12 53,12"
                fill="#C084FC"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 2. Frostbite */}
        {cleanId === 'frostbite' && (
          <g filter="url(#glow-cyan)">
            <circle cx="50" cy="50" r="41.5" stroke="url(#frost-grad)" strokeWidth="3" />
            <circle cx="50" cy="50" r="44" stroke="#E0F2FE" strokeWidth="1" strokeDasharray="3 3" />
            {/* Ice Shards */}
            {[0, 60, 120, 180, 240, 300].map((ang) => (
              <g key={ang} transform={`rotate(${ang} 50 50)`}>
                <polygon points="50,4 46,12 50,10 54,12" fill="#BAE6FD" />
              </g>
            ))}
          </g>
        )}

        {/* 3. Golden Crown */}
        {cleanId === 'golden-crown' && (
          <g filter="url(#glow-gold)">
            <circle cx="50" cy="50" r="41" stroke="url(#gold-grad)" strokeWidth="3" />
            <circle cx="50" cy="50" r="43.5" stroke="#FEF08A" strokeWidth="0.8" />
            {/* Crown Crest on top */}
            <path
              d="M38 12 L43 20 L50 8 L57 20 L62 12 L60 22 L40 22 Z"
              fill="url(#gold-grad)"
              stroke="#FFF"
              strokeWidth="0.5"
            />
            {/* Crown jewels */}
            <circle cx="50" cy="11" r="1.5" fill="#EF4444" />
            <circle cx="41" cy="15" r="1.2" fill="#3B82F6" />
            <circle cx="59" cy="15" r="1.2" fill="#3B82F6" />
          </g>
        )}

        {/* 4. Royal Purple */}
        {cleanId === 'royal-purple' && (
          <g filter="url(#glow-purple)">
            <circle cx="50" cy="50" r="41" stroke="url(#purple-grad)" strokeWidth="3.5" />
            <circle cx="50" cy="50" r="44" stroke="#F472B6" strokeWidth="1" strokeDasharray="6 3" />
            {/* Crest points */}
            {[0, 90, 180, 270].map((ang) => (
              <g key={ang} transform={`rotate(${ang} 50 50)`}>
                <circle cx="50" cy="6" r="2.5" fill="#E879F9" stroke="#FFF" strokeWidth="0.5" />
              </g>
            ))}
          </g>
        )}

        {/* 5. Cherry Blossom */}
        {cleanId === 'cherry-blossom' && (
          <g>
            <circle cx="50" cy="50" r="41" stroke="url(#rose-grad)" strokeWidth="2.5" />
            {/* Petals */}
            {[0, 72, 144, 216, 288].map((ang) => (
              <g key={ang} transform={`rotate(${ang} 50 50)`}>
                <path
                  d="M50 5 C47 0 42 6 50 11 C58 6 53 0 50 5 Z"
                  fill="#F472B6"
                  stroke="#FFF"
                  strokeWidth="0.4"
                />
                <circle cx="50" cy="8" r="1" fill="#FEE2E2" />
              </g>
            ))}
          </g>
        )}

        {/* 6. Aqua Storm */}
        {cleanId === 'aqua-storm' && (
          <g filter="url(#glow-cyan)">
            <circle cx="50" cy="50" r="41" stroke="#06B6D4" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="44" stroke="#67E8F9" strokeWidth="1.5" strokeDasharray="12 4" />
            {/* Wave nodes */}
            {[30, 110, 190, 270].map((ang) => (
              <circle key={ang} cx="50" cy="50" r="42.5" stroke="#22D3EE" strokeWidth="1" transform={`rotate(${ang} 50 50)`} />
            ))}
          </g>
        )}

        {/* 7. Inferno */}
        {cleanId === 'inferno' && (
          <g filter="url(#glow-red)">
            <circle cx="50" cy="50" r="41" stroke="url(#inferno-grad)" strokeWidth="3" />
            {/* Fire tongues */}
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((ang) => (
              <path
                key={ang}
                d="M50 7 Q47 2 50 0 Q53 2 50 7 Z"
                fill="#EF4444"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 8. Purple Flame */}
        {cleanId === 'purple-flame' && (
          <g filter="url(#glow-purple)">
            <circle cx="50" cy="50" r="41" stroke="#A855F7" strokeWidth="3" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
              <path
                key={ang}
                d="M50 6 Q46 1 50 -1 Q54 1 50 6 Z"
                fill="#C084FC"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 9. Emerald */}
        {cleanId === 'emerald' && (
          <g>
            <circle cx="50" cy="50" r="41" stroke="url(#emerald-grad)" strokeWidth="3.5" />
            <circle cx="50" cy="50" r="44" stroke="#A7F3D0" strokeWidth="1" strokeDasharray="4 4" />
            {[0, 60, 120, 180, 240, 300].map((ang) => (
              <polygon
                key={ang}
                points="50,5 47,10 53,10"
                fill="#34D399"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 10. Cyber Ring */}
        {cleanId === 'cyber-ring' && (
          <g filter="url(#glow-cyan)">
            <circle cx="50" cy="50" r="41" stroke="url(#cyber-grad)" strokeWidth="2.5" />
            <circle cx="50" cy="50" r="44.5" stroke="#22D3EE" strokeWidth="1" strokeDasharray="15 5 2 5" />
            {/* Tech notches */}
            {[0, 90, 180, 270].map((ang) => (
              <rect
                key={ang}
                x="47.5"
                y="3"
                width="5"
                height="4"
                fill="#A855F7"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 11. Silver Star */}
        {cleanId === 'silver-star' && (
          <g>
            <circle cx="50" cy="50" r="41" stroke="url(#silver-grad)" strokeWidth="3" />
            <circle cx="50" cy="50" r="43.5" stroke="#FFF" strokeWidth="0.8" />
            {/* 4-point stars */}
            {[0, 90, 180, 270].map((ang) => (
              <g key={ang} transform={`rotate(${ang} 50 50)`}>
                <path d="M50 2 L52 7 L57 9 L52 11 L50 16 L48 11 L43 9 L48 7 Z" fill="#FFF" />
              </g>
            ))}
          </g>
        )}

        {/* 12. Dark Crystal */}
        {cleanId === 'dark-crystal' && (
          <g filter="url(#glow-purple)">
            <circle cx="50" cy="50" r="41" stroke="#6B21A8" strokeWidth="3" />
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((ang) => (
              <polygon
                key={ang}
                points="50,6 47,11 53,11"
                fill="#C084FC"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 13. Ice Crown */}
        {cleanId === 'ice-crown' && (
          <g filter="url(#glow-cyan)">
            <circle cx="50" cy="50" r="41" stroke="url(#frost-grad)" strokeWidth="2.5" />
            {/* Crown Tiara Top */}
            <path
              d="M36 14 L42 21 L50 7 L58 21 L64 14 L61 23 L39 23 Z"
              fill="url(#frost-grad)"
              stroke="#FFF"
              strokeWidth="0.5"
            />
            <circle cx="50" cy="9" r="1.5" fill="#FFF" />
          </g>
        )}

        {/* 14. Sunburst */}
        {cleanId === 'sunburst' && (
          <g filter="url(#glow-gold)">
            <circle cx="50" cy="50" r="41" stroke="url(#gold-grad)" strokeWidth="3" />
            {[...Array(16)].map((_, i) => (
              <line
                key={i}
                x1="50"
                y1="3"
                x2="50"
                y2="8"
                stroke="#FDE047"
                strokeWidth="1.5"
                strokeLinecap="round"
                transform={`rotate(${i * 22.5} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 15. Blood Red */}
        {cleanId === 'blood-red' && (
          <g filter="url(#glow-red)">
            <circle cx="50" cy="50" r="41" stroke="#991B1B" strokeWidth="3.5" />
            <circle cx="50" cy="50" r="44" stroke="#EF4444" strokeWidth="1" strokeDasharray="8 4" />
            {[0, 60, 120, 180, 240, 300].map((ang) => (
              <polygon
                key={ang}
                points="50,4 46,11 54,11"
                fill="#DC2626"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 16. Starlight */}
        {cleanId === 'starlight' && (
          <g filter="url(#glow-purple)">
            <circle cx="50" cy="50" r="41" stroke="#4338CA" strokeWidth="3" />
            <circle cx="50" cy="50" r="44" stroke="#C084FC" strokeWidth="0.8" strokeDasharray="2 4" />
            {[0, 72, 144, 216, 288].map((ang) => (
              <circle
                key={ang}
                cx="50"
                cy="6"
                r="2"
                fill="#FFF"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 17. Iron Chain */}
        {cleanId === 'iron-chain' && (
          <g>
            <circle cx="50" cy="50" r="41" stroke="#64748B" strokeWidth="4" />
            <circle cx="50" cy="50" r="41" stroke="#334155" strokeWidth="1.5" strokeDasharray="3 3" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
              <rect
                key={ang}
                x="48"
                y="5"
                width="4"
                height="3"
                fill="#94A3B8"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 18. Wildfire */}
        {cleanId === 'wildfire' && (
          <g filter="url(#glow-gold)">
            <circle cx="50" cy="50" r="41" stroke="url(#inferno-grad)" strokeWidth="3" />
            {[...Array(12)].map((_, i) => (
              <path
                key={i}
                d="M50 6 Q46 1 50 -2 Q54 1 50 6 Z"
                fill="#F97316"
                transform={`rotate(${i * 30} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 19. Moonlight */}
        {cleanId === 'moonlight' && (
          <g filter="url(#glow-cyan)">
            <circle cx="50" cy="50" r="41" stroke="#38BDF8" strokeWidth="2.5" />
            {/* Crescent moon crest */}
            <path
              d="M50 0 A 7 7 0 0 1 50 14 A 5 5 0 0 0 50 0 Z"
              fill="#E0F2FE"
              transform="rotate(-25 50 7)"
            />
          </g>
        )}

        {/* 20. Toxic */}
        {cleanId === 'toxic' && (
          <g>
            <circle cx="50" cy="50" r="41" stroke="url(#toxic-grad)" strokeWidth="3.5" />
            {[0, 120, 240].map((ang) => (
              <circle
                key={ang}
                cx="50"
                cy="6"
                r="3"
                fill="#A3E635"
                stroke="#1A2E05"
                strokeWidth="0.8"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 21. Dark Matter */}
        {cleanId === 'dark-matter' && (
          <g filter="url(#glow-purple)">
            <circle cx="50" cy="50" r="41" stroke="#A855F7" strokeWidth="3" />
            <circle cx="50" cy="50" r="44" stroke="#3B0764" strokeWidth="2" strokeDasharray="10 5" />
          </g>
        )}

        {/* 22. Golden Edge */}
        {cleanId === 'golden-edge' && (
          <g filter="url(#glow-gold)">
            <circle cx="50" cy="50" r="41" stroke="url(#gold-grad)" strokeWidth="4" />
            <circle cx="50" cy="50" r="43" stroke="#FFF" strokeWidth="0.6" />
          </g>
        )}

        {/* 23. Angel */}
        {cleanId === 'angel' && (
          <g filter="url(#glow-gold)">
            <circle cx="50" cy="50" r="41" stroke="url(#gold-grad)" strokeWidth="2" />
            {/* Floating Halo above avatar */}
            <ellipse cx="50" cy="8" rx="16" ry="4" stroke="#FEF08A" strokeWidth="2.5" fill="none" />
            <ellipse cx="50" cy="8" rx="16" ry="4" stroke="#FFF" strokeWidth="0.8" fill="none" />
          </g>
        )}

        {/* 24. Void */}
        {cleanId === 'void' && (
          <g filter="url(#glow-purple)">
            <circle cx="50" cy="50" r="41" stroke="#581C87" strokeWidth="3.5" />
            {[0, 45, 90, 135, 180, 225, 270, 315].map((ang) => (
              <polygon
                key={ang}
                points="50,5 48,10 52,10"
                fill="#A855F7"
                transform={`rotate(${ang} 50 50)`}
              />
            ))}
          </g>
        )}

        {/* 25. Neon Kitty */}
        {cleanId === 'neon-kitty' && (
          <g filter="url(#glow-purple)">
            <circle cx="50" cy="50" r="41" stroke="url(#rose-grad)" strokeWidth="3" />
            {/* Cat Ears */}
            <polygon points="28,15 18,1 36,10" fill="#F472B6" stroke="#FFF" strokeWidth="0.5" />
            <polygon points="28,14 22,5 33,10" fill="#FBCFE8" />
            <polygon points="72,15 82,1 64,10" fill="#F472B6" stroke="#FFF" strokeWidth="0.5" />
            <polygon points="72,14 78,5 67,10" fill="#FBCFE8" />
          </g>
        )}
      </svg>
    </div>
  );
};
