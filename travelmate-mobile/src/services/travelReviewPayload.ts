export type TravelReviewRatingKey =
  | 'punctuality'
  | 'manner'
  | 'communication'
  | 'retravelWillingness';

export type TravelReviewRatings = Record<TravelReviewRatingKey, number>;

export interface CreateTravelReviewPayload {
  revieweeId: number;
  matchRequestId: number;
  punctualityScore: number;
  mannersScore: number;
  communicationScore: number;
  wouldTravelAgain: boolean;
  comment?: string;
}

interface BuildTravelReviewPayloadInput {
  matchId: number;
  revieweeId: number;
  ratings: TravelReviewRatings;
  comment: string;
}

const NUMERIC_REVIEW_FIELDS: TravelReviewRatingKey[] = [
  'punctuality',
  'manner',
  'communication',
];

const REQUIRED_REVIEW_FIELDS: TravelReviewRatingKey[] = [
  ...NUMERIC_REVIEW_FIELDS,
  'retravelWillingness',
];

const assertValidId = (value: number, fieldName: string) => {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${fieldName} must be a positive integer`);
  }
};

const assertValidRating = (value: number, fieldName: string) => {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    throw new Error(`${fieldName} must be an integer from 1 to 5`);
  }
};

export const hasCompleteTravelReviewRatings = (ratings: TravelReviewRatings): boolean =>
  REQUIRED_REVIEW_FIELDS.every((key) => ratings[key] >= 1);

export const calculateTravelReviewAverage = (ratings: TravelReviewRatings): number =>
  NUMERIC_REVIEW_FIELDS.reduce((sum, key) => sum + ratings[key], 0) / NUMERIC_REVIEW_FIELDS.length;

export const buildTravelReviewPayload = ({
  matchId,
  revieweeId,
  ratings,
  comment,
}: BuildTravelReviewPayloadInput): CreateTravelReviewPayload => {
  assertValidId(matchId, 'matchId');
  assertValidId(revieweeId, 'revieweeId');
  REQUIRED_REVIEW_FIELDS.forEach((key) => assertValidRating(ratings[key], key));

  const trimmedComment = comment.trim();

  return {
    revieweeId,
    matchRequestId: matchId,
    punctualityScore: ratings.punctuality,
    mannersScore: ratings.manner,
    communicationScore: ratings.communication,
    wouldTravelAgain: ratings.retravelWillingness >= 4,
    ...(trimmedComment ? { comment: trimmedComment } : {}),
  };
};
