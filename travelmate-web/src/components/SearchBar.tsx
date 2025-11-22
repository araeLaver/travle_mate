import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuickSearch, useAutocomplete } from '../hooks/useSearch';
import './SearchBar.css';

const SearchBar: React.FC = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const autocompleteRef = useRef<HTMLDivElement>(null);

  const { data: searchResults } = useQuickSearch(query);
  const { data: suggestions } = useAutocomplete(query);

  // 외부 클릭 감지
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        autocompleteRef.current &&
        !autocompleteRef.current.contains(event.target as Node)
      ) {
        setShowAutocomplete(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = () => {
    if (query.trim().length >= 2) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setShowAutocomplete(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowAutocomplete(false);
    navigate(`/search?q=${encodeURIComponent(suggestion)}`);
  };

  return (
    <div className="search-bar-container" ref={autocompleteRef}>
      <div className="search-bar">
        <input
          type="text"
          className="search-input"
          placeholder="여행 그룹 검색..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowAutocomplete(e.target.value.length >= 2);
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          onFocus={() => query.length >= 2 && setShowAutocomplete(true)}
        />
        <button className="search-button" onClick={handleSearch}>
          🔍 검색
        </button>
      </div>

      {/* 자동완성 드롭다운 */}
      {showAutocomplete && suggestions && suggestions.length > 0 && (
        <div className="autocomplete-dropdown">
          <div className="autocomplete-header">추천 검색어</div>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="autocomplete-item"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              🔍 {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
