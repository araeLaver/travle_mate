import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupService, CreateGroupRequest } from '../services/groupService';
import './CreateGroup.css';

const CreateGroup: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
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
      currency: 'KRW'
    }
  });

  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const travelStyles = [
    '문화탐방', '자연관광', '미식투어', '모험가', '힐링여행', 
    '사진가', '배낭여행', '럭셔리 여행', '등산/트레킹', '도시탐험'
  ];

  const popularTags = [
    '맛집', '사진촬영', '박물관', '자연관광', '쇼핑', '카페투어',
    '야경', '축제', '해변', '산악', '역사', '예술', '음악', '스포츠'
  ];

  const handleInputChange = (field: keyof CreateGroupRequest, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBudgetChange = (field: 'min' | 'max', value: number) => {
    setFormData(prev => ({
      ...prev,
      budget: {
        ...prev.budget!,
        [field]: value
      }
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      handleInputChange('tags', [...formData.tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    handleInputChange('tags', formData.tags.filter(tag => tag !== tagToRemove));
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
    handleInputChange('requirements', formData.requirements.filter(req => req !== reqToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.destination.trim()) {
      alert('그룹명과 목적지는 필수 입력 사항입니다.');
      return;
    }

    if (formData.startDate >= formData.endDate) {
      alert('종료일은 시작일보다 늦어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      groupService.createGroup({
        ...formData,
        description: formData.description || '함께 여행할 메이트를 찾습니다!'
      });
      
      alert('🎉 그룹이 성공적으로 생성되었습니다!');
      navigate(`/groups`);
    } catch (error) {
      alert('그룹 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
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
      <div className="create-group-header">
        <button className="back-btn" onClick={() => navigate('/groups')}>
          ← 뒤로가기
        </button>
        <h1>🗺️ 새 여행 그룹 만들기</h1>
        <p>함께할 여행 메이트들을 모집해보세요!</p>
      </div>

      <form onSubmit={handleSubmit} className="create-group-form">
        <div className="form-section">
          <h3>📝 기본 정보</h3>
          
          <div className="form-group">
            <label htmlFor="name">그룹명 *</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="예: 🌸 봄 벚꽃 여행"
              className="form-input"
              maxLength={50}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="destination">목적지 *</label>
            <input
              type="text"
              id="destination"
              value={formData.destination}
              onChange={(e) => handleInputChange('destination', e.target.value)}
              placeholder="예: 제주도, 부산, 경주"
              className="form-input"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">그룹 설명</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="어떤 여행을 계획하고 있는지 자세히 설명해주세요..."
              className="form-textarea"
              rows={4}
              maxLength={500}
            />
          </div>
        </div>

        <div className="form-section">
          <h3>📅 여행 일정</h3>
          
          <div className="date-group">
            <div className="form-group">
              <label htmlFor="startDate">시작일</label>
              <input
                type="date"
                id="startDate"
                value={formatDate(formData.startDate)}
                onChange={(e) => handleInputChange('startDate', parseDate(e.target.value))}
                className="form-input"
                min={formatDate(new Date())}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endDate">종료일</label>
              <input
                type="date"
                id="endDate"
                value={formatDate(formData.endDate)}
                onChange={(e) => handleInputChange('endDate', parseDate(e.target.value))}
                className="form-input"
                min={formatDate(formData.startDate)}
                required
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>👥 그룹 설정</h3>
          
          <div className="form-group">
            <label htmlFor="maxMembers">최대 인원</label>
            <select
              id="maxMembers"
              value={formData.maxMembers}
              onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value))}
              className="form-select"
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <option key={num} value={num}>{num}명</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="travelStyle">여행 스타일</label>
            <select
              id="travelStyle"
              value={formData.travelStyle}
              onChange={(e) => handleInputChange('travelStyle', e.target.value)}
              className="form-select"
            >
              {travelStyles.map(style => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>💰 예산</h3>
          
          <div className="budget-group">
            <div className="form-group">
              <label htmlFor="minBudget">최소 예산 (원)</label>
              <input
                type="number"
                id="minBudget"
                value={formData.budget?.min || 0}
                onChange={(e) => handleBudgetChange('min', parseInt(e.target.value) || 0)}
                className="form-input"
                min="0"
                step="10000"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="maxBudget">최대 예산 (원)</label>
              <input
                type="number"
                id="maxBudget"
                value={formData.budget?.max || 0}
                onChange={(e) => handleBudgetChange('max', parseInt(e.target.value) || 0)}
                className="form-input"
                min="0"
                step="10000"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>🏷️ 태그</h3>
          <p className="section-description">여행의 특징을 나타내는 태그를 추가해주세요.</p>
          
          <div className="tag-input-group">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="태그 입력..."
              className="form-input"
              maxLength={20}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            />
            <button type="button" onClick={addTag} className="add-btn">추가</button>
          </div>

          <div className="popular-tags">
            <p>인기 태그:</p>
            <div className="popular-tags-grid">
              {popularTags.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addPopularTag(tag)}
                  className={`popular-tag ${formData.tags.includes(tag) ? 'selected' : ''}`}
                  disabled={formData.tags.includes(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="selected-tags">
            {formData.tags.map(tag => (
              <span key={tag} className="selected-tag">
                #{tag}
                <button type="button" onClick={() => removeTag(tag)} className="remove-tag">×</button>
              </span>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h3>📋 참가 조건</h3>
          <p className="section-description">그룹 참가자에게 요구하는 조건이 있다면 추가해주세요.</p>
          
          <div className="tag-input-group">
            <input
              type="text"
              value={newRequirement}
              onChange={(e) => setNewRequirement(e.target.value)}
              placeholder="예: 금연자, 새벽 일찍 출발 가능한 분"
              className="form-input"
              maxLength={100}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
            />
            <button type="button" onClick={addRequirement} className="add-btn">추가</button>
          </div>

          <div className="requirements-list">
            {formData.requirements.map((req, index) => (
              <div key={index} className="requirement-item">
                <span>• {req}</span>
                <button type="button" onClick={() => removeRequirement(req)} className="remove-req">×</button>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate('/groups')} className="cancel-btn">
            취소
          </button>
          <button type="submit" disabled={isLoading} className="submit-btn">
            {isLoading ? '생성 중...' : '✨ 그룹 만들기'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateGroup;