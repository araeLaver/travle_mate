import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuickSearch, useAutocomplete } from '../hooks/useSearch';
import './SearchBar.css';

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="search-icon"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = 'search-autocomplete-listbox';

  useQuickSearch(query); // 검색 데이터 프리페치
  const { data: suggestions } = useAutocomplete(query);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = useCallback(() => {
    if (query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowAutocomplete(false);
      setSelectedIndex(-1);
    }
  }, [query, navigate]);

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setShowAutocomplete(false);
      setSelectedIndex(-1);
      navigate(`/search?q=${encodeURIComponent(suggestion)}`);
    },
    [navigate]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showAutocomplete || !suggestions || suggestions.length === 0) {
      if (e.key === 'Enter') {
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex]);
        } else {
          handleSearch();
        }
        break;
      case 'Escape':
        setShowAutocomplete(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const isAutocompleteOpen = showAutocomplete && suggestions && suggestions.length > 0;

  return (
    <div className="search-bar-container" ref={autocompleteRef} role="search">
      <div className="search-bar">
        <label htmlFor="search-input" className="sr-only">
          여행 그룹 검색
        </label>
        <input
          ref={inputRef}
          id="search-input"
          type="text"
          className="search-input"
          placeholder="여행 그룹 검색..."
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setShowAutocomplete(e.target.value.length >= 2);
            setSelectedIndex(-1);
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => query.length >= 2 && setShowAutocomplete(true)}
          role="combobox"
          aria-expanded={isAutocompleteOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={selectedIndex >= 0 ? `search-option-${selectedIndex}` : undefined}
        />
        <button className="search-button" onClick={handleSearch} aria-label="검색 실행">
          <span aria-hidden="true">
            <SearchIcon />
          </span>{' '}
          검색
        </button>
      </div>

      {/* 자동완성 드롭다운 */}
      {isAutocompleteOpen && (
        <div
          id={listboxId}
          className="autocomplete-dropdown"
          role="listbox"
          aria-label="추천 검색어"
        >
          <div className="autocomplete-header" aria-hidden="true">
            추천 검색어
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              id={`search-option-${index}`}
              className={`autocomplete-item ${selectedIndex === index ? 'selected' : ''}`}
              role="option"
              aria-selected={selectedIndex === index}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <span className="suggestion-icon" aria-hidden="true">
                <SearchIcon />
              </span>{' '}
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
