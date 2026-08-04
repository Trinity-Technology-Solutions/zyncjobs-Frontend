import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  KeyboardEvent,
  MouseEvent,
  ChangeEvent,
  FocusEvent,
} from 'react';
import { ChevronDown, X, Loader2, Plus, Check } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface AutocompleteComboboxProps {
  label?: string;
  name?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: ComboboxOption[];
  allowCustom?: boolean;
  customLabel?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  autoFocus?: boolean;
  maxOptions?: number;
  debounceMs?: number;
  loadMore?: () => Promise<ComboboxOption[]>;
  hasMore?: boolean;
  id?: string;
}

export const AutocompleteCombobox: React.FC<AutocompleteComboboxProps> = ({
  label,
  name,
  placeholder = 'Search or select...',
  value,
  onChange,
  onBlur,
  options: allOptions = [],
  allowCustom = false,
  customLabel = 'Create new',
  disabled = false,
  required = false,
  error,
  helperText,
  className = '',
  autoFocus = false,
  maxOptions = 10,
  debounceMs = 150,
  loadMore,
  hasMore = false,
  id,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        return JSON.parse(localStorage.getItem('combobox_recent') || '[]');
      } catch { return []; }
    }
    return [];
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLLIElement | null)[]>([]);
  const debounceRef = useRef<NodeJS.Timeout>();
  const mountedRef = useRef(true);
  const isComposingRef = useRef(false);

  const generatedId = useMemo(() => `combobox-${Math.random().toString(36).slice(2, 9)}`, []);
  const comboboxId = id || generatedId;
  const listboxId = `${comboboxId}-listbox`;
  const inputId = `${comboboxId}-input`;

  const filteredOptions = useMemo(() => {
    if (!searchQuery && recentSearches.length > 0 && !value) {
      return recentSearches.map((r, i) => ({ value: r, label: r, isRecent: true }));
    }
    const opts = allOptions
      .filter(opt => !opt.disabled)
      .filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        opt.value.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return opts.slice(0, maxOptions);
  }, [searchQuery, allOptions, maxOptions, recentSearches, value]);

  const showDropdown = filteredOptions.length > 0 || (allowCustom && searchQuery.length > 0) || isLoading;

  const addRecentSearch = useCallback((val: string) => {
    if (!val.trim()) return;
    setRecentSearches(prev => {
      const next = [val, ...prev.filter(v => v !== val)].slice(0, 5);
      try { localStorage.setItem('combobox_recent', JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const selectOption = useCallback((option: ComboboxOption | { value: string; label: string; isRecent?: boolean }) => {
    onChange(option.value);
    addRecentSearch(option.value);
    setSearchQuery('');
    setHighlightedIndex(-1);
    setIsOpen(false);
    inputRef.current?.focus();
  }, [onChange, addRecentSearch]);

  const handleCustomCreate = useCallback(() => {
    if (allowCustom && searchQuery.trim() && !filteredOptions.some(o => o.value.toLowerCase() === searchQuery.trim().toLowerCase())) {
      const newOpt = { value: searchQuery.trim(), label: searchQuery.trim() };
      selectOption(newOpt);
    }
  }, [allowCustom, searchQuery, filteredOptions, selectOption]);

  const openDropdown = useCallback(() => {
    if (!disabled) {
      setIsOpen(true);
      setHighlightedIndex(-1);
    }
  }, [disabled]);

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSearchQuery('');
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    const options = filteredOptions;
    const maxIndex = options.length - 1;

    switch (e.key) {
      case 'ArrowDown': {
        e.preventDefault();
        if (!isOpen) {
          openDropdown();
        } else if (maxIndex >= 0) {
          setHighlightedIndex(prev => (prev < maxIndex ? prev + 1 : 0));
        }
        break;
      }
      case 'ArrowUp': {
        e.preventDefault();
        if (isOpen && maxIndex >= 0) {
          setHighlightedIndex(prev => (prev <= 0 ? maxIndex : prev - 1));
        }
        break;
      }
      case 'Enter': {
        if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
          e.preventDefault();
          selectOption(options[highlightedIndex]);
        } else if (isOpen && allowCustom && searchQuery.trim()) {
          e.preventDefault();
          handleCustomCreate();
        } else if (!isOpen) {
          openDropdown();
        }
        break;
      }
      case 'Escape': {
        e.preventDefault();
        closeDropdown();
        inputRef.current?.blur();
        break;
      }
      case 'Tab': {
        if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
          e.preventDefault();
          selectOption(options[highlightedIndex]);
        }
        closeDropdown();
        break;
      }
      case 'Home': {
        if (isOpen && maxIndex >= 0) {
          e.preventDefault();
          setHighlightedIndex(0);
        }
        break;
      }
      case 'End': {
        if (isOpen && maxIndex >= 0) {
          e.preventDefault();
          setHighlightedIndex(maxIndex);
        }
        break;
      }
      default:
        break;
    }
  }, [isOpen, filteredOptions, highlightedIndex, openDropdown, closeDropdown, selectOption, allowCustom, searchQuery, handleCustomCreate]);

  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (!isOpen) openDropdown();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      // debounced search if needed
    }, debounceMs);
  }, [isOpen, openDropdown, debounceMs]);

  const handleInputBlur = useCallback((e: FocusEvent<HTMLInputElement>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setTimeout(() => {
      if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
        closeDropdown();
        onBlur?.();
      }
    }, 100);
  }, [closeDropdown, onBlur]);

  const handleOptionClick = useCallback((option: ComboboxOption | { value: string; label: string; isRecent?: boolean }) => {
    selectOption(option);
  }, [selectOption]);

  const handleLoadMore = useCallback(async () => {
    if (!loadMore || isLoading) return;
    setIsLoading(true);
    try {
      await loadMore();
    } finally {
      setIsLoading(false);
    }
  }, [loadMore, isLoading]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (isOpen && highlightedIndex >= 0) {
      const el = optionRefs.current[highlightedIndex];
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
          inputRef.current && !inputRef.current.contains(e.target as Node)) {
        closeDropdown();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [closeDropdown]);

  const renderOptions = () => {
    if (isLoading) {
      return (
        <li className="px-3 py-3 text-center text-gray-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </li>
      );
    }

    if (filteredOptions.length === 0) {
      if (allowCustom && searchQuery.trim()) {
        return (
          <li
            role="option"
            id={`${listboxId}-custom`}
            className="px-3 py-3 flex items-center gap-2 text-blue-600 hover:bg-blue-50 cursor-pointer"
            onClick={handleCustomCreate}
            onMouseDown={e => e.preventDefault()}
          >
            <Plus className="w-4 h-4" />
            <span>{customLabel}: "{searchQuery}"</span>
          </li>
        );
      }
      return (
        <li className="px-3 py-3 text-center text-gray-500">
          No matching options
        </li>
      );
    }

    return filteredOptions.map((opt, idx) => (
      <li
        key={opt.value}
        ref={el => { optionRefs.current[idx] = el; }}
        role="option"
        id={`${listboxId}-option-${idx}`}
        aria-selected={idx === highlightedIndex}
        aria-disabled={opt.disabled}
        className={`
          px-3 py-2.5 cursor-pointer transition-colors duration-100
          ${opt.disabled ? 'text-gray-400 cursor-not-allowed' : ''}
          ${idx === highlightedIndex
            ? 'bg-blue-50 text-blue-700 outline-none'
            : 'text-gray-700 hover:bg-gray-50'}
        `}
        onClick={() => !opt.disabled && handleOptionClick(opt)}
        onMouseDown={e => e.preventDefault()}
        onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
      >
        <span className="truncate block">{opt.label}</span>
        {idx === highlightedIndex && !opt.disabled && (
          <Check className="w-4 h-4 text-blue-600 ml-2 flex-shrink-0" />
        )}
      </li>
    ));
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative">
        <div
          className={`
            relative flex items-center
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${error ? 'border-red-300 bg-red-50' : isOpen ? 'border-blue-300 bg-white' : 'border-gray-300 bg-white'}
            rounded-lg border transition-all duration-150
            hover:border-gray-400 focus-within:ring-2 focus-within:ring-blue-500/20
          `}
        >
          <input
            ref={inputRef}
            id={inputId}
            name={name}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            role="combobox"
            aria-autocomplete="list"
            aria-haspopup="listbox"
            aria-expanded={isOpen && showDropdown}
            aria-controls={listboxId}
            aria-activedescendant={highlightedIndex >= 0 ? `${listboxId}-option-${highlightedIndex}` : undefined}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            placeholder={placeholder}
            value={value || searchQuery}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={(e) => {
              if (!isComposingRef.current) openDropdown();
            }}
            onBlur={handleInputBlur}
            onCompositionStart={() => { isComposingRef.current = true; }}
            onCompositionEnd={(e) => {
              isComposingRef.current = false;
              handleInputChange(e as unknown as ChangeEvent<HTMLInputElement>);
            }}
            disabled={disabled}
            required={required}
            className="
              flex-1 w-full px-4 py-2.5 pr-10 bg-transparent border-none outline-none
              text-gray-900 placeholder:text-gray-400
              disabled:cursor-not-allowed
            "
            autoFocus={autoFocus}
          />
          <button
            type="button"
            tabIndex={-1}
            onClick={isOpen ? closeDropdown : openDropdown}
            onMouseDown={e => e.preventDefault()}
            disabled={disabled}
            aria-label={isOpen ? 'Close dropdown' : 'Open dropdown'}
            className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isLoading && (
            <Loader2 className="absolute right-10 w-5 h-5 animate-spin text-blue-500" />
          )}
        </div>

        {isOpen && showDropdown && (
          <div
            ref={dropdownRef}
            role="listbox"
            id={listboxId}
            aria-label={label || 'Options'}
            className="
              fixed z-50 mt-1 w-full max-h-60 overflow-auto
              bg-white border border-gray-200 rounded-lg shadow-lg
              animate-dropdown-in
            "
          >
            <ul ref={listRef} className="py-1">
              {renderOptions()}
            </ul>
            {hasMore && !isLoading && (
              <div className="border-t border-gray-100 px-3 py-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Load more options
                </button>
              </div>
            )}
          </div>
        )}

        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
};

export default AutocompleteCombobox;
