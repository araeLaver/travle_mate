import type { CreateGroupRequest } from '../services/chatService';

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

export type Purpose = (typeof PURPOSE_OPTIONS)[number]['value'];

export interface CreateGroupFormState {
  name: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  purpose: Purpose;
  maxMembers: number;
}

export const formatDateInput = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isoDateDaysFromNow = (days: number, baseDate: Date = new Date()): string => {
  const date = new Date(baseDate);
  date.setDate(date.getDate() + days);
  return formatDateInput(date);
};

export const isValidIsoDate = (value: string): boolean => {
  const normalized = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false;
  const [year, month, day] = normalized.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
};

export const getCreateGroupValidationMessage = (
  form: CreateGroupFormState,
  today: Date = new Date()
): string | null => {
  const name = form.name.trim();
  const destination = form.destination.trim();
  const startDate = form.startDate.trim();
  const endDate = form.endDate.trim();

  if (!name) return '그룹 이름을 입력해주세요.';
  if (name.length < 2) return '그룹 이름은 2자 이상이어야 합니다.';
  if (name.length > GROUP_NAME_MAX_LENGTH) {
    return `그룹 이름은 ${GROUP_NAME_MAX_LENGTH}자 이하여야 합니다.`;
  }
  if (form.description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
    return `설명은 ${GROUP_DESCRIPTION_MAX_LENGTH}자 이하여야 합니다.`;
  }
  if (destination.length < 2) return '목적지를 2자 이상 입력해주세요.';
  if (destination.length > GROUP_DESTINATION_MAX_LENGTH) {
    return `목적지는 ${GROUP_DESTINATION_MAX_LENGTH}자 이하여야 합니다.`;
  }
  if (!isValidIsoDate(startDate) || !isValidIsoDate(endDate)) {
    return '날짜는 YYYY-MM-DD 형식으로 입력해주세요.';
  }

  const todayInput = formatDateInput(today);
  if (startDate < todayInput) {
    return '시작일은 오늘 또는 이후여야 합니다.';
  }
  if (endDate <= todayInput || endDate < startDate) {
    return '종료일은 시작일과 같거나 이후의 날짜여야 합니다.';
  }
  if (!MAX_MEMBERS_OPTIONS.includes(form.maxMembers)) {
    return '최대 인원을 다시 선택해주세요.';
  }

  return null;
};

export const toCreateGroupRequest = (form: CreateGroupFormState): CreateGroupRequest => ({
  name: form.name.trim(),
  description: form.description.trim(),
  destination: form.destination.trim(),
  startDate: form.startDate.trim(),
  endDate: form.endDate.trim(),
  purpose: form.purpose,
  maxMembers: form.maxMembers,
});
