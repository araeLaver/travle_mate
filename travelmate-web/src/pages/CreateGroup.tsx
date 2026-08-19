import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { groupService } from '../services/groupService';
import type { CreateGroupRequest } from '../services/groupService';
import { useToast } from '../components/Toast';
import { getErrorMessage, logError } from '../utils/errorHandler';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import { trackEvent } from '../utils/analytics';
import PageBackground from '../components/PageBackground';
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_DESTINATION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  MAX_MEMBERS_OPTIONS,
  PURPOSE_OPTIONS,
  createDefaultGroupForm,
  formatDateInput,
  getCreateGroupValidationMessage,
  getEndDateMinimum,
  parseDateInput,
} from './createGroupForm';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

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
  const [formData, setFormData] = useState<CreateGroupRequest>(() => createDefaultGroupForm());

  const [newTag, setNewTag] = useState('');
  const [newRequirement, setNewRequirement] = useState('');

  const validation = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(formData.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(formData.endDate);
    endDate.setHours(0, 0, 0, 0);
    const hasValidDates =
      !Number.isNaN(formData.startDate.getTime()) && !Number.isNaN(formData.endDate.getTime());

    return {
      name:
        formData.name.trim().length >= 2 && formData.name.trim().length <= GROUP_NAME_MAX_LENGTH,
      destination:
        formData.destination.trim().length >= 2 &&
        formData.destination.trim().length <= GROUP_DESTINATION_MAX_LENGTH,
      startDate: hasValidDates && startDate >= today,
      endDate: hasValidDates && endDate > today && endDate >= startDate,
      budget: !formData.budget || formData.budget.min <= formData.budget.max,
    };
  }, [formData]);

  const handleBlur = (field: keyof typeof touched) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const travelStyles = [
    { value: 'CULTURE', label: '문화탐방' },
    { value: 'NATURE', label: '자연관광' },
    { value: 'FOOD', label: '미식투어' },
    { value: 'ADVENTURE', label: '모험가' },
    { value: 'RELAXATION', label: '힐링여행' },
    { value: 'SHOPPING', label: '쇼핑' },
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

    setTouched({
      name: true,
      destination: true,
      startDate: true,
      endDate: true,
    });

    const validationMessage = getCreateGroupValidationMessage(formData);
    if (validationMessage) {
      toast.warning(validationMessage);
      return;
    }

    setIsLoading(true);

    try {
      await groupService.createGroup({
        ...formData,
        description: formData.description || '함께 여행할 메이트를 찾습니다!',
      });

      trackEvent('group_created');
      toast.success('그룹이 성공적으로 생성되었습니다!');
      navigate(`/groups`);
    } catch (error) {
      logError('CreateGroup.handleSubmit', error);
      toast.error(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-[#0a0a0b] relative overflow-hidden">
      <PageBackground />

      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 px-4 py-3">
        <div className="max-w-4xl mx-auto bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl rounded-2xl px-6 py-3 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/groups')}
                className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                aria-label="그룹 목록으로 돌아가기"
              >
                <span className="text-lg">←</span>
              </button>
              <Logo />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 pt-24 pb-8 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.header className="text-center mb-8" {...fadeInUp}>
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 mb-4">
              <span className="text-2xl">🗺️</span>
              <span className="text-gray-600 dark:text-gray-300 font-medium">새 그룹</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
              새 여행 그룹 만들기
            </h1>
            <p className="text-gray-500 dark:text-gray-400">함께할 여행 메이트들을 모집해보세요!</p>
          </motion.header>

          {/* Form */}
          <motion.form
            onSubmit={handleSubmit}
            className="space-y-6"
            aria-label="여행 그룹 생성 양식"
            noValidate
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {/* Basic Info */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span>✏️</span> 기본 정보
              </h2>

              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    그룹명 <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={e => handleInputChange('name', e.target.value)}
                    onBlur={() => handleBlur('name')}
                    placeholder="예: 🌸 봄 벚꽃 여행"
                    className={`w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 transition-all ${
                      touched.name && !validation.name
                        ? 'ring-2 ring-red-500 focus:ring-red-500'
                        : 'focus:ring-violet-500/50'
                    }`}
                    maxLength={GROUP_NAME_MAX_LENGTH}
                    required
                  />
                  {touched.name && !validation.name && (
                    <p className="mt-1 text-sm text-red-500" role="alert">
                      그룹명은 2~{GROUP_NAME_MAX_LENGTH}자로 입력해주세요
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="destination"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    목적지 <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="destination"
                    value={formData.destination}
                    onChange={e => handleInputChange('destination', e.target.value)}
                    onBlur={() => handleBlur('destination')}
                    placeholder="예: 제주도, 부산, 경주"
                    className={`w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 transition-all ${
                      touched.destination && !validation.destination
                        ? 'ring-2 ring-red-500 focus:ring-red-500'
                        : 'focus:ring-violet-500/50'
                    }`}
                    maxLength={GROUP_DESTINATION_MAX_LENGTH}
                    required
                  />
                  {touched.destination && !validation.destination && (
                    <p className="mt-1 text-sm text-red-500" role="alert">
                      목적지는 2~{GROUP_DESTINATION_MAX_LENGTH}자로 입력해주세요
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="description"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    그룹 설명
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    placeholder="어떤 여행을 계획하고 있는지 자세히 설명해주세요..."
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 transition-all resize-none"
                    rows={4}
                    maxLength={GROUP_DESCRIPTION_MAX_LENGTH}
                  />
                </div>
              </div>
            </div>

            {/* Schedule */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span>📅</span> 여행 일정
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="startDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    시작일 <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    value={formatDateInput(formData.startDate)}
                    onChange={e => handleInputChange('startDate', parseDateInput(e.target.value))}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                    min={formatDateInput(new Date())}
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="endDate"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    종료일 <span className="text-pink-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    value={formatDateInput(formData.endDate)}
                    onChange={e => handleInputChange('endDate', parseDateInput(e.target.value))}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                    min={formatDateInput(getEndDateMinimum(formData.startDate))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Group Settings */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span>👥</span> 그룹 설정
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label
                    htmlFor="maxMembers"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    최대 인원
                  </label>
                  <select
                    id="maxMembers"
                    value={formData.maxMembers}
                    onChange={e => handleInputChange('maxMembers', parseInt(e.target.value))}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                  >
                    {MAX_MEMBERS_OPTIONS.map(num => (
                      <option key={num} value={num}>
                        {num}명
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="purpose"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    여행 목적
                  </label>
                  <select
                    id="purpose"
                    value={formData.purpose || 'LEISURE'}
                    onChange={e => handleInputChange('purpose', e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                  >
                    {PURPOSE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="travelStyle"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    여행 스타일
                  </label>
                  <select
                    id="travelStyle"
                    value={formData.travelStyle}
                    onChange={e => handleInputChange('travelStyle', e.target.value)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                  >
                    {travelStyles.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Budget */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                <span>💰</span> 예산
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="minBudget"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    최소 예산 (원)
                  </label>
                  <input
                    type="number"
                    id="minBudget"
                    value={formData.budget?.min || 0}
                    onChange={e => handleBudgetChange('min', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                    min="0"
                    step="10000"
                  />
                </div>

                <div>
                  <label
                    htmlFor="maxBudget"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    최대 예산 (원)
                  </label>
                  <input
                    type="number"
                    id="maxBudget"
                    value={formData.budget?.max || 0}
                    onChange={e => handleBudgetChange('max', parseInt(e.target.value) || 0)}
                    className="w-full bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white focus:ring-2 focus:ring-violet-500/50 transition-all"
                    min="0"
                    step="10000"
                  />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <span>🏷️</span> 태그
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                여행의 특징을 나타내는 태그를 추가해주세요.
              </p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTag}
                  onChange={e => setNewTag(e.target.value)}
                  placeholder="태그 입력..."
                  className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 transition-all"
                  maxLength={20}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-3 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors"
                >
                  추가
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">인기 태그:</p>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => addPopularTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        formData.tags.includes(tag)
                          ? 'bg-violet-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                      disabled={formData.tags.includes(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-full text-sm"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-1 hover:bg-white/20 rounded-full w-4 h-4 flex items-center justify-center"
                        aria-label={`${tag} 태그 삭제`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Requirements */}
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
              <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-2 flex items-center gap-2">
                <span>📋</span> 참가 조건
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                그룹 참가자에게 요구하는 조건이 있다면 추가해주세요.
              </p>

              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newRequirement}
                  onChange={e => setNewRequirement(e.target.value)}
                  placeholder="예: 금연자, 새벽 일찍 출발 가능한 분"
                  className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 outline-none text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-violet-500/50 transition-all"
                  maxLength={100}
                  onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
                />
                <button
                  type="button"
                  onClick={addRequirement}
                  className="px-4 py-3 bg-violet-600 text-white font-medium rounded-xl hover:bg-violet-700 transition-colors"
                >
                  추가
                </button>
              </div>

              {formData.requirements.length > 0 && (
                <div className="space-y-2">
                  {formData.requirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-800 rounded-xl"
                    >
                      <span className="text-gray-700 dark:text-gray-300">• {req}</span>
                      <button
                        type="button"
                        onClick={() => removeRequirement(req)}
                        className="text-red-500 hover:text-red-600 p-1"
                        aria-label={`${req} 조건 삭제`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => navigate('/groups')}
                className="flex-1 py-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-4 bg-gradient-to-r from-violet-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-violet-500/25 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  '생성 중...'
                ) : (
                  <>
                    <span>✨</span> 그룹 만들기
                  </>
                )}
              </button>
            </div>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
