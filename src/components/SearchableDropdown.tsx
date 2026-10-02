import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, Check, X } from 'lucide-react';

interface Option {
  value: string;
  label: string;
}

interface SearchableDropdownProps {
  id: string;
  label: string;
  placeholder?: string;
  options: (string | Option)[];
  value: string;
  onChange: (value: string) => void;
  error?: string;
  searchPlaceholder?: string;
}

export const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  id,
  label,
  placeholder = 'Select an option',
  options,
  value,
  onChange,
  error,
  searchPlaceholder = 'Type to search...',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to { value, label }
  const normalizedOptions: Option[] = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  // Filter options based on search query
  const filteredOptions = normalizedOptions.filter((opt) =>
    opt.label.toLowerCase().includes(searchTerm.toLowerCase().trim())
  );

  const selectedOption = normalizedOptions.find((opt) => opt.value === value);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      try {
        if (
          dropdownRef.current &&
          event.target instanceof Node &&
          !dropdownRef.current.contains(event.target)
        ) {
          setIsOpen(false);
          setSearchTerm('');
        }
      } catch {
        // Safe fallback
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (e.key === 'Enter' && isOpen && filteredOptions.length > 0) {
      e.preventDefault();
      handleSelect(filteredOptions[0].value);
    }
  };

  return (
    <div className="relative flex flex-col gap-1.5 w-full text-left" ref={dropdownRef}>
      <label htmlFor={id} className="text-xs font-medium text-neutral-300">
        {label}
      </label>

      {/* Dropdown Trigger */}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3.5 py-2.5 text-sm bg-[#16171a] border rounded-md transition-all duration-150 outline-none text-left ${
          error
            ? 'border-red-500/80 focus:border-red-400'
            : isOpen
            ? 'border-zinc-400 shadow-sm shadow-black/20'
            : 'border-[#2c2d33] hover:border-zinc-600 focus:border-zinc-400'
        } ${selectedOption ? 'text-neutral-100' : 'text-neutral-500'}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-neutral-400 shrink-0 ml-2 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-neutral-200' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label={label}
          onKeyDown={handleKeyDown}
          className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-[#1c1d22] border border-[#2f313a] rounded-md shadow-2xl shadow-black/60 overflow-hidden flex flex-col"
        >
          {/* Search / Filter Input */}
          <div className="p-2 border-b border-[#2b2d35] bg-[#191a1f]">
            <div className="relative flex items-center">
              <Search className="absolute left-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-8 pr-7 py-1.5 text-xs bg-[#121316] border border-[#2d2f38] rounded text-neutral-200 placeholder-neutral-500 outline-none focus:border-zinc-400 focus:ring-0 transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 text-neutral-400 hover:text-neutral-200 p-0.5"
                  aria-label="Clear search"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-xs transition-colors text-left ${
                      isSelected
                        ? 'bg-[#292b34] text-white font-medium'
                        : 'text-neutral-300 hover:bg-[#25262f] hover:text-white'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-neutral-200 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3.5 py-3 text-xs text-neutral-500 text-center">
                No matching options
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <span className="text-[11px] text-red-400 tracking-wide mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
};
