import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, MapPin, Code, Building, X, TrendingUp } from 'lucide-react';
import { searchAccuracy } from '../utils/searchAccuracy';
import { getSearchSuggestions } from '../api/search';

interface SearchSuggestion {
  text: string;
  type: 'job' | 'skill' | 'location' | 'company';
  category?: string;
}

interface EnhancedSearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect?: (suggestion: SearchSuggestion) => void;
  type?: 'job' | 'skill' | 'location' | 'company' | 'mixed';
  icon?: React.ReactNode;
  className?: string;
  suggestions?: string[];
  showCategories?: boolean;
  maxSuggestions?: number;
  debounceMs?: number;
}

const EnhancedSearchInput: React.FC<EnhancedSearchInputProps> = ({
  placeholder = 'Search...',
  value,
  onChange,
  onSelect,
  type = 'mixed',
  icon,
  className = '',
  suggestions: externalSuggestions,
  showCategories = true,
  maxSuggestions = 10,
  debounceMs = 200
}) => {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Debounced suggestion fetching
  const fetchSuggestions = useCallback(async (query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (!query || query.length < 1) {
        // Show popular suggestions for empty input
        const popularSuggestions = getPopularSuggestions(type);
        setSuggestions(popularSuggestions);
        return;
      }

      setLoading(true);
      try {
        let allSuggestions: SearchSuggestion[] = [];

        if (externalSuggestions) {
          // Use provided suggestions
          const matches = searchAccuracy.getAccurateMatches(query, externalSuggestions, type === 'mixed' ? 'job' : type);
          allSuggestions = matches.slice(0, maxSuggestions).map(m => ({
            text: m.item,
            type: type === 'mixed' ? 'job' : type
          }));
        } else if (type === 'mixed') {
          // Mixed search - get suggestions from multiple categories
          const [jobSuggestions, skillSuggestions, locationSuggestions, companySuggestions] = await Promise.all([
            getSearchSuggestions(query, 'job').catch(() => []),
            getSearchSuggestions(query, 'skill').catch(() => []),
            getSearchSuggestions(query, 'location').catch(() => []),
            getSearchSuggestions(query, 'company').catch(() => [])
          ]);

          allSuggestions = [
            ...jobSuggestions.slice(0, 4).map(text => ({ text, type: 'job' as const, category: 'Jobs' })),
            ...skillSuggestions.slice(0, 3).map(text => ({ text, type: 'skill' as const, category: 'Skills' })),
            ...locationSuggestions.slice(0, 2).map(text => ({ text, type: 'location' as const, category: 'Locations' })),
            ...companySuggestions.slice(0, 2).map(text => ({ text, type: 'company' as const, category: 'Companies' }))
          ];
        } else {
          // Single type search
          const apiSuggestions = await getSearchSuggestions(query, type);
          allSuggestions = apiSuggestions.slice(0, maxSuggestions).map(text => ({
            text,
            type
          }));
        }

        setSuggestions(allSuggestions);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
  }, [type, externalSuggestions, maxSuggestions, debounceMs]);

  useEffect(() => {
    fetchSuggestions(value);
  }, [value, fetchSuggestions]);

  const getPopularSuggestions = (searchType: string): SearchSuggestion[] => {
    const popular = {
      job: ['Software Engineer', 'Data Scientist', 'Product Manager', 'Frontend Developer', 'Backend Developer'],
      skill: ['JavaScript', 'Python', 'React', 'Java', 'SQL', 'HTML', 'CSS', 'Node.js'],
      location: ['Remote', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai', 'Hyderabad'],
      company: ['Google', 'Microsoft', 'Amazon', 'TCS', 'Infosys'],
      mixed: [
        { text: 'Software Engineer', type: 'job' as const, category: 'Popular Jobs' },
        { text: 'JavaScript', type: 'skill' as const, category: 'Popular Skills' },
        { text: 'Remote', type: 'location' as const, category: 'Popular Locations' },
        { text: 'Google', type: 'company' as const, category: 'Popular Companies' }
      ]
    };

    if (searchType === 'mixed') {
      return popular.mixed;
    }

    return (popular[searchType as keyof typeof popular] as string[] || []).map(text => ({
      text,
      type: searchType as any
    }));
  };

  const getIcon = (suggestionType: string) => {
    switch (suggestionType) {
      case 'job': return <Search className="w-4 h-4 text-blue-500" />;
      case 'skill': return <Code className="w-4 h-4 text-green-500" />;
      case 'location': return <MapPin className="w-4 h-4 text-red-500" />;
      case 'company': return <Building className="w-4 h-4 text-purple-500" />;
      default: return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedIndex(-1);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onChange(suggestion.text);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    onSelect?.(suggestion);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % suggestions.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev <= 0 ? suggestions.length - 1 : prev - 1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleClear = () => {
    onChange('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Group suggestions by category if enabled
  const groupedSuggestions = showCategories && type === 'mixed' 
    ? suggestions.reduce((acc, suggestion) => {
        const category = suggestion.category || 'Other';
        if (!acc[category]) acc[category] = [];
        acc[category].push(suggestion);
        return acc;
      }, {} as Record<string, SearchSuggestion[]>)
    : { 'All': suggestions };

  return (
    <div className="relative">
      <div className={`relative ${className}`}>
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`w-full ${icon ? 'pl-10' : 'pl-4'} ${value ? 'pr-10' : 'pr-4'} py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-white text-gray-900`}
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all z-10 flex items-center justify-center w-5 h-5 rounded-full"
            title="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {showSuggestions && (suggestions.length > 0 || loading) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              Loading suggestions...
            </div>
          ) : (
            Object.entries(groupedSuggestions).map(([category, categorySuggestions]) => (
              <div key={category}>
                {showCategories && type === 'mixed' && categorySuggestions.length > 0 && (
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                    <TrendingUp className="w-3 h-3" />
                    {category}
                  </div>
                )}
                {categorySuggestions.map((suggestion, index) => {
                  const globalIndex = suggestions.indexOf(suggestion);
                  return (
                    <button
                      key={`${suggestion.type}-${suggestion.text}-${index}`}
                      type="button"
                      onMouseDown={() => handleSuggestionClick(suggestion)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-b-0 flex items-center gap-3 transition-colors ${
                        selectedIndex === globalIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {getIcon(suggestion.type)}
                      <span className="flex-1">{suggestion.text}</span>
                      {suggestion.type !== 'job' && (
                        <span className="text-xs text-gray-400 capitalize">{suggestion.type}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedSearchInput;