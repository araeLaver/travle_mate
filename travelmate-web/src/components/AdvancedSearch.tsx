import React, { useState } from 'react';
import { useAdvancedSearch, usePopularTags, SearchRequest, SearchResult } from '../hooks/useSearch';
import './AdvancedSearch.css';

interface AdvancedSearchProps {
  onResults?: (results: SearchResult) => void;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({ onResults }) => {
  const [searchParams, setSearchParams] = useState<SearchRequest>({
    keyword: '',
    travelStyle: '',
    tags: [],
    destination: '',
    minMembers: undefined,
    maxMembers: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    page: 0,
    size: 20,
  });

  const searchMutation = useAdvancedSearch(searchParams);
  const { data: popularTags } = usePopularTags();

  const travelStyles = [
    { value: 'BACKPACKER', label: '배낭여행' },
    { value: 'LUXURY', label: '럭셔리' },
    { value: 'CULTURAL', label: '문화탐방' },
    { value: 'ADVENTURE', label: '모험' },
    { value: 'RELAXATION', label: '휴양' },
  ];

  const handleSearch = async () => {
    const result = await searchMutation.mutateAsync();
    if (onResults) {
      onResults(result);
    }
  };

  const handleTagToggle = (tag: string) => {
    setSearchParams((prev) => {
      const tags = prev.tags || [];
      const newTags = tags.includes(tag)
        ? tags.filter((t) => t !== tag)
        : [...tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const handleReset = () => {
    setSearchParams({
      keyword: '',
      travelStyle: '',
      tags: [],
      destination: '',
      minMembers: undefined,
      maxMembers: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 0,
      size: 20,
    });
  };

  return (
    <div className="advanced-search">
      <h2>고급 검색</h2>

      {/* 키워드 검색 */}
      <div className="search-section">
        <label>키워드</label>
        <input
          type="text"
          placeholder="그룹 이름, 설명, 목적지 검색..."
          value={searchParams.keyword || ''}
          onChange={(e) =>
            setSearchParams({ ...searchParams, keyword: e.target.value })
          }
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>

      {/* 여행 스타일 */}
      <div className="search-section">
        <label>여행 스타일</label>
        <div className="style-buttons">
          {travelStyles.map((style) => (
            <button
              key={style.value}
              className={`style-button ${
                searchParams.travelStyle === style.value ? 'active' : ''
              }`}
              onClick={() =>
                setSearchParams({
                  ...searchParams,
                  travelStyle:
                    searchParams.travelStyle === style.value ? '' : style.value,
                })
              }
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* 인기 태그 */}
      {popularTags && popularTags.length > 0 && (
        <div className="search-section">
          <label>인기 태그</label>
          <div className="tags-container">
            {popularTags.map((tag) => (
              <button
                key={tag}
                className={`tag-button ${
                  searchParams.tags?.includes(tag) ? 'active' : ''
                }`}
                onClick={() => handleTagToggle(tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 목적지 */}
      <div className="search-section">
        <label>목적지</label>
        <input
          type="text"
          placeholder="예: 제주도, 부산, 파리..."
          value={searchParams.destination || ''}
          onChange={(e) =>
            setSearchParams({ ...searchParams, destination: e.target.value })
          }
        />
      </div>

      {/* 멤버 수 */}
      <div className="search-section">
        <label>그룹 인원</label>
        <div className="range-inputs">
          <input
            type="number"
            placeholder="최소"
            min="1"
            value={searchParams.minMembers || ''}
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                minMembers: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
          <span>~</span>
          <input
            type="number"
            placeholder="최대"
            min="1"
            value={searchParams.maxMembers || ''}
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                maxMembers: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
          />
          <span>명</span>
        </div>
      </div>

      {/* 정렬 */}
      <div className="search-section">
        <label>정렬</label>
        <div className="sort-controls">
          <select
            value={searchParams.sortBy}
            onChange={(e) =>
              setSearchParams({ ...searchParams, sortBy: e.target.value })
            }
          >
            <option value="createdAt">생성일</option>
            <option value="startDate">출발일</option>
            <option value="currentMembers">멤버 수</option>
          </select>
          <select
            value={searchParams.sortOrder}
            onChange={(e) =>
              setSearchParams({
                ...searchParams,
                sortOrder: e.target.value as 'asc' | 'desc',
              })
            }
          >
            <option value="desc">내림차순</option>
            <option value="asc">오름차순</option>
          </select>
        </div>
      </div>

      {/* 버튼 */}
      <div className="search-actions">
        <button
          className="reset-button"
          onClick={handleReset}
          disabled={searchMutation.isPending}
        >
          초기화
        </button>
        <button
          className="search-button"
          onClick={handleSearch}
          disabled={searchMutation.isPending}
        >
          {searchMutation.isPending ? '검색 중...' : '검색'}
        </button>
      </div>

      {/* 검색 결과 */}
      {searchMutation.data && (
        <div className="search-results-info">
          <p>
            총 <strong>{searchMutation.data.totalResults}</strong>개의 그룹을
            찾았습니다.
          </p>
          <p className="search-time">
            검색 시간: {searchMutation.data.took?.toFixed(3)}초
          </p>
        </div>
      )}

      {searchMutation.isError && (
        <div className="search-error">
          검색 중 오류가 발생했습니다. 다시 시도해주세요.
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
