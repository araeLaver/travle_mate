import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService, CreateGroupRequest } from '../services/groupService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import './CreateGroup.css';

// SVG Icons
const MapIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
    <line x1="8" y1="2" x2="8" y2="18" />
    <line x1="16" y1="6" x2="16" y2="22" />
  </svg>
);

const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const CalendarIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const UsersIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const WalletIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z" />
  </svg>
);

const TagIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);

const ClipboardIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

const SparklesIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M5 19l.5 1.5L7 21l-1.5.5L5 23l-.5-1.5L3 21l1.5-.5L5 19z" />
    <path d="M19 12l.5 1.5L21 14l-1.5.5L19 16l-.5-1.5L17 14l1.5-.5L19 12z" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
);

const CreateGroup: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [touched, setTouched] = useState({
    name: false,
    destination: false,
    startDate: false,
    endDate: false,
  });
  const [formData, setFormData] = useState<CreateGroupRequest>({
    name: '',
    description: '',
    destination: '',
    startDate: new Date(),
    endDate: new Date(),
    maxMembers: 4,
    tags: [],
    travelStyle: '문화탐방',
    requirements: [],
    budget: {
      min: 100000,
      max: 300000,
      currency: 'KRW',
    },
  });

  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  // 실시간 유효성 검사
  const validation = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return {
      name: formData.name.trim().length >= 2 && formData.name.trim().length <= 50,
      destination: formData.destination.trim().length >= 2,
      startDate: formData.startDate >= today,
      endDate: formData.endDate > formData.startDate,
      budget: !formData.budget || formData.budget.min <= formData.budget.max,
    };
  }, [formData]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const travelStyles = [
    '문화탐방',
    '자연관광',
    '미식투어',
    '모험가',
    '힐링여행',
    '사진가',
    '배낭여행',
    '럭셔리 여행',
    '등산/트레킹',
    '도시탐험',
  ];

  const popularTags = [
    '맛집',
    '사진촬영',
    '박물관',
    '자연관광',
    '쇼핑',
    '카페투어',
    '야경',
    '축제',
    '해변',
    '산악',
    '역사',
    '예술',
    '음악',
    '스포츠',
  ];

  const handleInputChange = (
    field: keyof CreateGroupRequest,
    value: CreateGroupRequest[keyof CreateGroupRequest]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBudgetChange = (field: 'min' | 'max', value: number) => {
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget!,
        [field]: value,
      },
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      'tags',
      formData.tags.filter(tag => tag !== tagToRemove)
    );
  };

  const addPopularTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      handleInputChange('tags', [...formData.tags, tag]);
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !formData.requirements.includes(newRequirement.trim())) {
      handleInputChange('requirements', [...formData.requirements, newRequirement.trim()]);
      setNewRequirement('');
    }
  };

  const removeRequirement = (reqToRemove: string) => {
    handleInputChange(
      'requirements',
      formData.requirements.filter(req => req !== reqToRemove)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 모든 필드 터치 처리
    setTouched({
      name: true,
      destination: true,
      startDate: true,
      endDate: true,
    });

    if (!validation.name) {
      toast.warning('그룹명은 2~50자로 입력해주세요.');
      return;
    }

    if (!validation.destination) {
      toast.warning('목적지는 2자 이상 입력해주세요.');
      return;
    }

    if (!validation.endDate) {
      toast.warning('종료일은 시작일보다 늦어야 합니다.');
      return;
    }

    if (!validation.budget) {
      toast.warning('최대 예산이 최소 예산보다 크거나 같아야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      groupService.createGroup({
        ...formData,
        description: formData.description || '함께 여행할 메이트를 찾습니다!',
      });

      toast.success('그룹이 성공적으로 생성되었습니다!');
      navigate(`/groups`);
    } catch (error) {
      logError('CreateGroup.handleSubmit', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const parseDate = (dateString: string) => {
    return new Date(dateString);
  };

  return (
    <div className="create-group-container">
      <header className="create-group-header">
        <button
          className="back-btn"
          onClick={() => navigate('/groups')}
          aria-label="그룹 목록으로 돌아가기"
        >
          <ArrowLeftIcon /> 뒤로가기
        </button>
        <h1>
          <MapIcon /> 새 여행 그룹 만들기
        </h1>
        <p>함께할 여행 메이트들을 모집해보세요!</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="create-group-form"
        aria-label="여행 그룹 생성 양식"
        noValidate
      >
        <fieldset className="form-section">
          <legend>
            <EditIcon /> 기본 정보
          </legend>

          <div className="form-group">
            <label htmlFor="name">
              그룹명 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={e => handleInputChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              placeholder="예: 🌸 봄 벚꽃 여행"
              className={`form-input ${touched.name ? (validation.name ? 'valid' : 'invalid') : ''}`}
              maxLength={50}
              required
              aria-required="true"
              aria-invalid={touched.name && !validation.name}
              aria-describedby={touched.name && !validation.name ? 'name-error' : undefined}
            />
            {touched.name && !validation.name && (
              <span id="name-error" className="validation-message error" role="alert">
                그룹명은 2~50자로 입력해주세요
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="destination">
              목적지 <span aria-hidden="true">*</span>
              <span className="sr-only">(필수)</span>
            </label>
            <input
              type="text"
              id="destination"
              value={formData.destination}
              onChange={e => handleInputChange('destination', e.target.value)}
              onBlur={() => handleBlur('destination')}
              placeholder="예: 제주도, 부산, 경주"
              className={`form-input ${touched.destination ? (validation.destination ? 'valid' : 'invalid') : ''}`}
              required
              aria-required="true"
              aria-invalid={touched.destination && !validation.destination}
              aria-describedby={
                touched.destination && !validation.destination ? 'destination-error' : undefined
              }
            />
            {touched.destination && !validation.destination && (
              <span id="destination-error" className="validation-message error" role="alert">
                목적지는 2자 이상 입력해주세요
              </span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">그룹 설명</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={e => handleInputChange('description', e.target.value)}
              placeholder="어떤 여행을 계획하고 있는지 자세히 설명해주세요..."
              className="form-textarea"
              rows={4}
              maxLength={500}
              aria-describedby="description-hint"
            />
            <span id="description-hint" className="sr-only">
              최대 500자까지 입력 가능
            </span>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>
            <CalendarIcon /> 여행 일정
          </legend>

          <div className="date-group">
            <div className="form-group">
              <label htmlFor="startDate">
                시작일 <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </label>
              <input
                type="date"
                id="startDate"
                value={formatDate(formData.startDate)}
                onChange={e => handleInputChange('startDate', parseDate(e.target.value))}
                className="form-input"
                min={formatDate(new Date())}
                required
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label htmlFor="endDate">
                종료일 <span aria-hidden="true">*</span>
                <span className="sr-only">(필수)</span>
              </label>
              <input
                type="date"
                id="endDate"
                value={formatDate(formData.endDate)}
                onChange={e => handleInputChange('endDate', parseDate(e.target.value))}
                className="form-input"
                min={formatDate(formData.startDate)}
                required
                aria-required="true"
                aria-describedby="date-hint"
              />
              <span id="date-hint" className="sr-only">
                종료일은 시작일보다 나중이어야 합니다
              </span>
            </div>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>
            <UsersIcon /> 그룹 설정
          </legend>

          <div className="form-group">
            <label htmlFor="maxMembers">최대 인원</label>
            <select
              id="maxMembers"
              value={formData.maxMembers}
              onChange={e => handleInputChange('maxMembers', parseInt(e.target.value))}
              className="form-select"
              aria-describedby="members-hint"
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>
                  {num}명
                </option>
              ))}
            </select>
            <span id="members-hint" className="sr-only">
              그룹에 참여할 수 있는 최대 인원 수
            </span>
          </div>

          <div className="form-group">
            <label htmlFor="travelStyle">여행 스타일</label>
            <select
              id="travelStyle"
              value={formData.travelStyle}
              onChange={e => handleInputChange('travelStyle', e.target.value)}
              className="form-select"
            >
              {travelStyles.map(style => (
                <option key={style} value={style}>
                  {style}
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>
            <WalletIcon /> 예산
          </legend>

          <div className="budget-group">
            <div className="form-group">
              <label htmlFor="minBudget">최소 예산 (원)</label>
              <input
                type="number"
                id="minBudget"
                value={formData.budget?.min || 0}
                onChange={e => handleBudgetChange('min', parseInt(e.target.value) || 0)}
                className="form-input"
                min="0"
                step="10000"
                aria-describedby="budget-hint"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxBudget">최대 예산 (원)</label>
              <input
                type="number"
                id="maxBudget"
                value={formData.budget?.max || 0}
                onChange={e => handleBudgetChange('max', parseInt(e.target.value) || 0)}
                className="form-input"
                min="0"
                step="10000"
              />
            </div>
          </div>
          <span id="budget-hint" className="sr-only">
            1인당 예상 여행 경비
          </span>
        </fieldset>

        <fieldset className="form-section">
          <legend>
            <TagIcon /> 태그
          </legend>
          <p className="section-description" id="tags-description">
            여행의 특징을 나타내는 태그를 추가해주세요.
          </p>

          <div className="tag-input-group">
            <label htmlFor="new-tag" className="sr-only">
              새 태그 입력
            </label>
            <input
              type="text"
              id="new-tag"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              placeholder="태그 입력..."
              className="form-input"
              maxLength={20}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
              aria-describedby="tags-description"
            />
            <button type="button" onClick={addTag} className="add-btn" aria-label="태그 추가">
              추가
            </button>
          </div>

          <div className="popular-tags">
            <p id="popular-tags-label">인기 태그:</p>
            <div className="popular-tags-grid" role="group" aria-labelledby="popular-tags-label">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addPopularTag(tag)}
                  className={`popular-tag ${formData.tags.includes(tag) ? 'selected' : ''}`}
                  disabled={formData.tags.includes(tag)}
                  aria-pressed={formData.tags.includes(tag)}
                  aria-label={formData.tags.includes(tag) ? `${tag} (선택됨)` : tag}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="selected-tags" role="list" aria-label="선택된 태그">
            {formData.tags.map(tag => (
              <span key={tag} className="selected-tag" role="listitem">
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="remove-tag"
                  aria-label={`${tag} 태그 삭제`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </span>
            ))}
          </div>
        </fieldset>

        <fieldset className="form-section">
          <legend>
            <ClipboardIcon /> 참가 조건
          </legend>
          <p className="section-description" id="requirements-description">
            그룹 참가자에게 요구하는 조건이 있다면 추가해주세요.
          </p>

          <div className="tag-input-group">
            <label htmlFor="new-requirement" className="sr-only">
              새 참가 조건 입력
            </label>
            <input
              type="text"
              id="new-requirement"
              value={newRequirement}
              onChange={e => setNewRequirement(e.target.value)}
              placeholder="예: 금연자, 새벽 일찍 출발 가능한 분"
              className="form-input"
              maxLength={100}
              onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              aria-describedby="requirements-description"
            />
            <button
              type="button"
              onClick={addRequirement}
              className="add-btn"
              aria-label="참가 조건 추가"
            >
              추가
            </button>
          </div>

          <div className="requirements-list" role="list" aria-label="참가 조건 목록">
            {formData.requirements.map((req, index) => (
              <div key={index} className="requirement-item" role="listitem">
                <span>• {req}</span>
                <button
                  type="button"
                  onClick={() => removeRequirement(req)}
                  className="remove-req"
                  aria-label={`${req} 조건 삭제`}
                >
                  <span aria-hidden="true">×</span>
                </button>
              </div>
            ))}
          </div>
        </fieldset>

        <div className="form-actions" role="group" aria-label="양식 제출 버튼">
          <button
            type="button"
            onClick={() => navigate('/groups')}
            className="cancel-btn"
            aria-label="그룹 생성 취소"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="submit-btn"
            aria-busy={isLoading}
            aria-label={isLoading ? '그룹 생성 중' : '그룹 만들기'}
          >
            {isLoading ? (
              '생성 중...'
            ) : (
              <>
                <SparklesIcon /> 그룹 만들기
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroup;
