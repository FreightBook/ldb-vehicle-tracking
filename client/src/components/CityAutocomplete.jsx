import React, { useState, useEffect, useRef } from 'react';
import { MapPin, X, ChevronDown, Loader2, Hash, AlertCircle } from 'lucide-react';
import { searchIndianCities } from '../utils/indianCities';
import { searchLocations } from '../api/client';

export default function CityAutocomplete({
  label,
  placeholder = 'City name, district, or 6-digit PIN code...',
  value,
  onChange,
  onSelectCity,
  required = false,
  icon: CustomIcon,
  accentColor = 'sky',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);

  const trimmedValue = (value || '').trim();
  const isAllDigits = /^\d+$/.test(trimmedValue);
  const digitCount = isAllDigits ? trimmedValue.length : 0;

  useEffect(() => {
    const query = (value || '').trim();

    if (!query) {
      setSuggestions([]);
      setErrorMessage('');
      setLoading(false);
      return;
    }

    // 1. Instant local matching (0ms response)
    const localMatches = searchIndianCities(query, 6);
    if (localMatches.length > 0) {
      setSuggestions(localMatches);
      setIsOpen(true);
      setErrorMessage('');
    }

    // Validation for digit mode
    if (isAllDigits) {
      if (query.startsWith('0')) {
        setErrorMessage('Indian PIN codes start with 1-9 (100000–999999)');
        setSuggestions([]);
        return;
      }
      if (query.length > 6) {
        setErrorMessage('Indian PIN codes cannot exceed 6 digits');
        return;
      }
      if (query.length < 6) {
        setErrorMessage(`Enter 6 digits to lookup PIN code (${query.length}/6)`);
      } else {
        setErrorMessage('');
      }
    } else {
      setErrorMessage('');
    }

    // 2. Fetch from comprehensive All-India dataset via backend API
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    // If 6 digits PIN, search immediately with minimal debounce (100ms); otherwise 250ms for text
    const debounceDelay = isAllDigits && query.length === 6 ? 80 : 250;

    debounceTimerRef.current = setTimeout(async () => {
      // Require at least 2 characters for text or 3 digits for pincode
      if (query.length >= (isAllDigits ? 3 : 2)) {
        setLoading(true);
        try {
          const apiResults = await searchLocations(query);

          if (Array.isArray(apiResults) && apiResults.length > 0) {
            // Deduplicate local + API results
            const seen = new Set();
            const combined = [];

            for (const item of [...apiResults, ...localMatches]) {
              const key = (item.label || `${item.city || item.name}, ${item.state} ${item.pincode || ''}`).toLowerCase();
              if (!seen.has(key)) {
                seen.add(key);
                combined.push(item);
              }
            }

            setSuggestions(combined.slice(0, 8));
            setIsOpen(true);
            setErrorMessage('');
          } else if (isAllDigits && query.length === 6) {
            if (localMatches.length === 0) {
              setErrorMessage(`No location found for PIN code ${query}`);
              setSuggestions([]);
            }
          }
        } catch (err) {
          console.warn('[Location Autocomplete Error]', err.message);
          // Keep local matches if API fails
          if (localMatches.length === 0 && isAllDigits && query.length === 6) {
            setErrorMessage(`Could not reach location service for PIN ${query}`);
          }
        } finally {
          setLoading(false);
        }
      }
    }, debounceDelay);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [value]);

  // Click outside listener (desktop mouse & mobile touch)
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const handleSelect = (item) => {
    const cityName = item.city || item.name || '';
    const fullLabel =
      item.label ||
      `${cityName}, ${item.district ? `${item.district}, ` : ''}${item.state}${
        item.pincode ? ` (${item.pincode})` : ''
      }`;

    onChange(fullLabel);
    if (onSelectCity) onSelectCity(item);
    setIsOpen(false);
    setSuggestions([]);
    setErrorMessage('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      } else if (suggestions.length === 1) {
        e.preventDefault();
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {isAllDigits && (
            <span className="text-[10px] text-sky-600 font-medium flex items-center gap-0.5">
              <Hash className="w-2.5 h-2.5" /> PIN Mode
            </span>
          )}
        </div>
      )}

      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className={`w-full px-3 py-2 pl-9 pr-8 bg-gray-50 border ${
            errorMessage && digitCount === 6 ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
          } rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-${accentColor}-500 focus:bg-white transition min-h-[38px]`}
        />

        {loading ? (
          <Loader2 className="w-4 h-4 text-sky-600 animate-spin absolute left-2.5 top-2.5 pointer-events-none" />
        ) : isAllDigits ? (
          <Hash className="w-4 h-4 text-sky-600 absolute left-2.5 top-2.5 pointer-events-none" />
        ) : CustomIcon ? (
          <CustomIcon className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
        ) : (
          <MapPin className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5 pointer-events-none" />
        )}

        {value ? (
          <button
            type="button"
            onClick={() => {
              onChange('');
              setSuggestions([]);
              setErrorMessage('');
              inputRef.current?.focus();
            }}
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 transition w-6 h-6 flex items-center justify-center rounded-full hover:bg-gray-200 touch-manipulation active:scale-95"
            title="Clear"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-gray-300 absolute right-2.5 top-2.5 pointer-events-none" />
        )}
      </div>

      {/* PIN Code Hint or Error Message */}
      {errorMessage && (
        <div
          className={`mt-1 text-[11px] flex items-center gap-1 ${
            digitCount === 6 || (value || '').startsWith('0') ? 'text-red-600 font-medium' : 'text-gray-500'
          }`}
        >
          {digitCount === 6 || (value || '').startsWith('0') ? (
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
          ) : null}
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-[80] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 sm:max-h-56 overflow-y-auto py-1 divide-y divide-gray-50 animate-fadeIn overscroll-contain">
          {suggestions.map((item, idx) => {
            const isHighlighted = idx === highlightedIndex;
            const displayName = item.city || item.name || '';

            return (
              <div
                key={`${displayName}-${item.state}-${item.pincode || idx}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(item);
                }}
                onClick={() => {
                  handleSelect(item);
                }}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`min-h-[40px] px-3 py-2 cursor-pointer touch-manipulation flex items-center justify-between text-xs transition ${
                  isHighlighted ? 'bg-sky-50 text-sky-900 font-medium' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MapPin
                    className={`w-3.5 h-3.5 flex-shrink-0 ${
                      isHighlighted ? 'text-sky-600' : 'text-gray-400'
                    }`}
                  />
                  <div className="truncate">
                    <span className="font-semibold text-gray-900">{displayName}</span>
                    {item.district && item.district.toLowerCase() !== displayName.toLowerCase() && (
                      <span className="text-[10px] text-gray-500 ml-1">({item.district})</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  {item.state && (
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 rounded-full border border-gray-200">
                      {item.state}
                    </span>
                  )}
                  {item.pincode && (
                    <span className="px-1.5 py-0.5 text-[9px] font-bold bg-sky-100 text-sky-800 rounded font-mono border border-sky-200">
                      {item.pincode}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
