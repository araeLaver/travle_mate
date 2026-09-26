import type { CreateGroupRequest } from '../services/groupService';

export const GROUP_NAME_MAX_LENGTH = 100;
export const GROUP_DESCRIPTION_MAX_LENGTH = 1000;
export const GROUP_DESTINATION_MAX_LENGTH = 100;

export const MAX_MEMBERS_OPTIONS = [2, 4, 6, 10, 20];

export const PURPOSE_OPTIONS = [
  { value: 'LEISURE', label: '여가' },
  { value: 'BUSINESS', label: '업무' },
  { value: 'EDUCATION', label: '학습' },
  { value: 'MEDICAL', label: '의료' },
  { value: 'FAMILY', label: '가족' },
  { value: 'OTHER', label: '기타' },
] as const;

const isValidDate = (date: Date): boolean => !Number.isNaN(date.getTime());

export const formatDateInput = (date: Date): string => {
  if (!isValidDate(date)) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseDateInput = (value: string): Date => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return new Date(Number.NaN);
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return new Date(Number.NaN);
  }
  return date;
};

export const dateDaysFromNow = (days: number, baseDate: Date = new Date()): Date => {
  const date = new Date(baseDate);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const startOfDate = (date: Date): Date => {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);
  return normalized;
};

export const getEndDateMinimum = (startDate: Date, today: Date = new Date()): Date => {
  const tomorrow = dateDaysFromNow(1, today);
  if (!isValidDate(startDate)) return tomorrow;
  const normalizedStart = startOfDate(startDate);
  return normalizedStart > tomorrow ? normalizedStart : tomorrow;
};

export const createDefaultGroupForm = (baseDate: Date = new Date()): CreateGroupRequest => ({
  name: '',
  description: '',
  destination: '',
  startDate: dateDaysFromNow(7, baseDate),
  endDate: dateDaysFromNow(10, baseDate),
  maxMembers: 4,
  purpose: 'LEISURE',
  tags: [],
  travelStyle: 'CULTURE',
  requirements: [],
  budget: {
    min: 100000,
    max: 300000,
    currency: 'KRW',
  },
});

export const getCreateGroupValidationMessage = (
  form: CreateGroupRequest,
  today: Date = new Date()
): string | null => {
  const name = form.name.trim();
  const destination = form.destination.trim();
  const todayStart = startOfDate(today);
  const startDate = startOfDate(form.startDate);
  const endDate = startOfDate(form.endDate);

  if (!name) return '그룹명을 입력해주세요.';
  if (name.length < 2 || name.length > GROUP_NAME_MAX_LENGTH) {
    return `그룹명은 2~${GROUP_NAME_MAX_LENGTH}자로 입력해주세요.`;
  }
  if (form.description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
    return `설명은 ${GROUP_DESCRIPTION_MAX_LENGTH}자 이하여야 합니다.`;
  }
  if (destination.length < 2 || destination.length > GROUP_DESTINATION_MAX_LENGTH) {
    return `목적지는 2~${GROUP_DESTINATION_MAX_LENGTH}자로 입력해주세요.`;
  }
  if (!isValidDate(form.startDate) || !isValidDate(form.endDate)) {
    return '여행 날짜를 다시 선택해주세요.';
  }
  if (startDate < todayStart) {
    return '시작일은 오늘 또는 이후여야 합니다.';
  }
  if (endDate <= todayStart || endDate < startDate) {
    return '종료일은 오늘 이후이고 시작일과 같거나 이후여야 합니다.';
  }
  if (!MAX_MEMBERS_OPTIONS.includes(form.maxMembers)) {
    return '최대 인원을 다시 선택해주세요.';
  }
  if (!form.budget || form.budget.min > form.budget.max) {
    return '최대 예산이 최소 예산보다 크거나 같아야 합니다.';
  }

  return null;
};
