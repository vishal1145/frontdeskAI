import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * CustomSelect - Dropdown matching the FrontDesk floating menu design from the user menu.
 * Floating card: rounded-2xl, bg-white, border border-slate-200/80, shadow-xl, p-1.5.
 * Options: rounded-xl, px-3, py-2, text-xs, font-medium, hover:bg-slate-50, active:bg-blue-50/text-blue-700.
 * Pure UI styling without any icons, exactly as requested.
 */
export default function CustomSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  className = '',
  menuClassName = '',
  align = 'left',
  id,
  disabled = false,
  'aria-label': ariaLabel,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Normalize options: can be string[] or { value, label }[]
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return { value: opt.value, label: opt.label ?? opt.value };
    }
    return { value: opt, label: String(opt) };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value));
  const displayLabel = selectedOption ? selectedOption.label : placeholder;

  // Close on outside click or Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const isFullWidth = className.includes('w-full');

  return (
    <div
      ref={containerRef}
      className={`relative text-left ${isFullWidth ? 'w-full' : 'inline-block'}`}
    >
      <button
        type="button"
        id={id}
        aria-label={ariaLabel || displayLabel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={
          className ||
          `h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-2.5 transition-all duration-200 cursor-pointer ${
            isOpen
              ? 'bg-white text-blue-700 border border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white text-slate-700 border border-slate-300 shadow-[0_1px_2px_theme(colors.ink.DEFAULT_/_0.04)] hover:border-slate-400'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`
        }
      >
        <span className="truncate">{displayLabel}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="listbox"
          className={`absolute ${
            align === 'right' ? 'right-0' : 'left-0'
          } top-full mt-1.5 min-w-full w-max max-w-xs rounded-2xl bg-white border border-slate-200/80 shadow-xl shadow-slate-900/10 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 max-h-64 overflow-y-auto ${menuClassName}`}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                type="button"
                role="option"
                key={String(opt.value)}
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-3 py-2 rounded-xl text-xs font-medium text-left cursor-pointer transition-colors whitespace-nowrap ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span className="truncate">{opt.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
