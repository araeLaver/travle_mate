-- V2: Add Performance Indexes for TravelMate Application

-- User 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_email ON travelmate.users(email);
CREATE INDEX IF NOT EXISTS idx_user_nickname ON travelmate.users(nickname);
CREATE INDEX IF NOT EXISTS idx_user_location ON travelmate.users(current_latitude, current_longitude) WHERE is_location_enabled = true;
CREATE INDEX IF NOT EXISTS idx_user_active ON travelmate.users(is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_rating ON travelmate.users(rating DESC) WHERE rating IS NOT NULL;

-- TravelGroup 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_travel_group_status ON travelmate.travel_groups(status);
CREATE INDEX IF NOT EXISTS idx_travel_group_location ON travelmate.travel_groups(destination_latitude, destination_longitude);
CREATE INDEX IF NOT EXISTS idx_travel_group_dates ON travelmate.travel_groups(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_travel_group_creator ON travelmate.travel_groups(creator_id);

-- GroupMember 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_group_member_user ON travelmate.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_member_group ON travelmate.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_member_status ON travelmate.group_members(status);
CREATE INDEX IF NOT EXISTS idx_group_member_composite ON travelmate.group_members(group_id, user_id, status);

-- Chat 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_group ON travelmate.chats(group_id);
CREATE INDEX IF NOT EXISTS idx_chat_created ON travelmate.chats(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_type ON travelmate.chats(chat_type);

-- ChatMessage 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_message_chat ON travelmate.chat_messages(chat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_message_sender ON travelmate.chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_message_type ON travelmate.chat_messages(message_type);

-- ChatParticipant 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_chat_participant_chat ON travelmate.chat_participants(chat_id);
CREATE INDEX IF NOT EXISTS idx_chat_participant_user ON travelmate.chat_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_participant_composite ON travelmate.chat_participants(chat_id, user_id);

-- Post 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_post_author ON travelmate.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_post_created ON travelmate.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_category ON travelmate.posts(category);
CREATE INDEX IF NOT EXISTS idx_post_status ON travelmate.posts(status);
CREATE INDEX IF NOT EXISTS idx_post_location ON travelmate.posts(location);

-- PostLike 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_post_like_post ON travelmate.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_like_user ON travelmate.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_like_composite ON travelmate.post_likes(post_id, user_id);

-- Comment 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_comment_post ON travelmate.comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comment_author ON travelmate.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comment_parent ON travelmate.comments(parent_comment_id);

-- UserReview 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_user_review_reviewee ON travelmate.user_reviews(reviewee_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_review_reviewer ON travelmate.user_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_user_review_rating ON travelmate.user_reviews(rating DESC);

-- MatchRequest 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_match_request_sender ON travelmate.match_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_match_request_receiver ON travelmate.match_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_match_request_status ON travelmate.match_requests(status);
CREATE INDEX IF NOT EXISTS idx_match_request_composite ON travelmate.match_requests(receiver_id, status, created_at DESC);

-- Notification 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_notification_user ON travelmate.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_read ON travelmate.notifications(user_id, is_read, created_at DESC);

-- RefreshToken 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_refresh_token_user ON travelmate.refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_token_expiry ON travelmate.refresh_tokens(expires_at);

-- 복합 인덱스 (자주 사용되는 쿼리 최적화)
CREATE INDEX IF NOT EXISTS idx_user_matching ON travelmate.users(is_matching_enabled, is_location_enabled, is_active)
    WHERE is_matching_enabled = true AND is_location_enabled = true AND is_active = true;

CREATE INDEX IF NOT EXISTS idx_group_active ON travelmate.travel_groups(status, start_date, end_date)
    WHERE status = 'ACTIVE';

-- 인덱스 생성 완료
COMMENT ON INDEX travelmate.idx_user_email IS '이메일 조회 성능 향상';
COMMENT ON INDEX travelmate.idx_user_nickname IS '닉네임 중복 체크 성능 향상';
COMMENT ON INDEX travelmate.idx_user_location IS '주변 사용자 검색 성능 향상';
COMMENT ON INDEX travelmate.idx_chat_message_chat IS '채팅 메시지 조회 성능 향상';
COMMENT ON INDEX travelmate.idx_user_matching IS '매칭 가능한 사용자 검색 성능 향상';
