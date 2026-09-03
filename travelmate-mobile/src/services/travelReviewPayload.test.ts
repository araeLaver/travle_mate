import { describe, expect, it } from '@jest/globals';
import {
  buildTravelReviewPayload,
  calculateTravelReviewAverage,
  hasCompleteTravelReviewRatings,
  TravelReviewRatings,
} from './travelReviewPayload';

const completeRatings: TravelReviewRatings = {
  punctuality: 5,
  manner: 4,
  communication: 3,
  retravelWillingness: 4,
};

describe('travelReviewPayload', () => {
  it('builds the backend CreateReviewRequest contract', () => {
    expect(
      buildTravelReviewPayload({
        matchId: 42,
        revieweeId: 7,
        ratings: completeRatings,
        comment: '  좋은 동행이었습니다.  ',
      })
    ).toEqual({
      revieweeId: 7,
      matchRequestId: 42,
      punctualityScore: 5,
      mannersScore: 4,
      communicationScore: 3,
      wouldTravelAgain: true,
      comment: '좋은 동행이었습니다.',
    });
  });

  it('omits empty comments and converts low willingness to false', () => {
    expect(
      buildTravelReviewPayload({
        matchId: 42,
        revieweeId: 7,
        ratings: {
          ...completeRatings,
          retravelWillingness: 3,
        },
        comment: '   ',
      })
    ).toEqual({
      revieweeId: 7,
      matchRequestId: 42,
      punctualityScore: 5,
      mannersScore: 4,
      communicationScore: 3,
      wouldTravelAgain: false,
    });
  });

  it('calculates the displayed average from backend numeric score fields only', () => {
    expect(calculateTravelReviewAverage(completeRatings)).toBe(4);
  });

  it('detects incomplete ratings before submitting', () => {
    expect(
      hasCompleteTravelReviewRatings({
        ...completeRatings,
        communication: 0,
      })
    ).toBe(false);
  });

  it('rejects invalid ids and ratings', () => {
    expect(() =>
      buildTravelReviewPayload({
        matchId: 0,
        revieweeId: 7,
        ratings: completeRatings,
        comment: '',
      })
    ).toThrow('matchId');

    expect(() =>
      buildTravelReviewPayload({
        matchId: 42,
        revieweeId: 7,
        ratings: {
          ...completeRatings,
          punctuality: 6,
        },
        comment: '',
      })
    ).toThrow('punctuality');
  });
});
