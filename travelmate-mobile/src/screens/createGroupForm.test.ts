import { describe, expect, it } from '@jest/globals';
import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_DESTINATION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  MAX_MEMBERS_OPTIONS,
  PURPOSE_OPTIONS,
  getCreateGroupValidationMessage,
  isoDateDaysFromNow,
  toCreateGroupRequest,
} from './createGroupForm';
import type { CreateGroupFormState } from './createGroupForm';

const today = new Date(2026, 6, 27);

const validForm: CreateGroupFormState = {
  name: '제주 여행',
  description: '렌터카로 동쪽 코스를 함께 이동합니다.',
  destination: '제주도',
  startDate: '2026-07-27',
  endDate: '2026-07-28',
  purpose: 'LEISURE',
  maxMembers: 4,
};

describe('createGroupForm', () => {
  it('accepts the backend CreateRequest field limits and purpose enum', () => {
    expect(PURPOSE_OPTIONS.map(option => option.value)).toContain('MEDICAL');
    expect(MAX_MEMBERS_OPTIONS).toEqual([2, 4, 6, 10, 20]);

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          name: '가'.repeat(GROUP_NAME_MAX_LENGTH),
          description: '나'.repeat(GROUP_DESCRIPTION_MAX_LENGTH),
          destination: '다'.repeat(GROUP_DESTINATION_MAX_LENGTH),
          purpose: 'MEDICAL',
          maxMembers: 20,
        },
        today
      )
    ).toBeNull();
  });

  it('rejects fields that exceed backend length constraints', () => {
    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          name: '가'.repeat(GROUP_NAME_MAX_LENGTH + 1),
        },
        today
      )
    ).toBe(`그룹 이름은 ${GROUP_NAME_MAX_LENGTH}자 이하여야 합니다.`);

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
    ).toBe(`목적지는 ${GROUP_DESTINATION_MAX_LENGTH}자 이하여야 합니다.`);
  });

  it('validates required dates against backend future constraints', () => {
    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          startDate: '2026-02-30',
        },
        today
      )
    ).toBe('날짜는 YYYY-MM-DD 형식으로 입력해주세요.');

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          startDate: '2026-07-26',
        },
        today
      )
    ).toBe('시작일은 오늘 또는 이후여야 합니다.');

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          endDate: '2026-07-27',
        },
        today
      )
    ).toBe('종료일은 시작일과 같거나 이후의 날짜여야 합니다.');

    expect(
      getCreateGroupValidationMessage(
        {
          ...validForm,
          startDate: '2026-07-30',
          endDate: '2026-07-29',
        },
        today
      )
    ).toBe('종료일은 시작일과 같거나 이후의 날짜여야 합니다.');
  });

  it('rejects maxMembers values outside the supported backend range choices', () => {
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

  it('builds the service request with trimmed values', () => {
    expect(
      toCreateGroupRequest({
        ...validForm,
        name: '  의료 동행  ',
        description: '  병원 근처 숙소 공유  ',
        destination: '  오사카  ',
        startDate: '  2026-08-01  ',
        endDate: '  2026-08-03  ',
        purpose: 'MEDICAL',
        maxMembers: 2,
      })
    ).toEqual({
      name: '의료 동행',
      description: '병원 근처 숙소 공유',
      destination: '오사카',
      startDate: '2026-08-01',
      endDate: '2026-08-03',
      purpose: 'MEDICAL',
      maxMembers: 2,
    });
  });

  it('creates default ISO dates from a stable base date', () => {
    expect(isoDateDaysFromNow(3, new Date(2026, 0, 30))).toBe('2026-02-02');
  });
});
