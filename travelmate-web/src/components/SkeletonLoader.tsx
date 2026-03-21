import React from 'react';

// 공통 펄스 베이스 클래스
const pulse = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

// ProfileSkeleton: 프로필 카드 스켈레톤
export const ProfileSkeleton: React.FC = () => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
    <div className="flex items-center gap-4 mb-4">
      {/* Avatar */}
      <div className={`${pulse} w-16 h-16 rounded-full flex-shrink-0`} />
      <div className="flex-1 space-y-2">
        {/* Name */}
        <div className={`${pulse} h-4 w-1/3`} />
        {/* Sub info */}
        <div className={`${pulse} h-3 w-1/2`} />
      </div>
    </div>
    {/* Bio */}
    <div className="space-y-2 mb-4">
      <div className={`${pulse} h-3 w-full`} />
      <div className={`${pulse} h-3 w-4/5`} />
    </div>
    {/* Tags */}
    <div className="flex gap-2 mb-4">
      <div className={`${pulse} h-6 w-16 rounded-full`} />
      <div className={`${pulse} h-6 w-20 rounded-full`} />
      <div className={`${pulse} h-6 w-14 rounded-full`} />
    </div>
    {/* Buttons */}
    <div className="flex gap-3">
      <div className={`${pulse} h-10 flex-1 rounded-xl`} />
      <div className={`${pulse} h-10 flex-1 rounded-xl`} />
    </div>
  </div>
);

// PostCardSkeleton: 피드 카드 스켈레톤
export const PostCardSkeleton: React.FC = () => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-gray-200/50 dark:border-gray-800/50 shadow-lg overflow-hidden">
    {/* Image area */}
    <div className={`${pulse} w-full h-48`} />
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className={`${pulse} w-10 h-10 rounded-full flex-shrink-0`} />
        <div className="flex-1 space-y-2">
          <div className={`${pulse} h-3 w-1/3`} />
          <div className={`${pulse} h-3 w-1/4`} />
        </div>
      </div>
      {/* Content */}
      <div className="space-y-2 mb-3">
        <div className={`${pulse} h-4 w-3/4`} />
        <div className={`${pulse} h-3 w-full`} />
        <div className={`${pulse} h-3 w-5/6`} />
      </div>
      {/* Footer */}
      <div className="flex gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className={`${pulse} h-6 w-16 rounded-full`} />
        <div className={`${pulse} h-6 w-16 rounded-full`} />
      </div>
    </div>
  </div>
);

// MatchCardSkeleton: 매칭 카드 스켈레톤
export const MatchCardSkeleton: React.FC = () => (
  <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl p-6 border border-gray-200/50 dark:border-gray-800/50 shadow-lg">
    <div className="flex gap-4 mb-4">
      {/* Avatar */}
      <div className={`${pulse} w-[72px] h-[72px] rounded-full flex-shrink-0`} />
      <div className="flex-1 space-y-2">
        {/* Name + age */}
        <div className="flex items-center gap-2">
          <div className={`${pulse} h-5 w-24`} />
          <div className={`${pulse} h-4 w-10`} />
        </div>
        {/* Mood */}
        <div className={`${pulse} h-4 w-20`} />
        {/* Distance */}
        <div className={`${pulse} h-3 w-32`} />
      </div>
    </div>
    {/* Tags */}
    <div className="flex gap-2 mb-3">
      <div className={`${pulse} h-6 w-16 rounded-full`} />
      <div className={`${pulse} h-6 w-20 rounded-full`} />
      <div className={`${pulse} h-6 w-14 rounded-full`} />
    </div>
    {/* Bio */}
    <div className={`${pulse} h-3 w-3/4 mb-4`} />
    {/* Match score bar */}
    <div className="mb-4">
      <div className="flex justify-between mb-2">
        <div className={`${pulse} h-3 w-12`} />
        <div className={`${pulse} h-3 w-8`} />
      </div>
      <div className={`${pulse} h-2 w-full rounded-full`} />
    </div>
    {/* Buttons */}
    <div className="flex gap-3">
      <div className={`${pulse} h-11 flex-1 rounded-xl`} />
      <div className={`${pulse} h-11 flex-1 rounded-xl`} />
    </div>
  </div>
);

// ListItemSkeleton: 일반 리스트 아이템 스켈레톤
export const ListItemSkeleton: React.FC = () => (
  <div className="flex items-center gap-4 p-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl border border-gray-200/50 dark:border-gray-800/50">
    {/* Icon/avatar */}
    <div className={`${pulse} w-12 h-12 rounded-xl flex-shrink-0`} />
    <div className="flex-1 space-y-2">
      {/* Title */}
      <div className={`${pulse} h-4 w-1/2`} />
      {/* Subtitle */}
      <div className={`${pulse} h-3 w-3/4`} />
    </div>
    {/* Action area */}
    <div className={`${pulse} h-8 w-16 rounded-lg flex-shrink-0`} />
  </div>
);

// SkeletonList: 반복 스켈레톤 헬퍼 (count 개수만큼 렌더)
interface SkeletonListProps {
  count?: number;
  skeleton: React.ReactNode;
  className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
  count = 3,
  skeleton,
  className = 'space-y-4',
}) => (
  <div className={className}>
    {Array.from({ length: count }).map((_, i) => (
      <React.Fragment key={i}>{skeleton}</React.Fragment>
    ))}
  </div>
);

const SkeletonLoader = {
  ProfileSkeleton,
  PostCardSkeleton,
  MatchCardSkeleton,
  ListItemSkeleton,
  SkeletonList,
};

export default SkeletonLoader;
