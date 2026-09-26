import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_DESTINATION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  MAX_MEMBERS_OPTIONS,
  PURPOSE_OPTIONS,
  createDefaultGroupForm,
  dateDaysFromNow,
  formatDateInput,
  getCreateGroupValidationMessage,
  getEndDateMinimum,
  parseDateInput,
} from './createGroupForm';

const today = new Date(2026, 6, 27);
const validForm = {
  ...createDefaultGroupForm(today),
  name: '제주 여행',
  description: '렌터카로 동쪽 코스를 함께 이동합니다.',
  destination: '제주도',
};

describe('createGroupForm', () => {
  it('accepts backend CreateRequest limits and purpose enum values', () => {
    expect(PURPOSE_OPTIONS.map(option => option.value)).toContain('MEDICAL');
    expect(MAX_MEMBERS_OPTIONS).toEqual([2, 4, 6, 10, 20]);

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          name: '가'.repeat(GROUP_NAME_MAX_LENGTH),
          description: '나'.repeat(GROUP_DESCRIPTION_MAX_LENGTH),
          destination: '다'.repeat(GROUP_DESTINATION_MAX_LENGTH),
          startDate: parseDateInput('2026-08-01'),
          endDate: parseDateInput('2026-08-01'),
          purpose: 'MEDICAL',
          maxMembers: 20,
        },
        today
      )
    ).toBeNull();
  });

  it('rejects old frontend-only limits and invalid max member choices', () => {
    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          name: '가'.repeat(GROUP_NAME_MAX_LENGTH + 1),
        },
        today
      )
    ).toBe(`그룹명은 2~${GROUP_NAME_MAX_LENGTH}자로 입력해주세요.`);

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          description: '나'.repeat(GROUP_DESCRIPTION_MAX_LENGTH + 1),
        },
        today
      )
    ).toBe(`설명은 ${GROUP_DESCRIPTION_MAX_LENGTH}자 이하여야 합니다.`);

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          destination: '다'.repeat(GROUP_DESTINATION_MAX_LENGTH + 1),
        },
        today
      )
    ).toBe(`목적지는 2~${GROUP_DESTINATION_MAX_LENGTH}자로 입력해주세요.`);

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          maxMembers: 3,
        },
        today
      )
    ).toBe('최대 인원을 다시 선택해주세요.');
  });

  it('validates start and end dates using backend future constraints', () => {
    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          startDate: parseDateInput('2026-02-30'),
        },
        today
      )
    ).toBe('여행 날짜를 다시 선택해주세요.');

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          startDate: parseDateInput('2026-07-26'),
        },
        today
      )
    ).toBe('시작일은 오늘 또는 이후여야 합니다.');

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          endDate: parseDateInput('2026-07-27'),
        },
        today
      )
    ).toBe('종료일은 오늘 이후이고 시작일과 같거나 이후여야 합니다.');

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          startDate: parseDateInput('2026-08-02'),
          endDate: parseDateInput('2026-08-01'),
        },
        today
      )
    ).toBe('종료일은 오늘 이후이고 시작일과 같거나 이후여야 합니다.');
  });

  it('formats and parses date input without UTC day shifting', () => {
    const lateLocalDate = new Date(2026, 7, 1, 23, 30);

    expect(formatDateInput(lateLocalDate)).toBe('2026-08-01');
    expect(formatDateInput(parseDateInput('2026-08-01'))).toBe('2026-08-01');
    expect(formatDateInput(dateDaysFromNow(3, new Date(2026, 0, 30)))).toBe('2026-02-02');
  });

  it('keeps the end-date picker minimum aligned with backend Future validation', () => {
    expect(formatDateInput(getEndDateMinimum(parseDateInput('2026-07-27'), today))).toBe(
      '2026-07-28'
    );
    expect(formatDateInput(getEndDateMinimum(parseDateInput('2026-08-05'), today))).toBe(
      '2026-08-05'
    );
  });
});
