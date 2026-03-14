import React, { useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFollowers, useFollowing, useFollowToggle } from '../../hooks/useFollow';
import { FollowUserResponse } from '../../services/followService';
import './FollowerList.css';

// SVG Icons
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

interface FollowerListProps {
  userId: number;
  type: 'followers' | 'following';
  isOwnProfile: boolean;
  onClose?: () => void;
}

interface FollowerItemProps {
  user: FollowUserResponse;
  isOwnProfile: boolean;
  onFollowToggle: (userId: number, isFollowing: boolean) => void;
  isToggling: boolean;
}

const FollowerItem: React.FC<FollowerItemProps> = ({
  user,
  isOwnProfile,
  onFollowToggle,
  isToggling,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="follower-item">
      <Link to={`/profile/${user.id}`} className="follower-info">
        <div className="follower-avatar">
          {user.profileImageUrl ? (
            <img src={user.profileImageUrl} alt={user.nickname} />
          ) : (
            <div className="avatar-placeholder" data-testid={`avatar-placeholder-${user.id}`}>
              <UserIcon />
            </div>
          )}
          {user.isMutual && (
            <div className="mutual-badge" title="맞팔로우" data-testid="mutual-badge">
              <UsersIcon />
            </div>
          )}
        </div>
        <div className="follower-details">
          <span className="follower-nickname">{user.nickname}</span>
          {user.bio && <span className="follower-bio">{user.bio}</span>}
          {user.followedAt && <span className="follower-date">{formatDate(user.followedAt)}</span>}
        </div>
      </Link>

      {isOwnProfile && (
        <button
          className={`follow-btn ${user.isMutual ? 'following' : ''}`}
          onClick={() => onFollowToggle(user.id, user.isMutual)}
          disabled={isToggling}
        >
          {user.isMutual ? (
            <>
              <CheckIcon />
              <span>팔로잉</span>
            </>
          ) : (
            <span>팔로우</span>
          )}
        </button>
      )}
    </div>
  );
};

const FollowerList: React.FC<FollowerListProps> = ({ userId, type, isOwnProfile, onClose }) => {
  const observerTarget = useRef<HTMLDivElement>(null);
  const { toggle, isLoading: isToggling } = useFollowToggle();

  // 팔로워 또는 팔로잉 목록 조회
  const followersQuery = useFollowers(userId);
  const followingQuery = useFollowing(userId);

  const query = type === 'followers' ? followersQuery : followingQuery;
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, error } = query;

  // 무한 스크롤
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  React.useEffect(() => {
    const element = observerTarget.current;
    const option = { threshold: 0 };

    const observer = new IntersectionObserver(handleObserver, option);
    if (element) observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, [handleObserver]);

  const handleFollowToggle = async (targetUserId: number, isCurrentlyFollowing: boolean) => {
    try {
      await toggle(targetUserId, isCurrentlyFollowing);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('팔로우 토글 실패:', error);
    }
  };

  const allUsers = data?.pages.flatMap(page => page.content) || [];
  const totalCount = data?.pages[0]?.totalElements || 0;

  if (isLoading) {
    return (
      <div className="follower-list-container">
        <div className="follower-list-header">
          <h3>{type === 'followers' ? '팔로워' : '팔로잉'}</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="follower-list-loading">
          <div className="loading-spinner" />
          <p>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="follower-list-container">
        <div className="follower-list-header">
          <h3>{type === 'followers' ? '팔로워' : '팔로잉'}</h3>
          {onClose && (
            <button className="close-btn" onClick={onClose}>
              ×
            </button>
          )}
        </div>
        <div className="follower-list-error">
          <p>목록을 불러오는데 실패했습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="follower-list-container">
      <div className="follower-list-header">
        <h3>
          {type === 'followers' ? '팔로워' : '팔로잉'}
          <span className="count">{totalCount}</span>
        </h3>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="follower-list">
        {allUsers.length === 0 ? (
          <div className="follower-list-empty">
            <UserIcon />
            <p>
              {type === 'followers'
                ? '아직 팔로워가 없습니다.'
                : '아직 팔로우하는 사람이 없습니다.'}
            </p>
          </div>
        ) : (
          <>
            {allUsers.map(user => (
              <FollowerItem
                key={user.id}
                user={user}
                isOwnProfile={isOwnProfile}
                onFollowToggle={handleFollowToggle}
                isToggling={isToggling}
              />
            ))}

            {/* 무한 스크롤 트리거 */}
            <div ref={observerTarget} className="scroll-trigger">
              {isFetchingNextPage && (
                <div className="loading-more">
                  <div className="loading-spinner small" />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FollowerList;
